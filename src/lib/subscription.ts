import { sql } from "@/db/client";
import { getStripe } from "@/lib/stripe";

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
 * Atualiza o status da assinatura do grupo a partir do Stripe
 */
export async function syncSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodStart?: number,
  currentPeriodEnd?: number,
  trialEnd?: number | null,
  canceledAt?: number | null
) {
  const toTimestamp = (epoch?: number | null) =>
    epoch ? new Date(epoch * 1000).toISOString() : null;

  await sql`
    UPDATE group_subscriptions
    SET
      status = ${status},
      current_period_start = COALESCE(${toTimestamp(currentPeriodStart)}::timestamp, current_period_start),
      current_period_end = COALESCE(${toTimestamp(currentPeriodEnd)}::timestamp, current_period_end),
      trial_end = ${toTimestamp(trialEnd)}::timestamp,
      canceled_at = ${toTimestamp(canceledAt)}::timestamp,
      updated_at = NOW()
    WHERE stripe_subscription_id = ${stripeSubscriptionId}
  `;

  // Se cancelou ou falhou, inativar o grupo
  if (["canceled", "unpaid", "incomplete_expired", "past_due"].includes(status)) {
    const [sub] = await sql`
      SELECT group_id FROM group_subscriptions
      WHERE stripe_subscription_id = ${stripeSubscriptionId}
    `;
    if (sub) {
      const reason = status === "past_due"
        ? "Pagamento pendente — atualize seu método de pagamento"
        : "Assinatura cancelada ou pagamento não realizado";
      await sql`
        UPDATE groups
        SET status = 'inactive',
            status_reason = ${reason},
            status_updated_at = NOW()
        WHERE id = ${sub.group_id}
      `;
    }
  }

  // Se voltou a ficar ativo, reativar o grupo
  if (["active", "trialing"].includes(status)) {
    const [sub] = await sql`
      SELECT group_id FROM group_subscriptions
      WHERE stripe_subscription_id = ${stripeSubscriptionId}
    `;
    if (sub) {
      await sql`
        UPDATE groups
        SET status = 'active',
            status_reason = NULL,
            status_updated_at = NOW()
        WHERE id = ${sub.group_id}
          AND status IN ('pending', 'pending_payment', 'inactive')
      `;
    }
  }
}
