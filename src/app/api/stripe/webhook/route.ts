import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sql } from "@/db/client";
import { syncSubscriptionStatus } from "@/lib/subscription";
import { sendSubscriptionRenewalReminderEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/mobile/fcm";
import logger from "@/lib/logger";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 * Recebe eventos do Stripe via webhook
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.error(err, "Stripe webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(subscription);
        break;
      }

      case "invoice.upcoming": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleUpcomingInvoice(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        logger.info({ type: event.type }, "Unhandled Stripe event");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error, eventType: event.type }, "Error processing Stripe webhook");
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const groupId = session.metadata?.group_id;
  const userId = session.metadata?.user_id;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!groupId || !userId || !subscriptionId) {
    logger.warn({ session: session.id }, "Checkout session missing metadata");
    return;
  }

  // Verificar se já existe registro
  const [existing] = await sql`
    SELECT id FROM group_subscriptions
    WHERE stripe_subscription_id = ${subscriptionId}
  `;

  if (!existing) {
    // Buscar detalhes da assinatura
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    const item = subscription.items.data[0];

    // Resolver plan_id a partir dos metadados ou do stripe_price_id
    const metadataPlanId = session.metadata?.plan_id || subscription.metadata?.plan_id;
    const stripePriceId = item?.price?.id || null;

    let planId: string | null = null;
    if (metadataPlanId) {
      planId = metadataPlanId;
    } else if (stripePriceId) {
      const [matchedPlan] = await sql`
        SELECT id FROM subscription_plans
        WHERE stripe_price_id = ${stripePriceId}
        LIMIT 1
      `;
      if (matchedPlan) planId = matchedPlan.id;
    }

    await sql`
      INSERT INTO group_subscriptions (
        group_id, user_id, stripe_subscription_id, stripe_customer_id,
        status, current_period_start, current_period_end, trial_end,
        plan_id, stripe_price_id
      ) VALUES (
        ${groupId},
        ${userId},
        ${subscriptionId},
        ${customerId},
        ${subscription.status},
        ${item ? new Date(item.current_period_start * 1000).toISOString() : null}::timestamp,
        ${item ? new Date(item.current_period_end * 1000).toISOString() : null}::timestamp,
        ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null}::timestamp,
        ${planId},
        ${stripePriceId}
      )
    `;
  }

  // Ativar o grupo
  await sql`
    UPDATE groups
    SET status = 'active',
        status_reason = NULL,
        status_updated_at = NOW()
    WHERE id = ${groupId}
      AND status IN ('pending', 'pending_payment')
  `;

  logger.info(
    { groupId, userId, subscriptionId },
    "Group subscription activated via checkout"
  );
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  await syncSubscriptionStatus(
    subscription.id,
    subscription.status,
    item?.current_period_start,
    item?.current_period_end,
    subscription.trial_end,
    subscription.canceled_at
  );

  logger.info(
    { subscriptionId: subscription.id, status: subscription.status },
    "Subscription updated"
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  await syncSubscriptionStatus(
    subscription.id,
    "canceled",
    item?.current_period_start,
    item?.current_period_end,
    subscription.trial_end,
    subscription.canceled_at ?? Math.floor(Date.now() / 1000)
  );

  logger.info(
    { subscriptionId: subscription.id },
    "Subscription canceled"
  );
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId =
    invoice.parent?.subscription_details?.subscription as string | null;
  if (!subscriptionId) return;

  const [sub] = await sql`
    SELECT group_id FROM group_subscriptions
    WHERE stripe_subscription_id = ${subscriptionId}
  `;

  if (sub) {
    logger.warn(
      { groupId: sub.group_id, subscriptionId, invoiceId: invoice.id },
      "Payment failed for group subscription"
    );
  }
}

async function handleUpcomingInvoice(invoice: Stripe.Invoice) {
  const subscriptionId =
    (invoice.parent?.subscription_details?.subscription as string | null) ??
    ((invoice as unknown as { subscription?: string }).subscription ?? null);
  if (!subscriptionId) return;

  const amountDue = invoice.amount_due ?? 0;
  if (amountDue <= 0) {
    logger.info({ subscriptionId, amountDue }, "Skipping upcoming invoice reminder for zero-amount invoice");
    return;
  }

  const [sub] = await sql<{
    group_id: string;
    group_name: string;
    user_id: string;
    user_name: string;
    user_email: string;
    status: string;
    current_period_end: string | null;
  }[]>`
    SELECT
      gs.group_id,
      g.name AS group_name,
      gs.user_id,
      u.name AS user_name,
      u.email AS user_email,
      gs.status,
      gs.current_period_end
    FROM group_subscriptions gs
    JOIN groups g ON g.id = gs.group_id
    JOIN users u ON u.id = gs.user_id
    WHERE gs.stripe_subscription_id = ${subscriptionId}
      AND gs.status IN ('active', 'trialing')
      AND g.deleted_at IS NULL
    LIMIT 1
  `;

  if (!sub) return;

  const renewalTimestamp =
    invoice.next_payment_attempt ??
    invoice.period_end ??
    (sub.current_period_end ? Math.floor(new Date(sub.current_period_end).getTime() / 1000) : Math.floor(Date.now() / 1000) + 7 * 86400);
  const renewalDate = new Date(renewalTimestamp * 1000);
  const dateKey = renewalDate.toISOString().slice(0, 10);
  const refId = `${subscriptionId}_${dateKey}`;

  const [alreadyNotified] = await sql`
    SELECT 1 FROM notification_log
    WHERE type = 'sub_renewal_reminder' AND ref_id = ${refId} AND user_id = ${sub.user_id}
  `;
  if (alreadyNotified) return;

  const formattedDate = renewalDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountDue / 100);

  const baseUrl = process.env.NEXTAUTH_URL || "https://convoca.uzzai.com.br";
  const manageUrl = `${baseUrl}/groups/${sub.group_id}/settings`;

  await Promise.allSettled([
    sendSubscriptionRenewalReminderEmail({
      to: sub.user_email,
      userName: sub.user_name || "Organizador",
      groupName: sub.group_name,
      amountCents: amountDue,
      renewalDate,
      isTrialEnding: sub.status === "trialing",
      manageUrl,
    }),
    sendPushToUser(sub.user_id, {
      title: "📅 Renovação de assinatura em breve",
      body: `A assinatura do grupo ${sub.group_name} (${formattedAmount}) será renovada em ${formattedDate}.`,
      data: { kind: "subscription_renewal", groupId: sub.group_id },
    }),
  ]);

  await sql`
    INSERT INTO notification_log (type, ref_id, user_id)
    VALUES ('sub_renewal_reminder', ${refId}, ${sub.user_id})
    ON CONFLICT (type, ref_id, user_id) DO NOTHING
  `;

  logger.info(
    { subscriptionId, groupId: sub.group_id, userEmail: sub.user_email, renewalDate: dateKey },
    "Sent upcoming subscription renewal reminder via Stripe webhook"
  );
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  if (subscription.cancel_at_period_end || !subscription.trial_end) return;

  const item = subscription.items.data[0];
  const unitAmount = item?.price?.unit_amount ?? 5990;
  if (unitAmount <= 0) return;

  const [sub] = await sql<{
    group_id: string;
    group_name: string;
    user_id: string;
    user_name: string;
    user_email: string;
  }[]>`
    SELECT
      gs.group_id,
      g.name AS group_name,
      gs.user_id,
      u.name AS user_name,
      u.email AS user_email
    FROM group_subscriptions gs
    JOIN groups g ON g.id = gs.group_id
    JOIN users u ON u.id = gs.user_id
    WHERE gs.stripe_subscription_id = ${subscription.id}
      AND gs.status IN ('active', 'trialing')
      AND g.deleted_at IS NULL
    LIMIT 1
  `;

  if (!sub) return;

  const renewalDate = new Date(subscription.trial_end * 1000);
  const dateKey = renewalDate.toISOString().slice(0, 10);
  const refId = `${subscription.id}_${dateKey}`;

  const [alreadyNotified] = await sql`
    SELECT 1 FROM notification_log
    WHERE type = 'sub_renewal_reminder' AND ref_id = ${refId} AND user_id = ${sub.user_id}
  `;
  if (alreadyNotified) return;

  const formattedDate = renewalDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(unitAmount / 100);

  const baseUrl = process.env.NEXTAUTH_URL || "https://convoca.uzzai.com.br";
  const manageUrl = `${baseUrl}/groups/${sub.group_id}/settings`;

  await Promise.allSettled([
    sendSubscriptionRenewalReminderEmail({
      to: sub.user_email,
      userName: sub.user_name || "Organizador",
      groupName: sub.group_name,
      amountCents: unitAmount,
      renewalDate,
      isTrialEnding: true,
      manageUrl,
    }),
    sendPushToUser(sub.user_id, {
      title: "⏳ Período de teste acabando",
      body: `O período de teste do grupo ${sub.group_name} termina em ${formattedDate} (${formattedAmount}).`,
      data: { kind: "subscription_renewal", groupId: sub.group_id },
    }),
  ]);

  await sql`
    INSERT INTO notification_log (type, ref_id, user_id)
    VALUES ('sub_renewal_reminder', ${refId}, ${sub.user_id})
    ON CONFLICT (type, ref_id, user_id) DO NOTHING
  `;

  logger.info(
    { subscriptionId: subscription.id, groupId: sub.group_id, userEmail: sub.user_email, renewalDate: dateKey },
    "Sent trial ending reminder via Stripe webhook"
  );
}

