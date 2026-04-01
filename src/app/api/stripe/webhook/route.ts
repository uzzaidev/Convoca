import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sql } from "@/db/client";
import { syncSubscriptionStatus } from "@/lib/subscription";
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

    await sql`
      INSERT INTO group_subscriptions (
        group_id, user_id, stripe_subscription_id, stripe_customer_id,
        status, current_period_start, current_period_end, trial_end
      ) VALUES (
        ${groupId},
        ${userId},
        ${subscriptionId},
        ${customerId},
        ${subscription.status},
        ${item ? new Date(item.current_period_start * 1000).toISOString() : null}::timestamp,
        ${item ? new Date(item.current_period_end * 1000).toISOString() : null}::timestamp,
        ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null}::timestamp
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
