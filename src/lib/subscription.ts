import { sql } from "@/db/client";
import { getStripe } from "@/lib/stripe";
import logger from "@/lib/logger";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export interface GroupSubscription {
  id: string;
  group_id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  grace_until: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Verifica se um grupo tem assinatura ativa (active ou trialing)
 */
export async function isGroupSubscriptionActive(groupId: string): Promise<boolean> {
  const [sub] = await sql`
    SELECT status FROM group_subscriptions
    WHERE group_id = ${groupId}
      AND status IN ('active', 'trialing')
    LIMIT 1
  `;
  return !!sub;
}

/**
 * Verifica se um grupo tem acesso ativo — considera tanto assinatura Stripe ativa/trialing
 * quanto extensão manual (grace_until) configurada pelo super admin.
 */
export async function isGroupSubscriptionActiveOrGrace(groupId: string): Promise<boolean> {
  const [sub] = await sql`
    SELECT status, grace_until FROM group_subscriptions
    WHERE group_id = ${groupId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!sub) return false;
  if ((sub.status as string) === 'active' || (sub.status as string) === 'trialing') return true;
  if (sub.grace_until && new Date(sub.grace_until as string) > new Date()) return true;
  return false;
}

/**
 * Busca a assinatura ativa de um grupo
 */
export async function getGroupSubscription(
  groupId: string
): Promise<GroupSubscription | null> {
  const [sub] = await sql`
    SELECT * FROM group_subscriptions
    WHERE group_id = ${groupId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return sub ? (sub as unknown as GroupSubscription) : null;
}

/**
 * Busca ou cria o stripe_customer_id para um usuário
 */
export async function getOrCreateStripeCustomer(
  userId: string
): Promise<string> {
  const [user] = await sql`
    SELECT id, name, email, stripe_customer_id FROM users WHERE id = ${userId}
  `;

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  if (user.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name,
    metadata: { user_id: userId },
  });

  await sql`
    UPDATE users SET stripe_customer_id = ${customer.id}, updated_at = NOW()
    WHERE id = ${userId}
  `;

  return customer.id;
}

/**
 * Busca a assinatura atual no Stripe e grava no banco (upsert).
 * Fonte unica de sincronizacao: webhook, retorno do checkout e cron de reconciliacao
 * chamam esta funcao, em vez de confiar no payload/ordem dos eventos.
 */
export async function syncStripeSubscription(stripeSubscriptionId: string) {
  const subscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
  const item = subscription.items.data[0];
  const toTimestamp = (epoch?: number | null) =>
    epoch ? new Date(epoch * 1000).toISOString() : null;

  const [existing] = await sql`
    SELECT group_id, user_id FROM group_subscriptions
    WHERE stripe_subscription_id = ${subscription.id}
  `;
  const groupId = (existing?.group_id as string | undefined) || subscription.metadata?.group_id;
  const userId = (existing?.user_id as string | undefined) || subscription.metadata?.user_id;

  if (!groupId || !userId) {
    logger.warn({ subscriptionId: subscription.id }, "Stripe subscription without group/user metadata");
    return null;
  }

  const stripePriceId = item?.price?.id || null;
  let planId: string | null = subscription.metadata?.plan_id || null;
  if (!planId && stripePriceId) {
    const [matchedPlan] = await sql`
      SELECT id FROM subscription_plans WHERE stripe_price_id = ${stripePriceId} LIMIT 1
    `;
    planId = (matchedPlan?.id as string | undefined) ?? null;
  }

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const status = subscription.status;

  await sql`
    INSERT INTO group_subscriptions (
      group_id, user_id, stripe_subscription_id, stripe_customer_id,
      status, current_period_start, current_period_end, trial_end, canceled_at,
      plan_id, stripe_price_id
    ) VALUES (
      ${groupId}, ${userId}, ${subscription.id}, ${customerId},
      ${status},
      ${toTimestamp(item?.current_period_start)}::timestamp,
      ${toTimestamp(item?.current_period_end)}::timestamp,
      ${toTimestamp(subscription.trial_end)}::timestamp,
      ${toTimestamp(subscription.canceled_at)}::timestamp,
      ${planId}, ${stripePriceId}
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = EXCLUDED.status,
      current_period_start = COALESCE(EXCLUDED.current_period_start, group_subscriptions.current_period_start),
      current_period_end = COALESCE(EXCLUDED.current_period_end, group_subscriptions.current_period_end),
      trial_end = EXCLUDED.trial_end,
      canceled_at = EXCLUDED.canceled_at,
      plan_id = COALESCE(EXCLUDED.plan_id, group_subscriptions.plan_id),
      stripe_price_id = COALESCE(EXCLUDED.stripe_price_id, group_subscriptions.stripe_price_id),
      updated_at = NOW()
  `;

  // Se cancelou ou falhou, inativar o grupo (a menos que outra assinatura do grupo siga valida)
  if (["canceled", "unpaid", "incomplete_expired", "past_due", "paused"].includes(status)) {
    const reason = status === "past_due"
      ? "Pagamento pendente — atualize seu método de pagamento"
      : "Assinatura cancelada ou pagamento não realizado";
    await sql`
      UPDATE groups
      SET status = 'inactive',
          status_reason = ${reason},
          status_updated_at = NOW()
      WHERE id = ${groupId}
        AND status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM group_subscriptions gs
          WHERE gs.group_id = ${groupId}
            AND gs.stripe_subscription_id <> ${subscription.id}
            AND (gs.status IN ('active', 'trialing') OR gs.grace_until > NOW())
        )
    `;
  }

  // Se voltou a ficar ativo, reativar o grupo
  if (["active", "trialing"].includes(status)) {
    await sql`
      UPDATE groups
      SET status = 'active',
          status_reason = NULL,
          status_updated_at = NOW()
      WHERE id = ${groupId}
        AND status IN ('pending', 'pending_payment', 'inactive')
    `;
  }

  return { groupId, status };
}

/**
 * Sincroniza as assinaturas de um grupo direto do Stripe (ex.: retorno do checkout,
 * quando o usuario volta antes do webhook chegar).
 */
export async function syncGroupSubscriptionsForUser(groupId: string, userId: string) {
  const [user] = await sql`SELECT stripe_customer_id FROM users WHERE id = ${userId}`;
  if (!user?.stripe_customer_id) return;

  const { data } = await getStripe().subscriptions.list({
    customer: user.stripe_customer_id as string,
    status: "all",
    limit: 10,
  });
  for (const sub of data.filter((s) => s.metadata?.group_id === groupId)) {
    await syncStripeSubscription(sub.id);
  }
}
