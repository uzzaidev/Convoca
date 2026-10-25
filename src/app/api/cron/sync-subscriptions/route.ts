import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import { syncStripeSubscription } from "@/lib/subscription";
import logger from "@/lib/logger";

// Vercel Cron: 0 8 * * * (diariamente às 8h UTC = 5h BRT)
// Reconciliação: re-sincroniza com o Stripe toda assinatura não terminal,
// cobrindo webhooks perdidos ou fora de ordem.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const subs = await sql<{ stripe_subscription_id: string }[]>`
    SELECT stripe_subscription_id FROM group_subscriptions
    WHERE status NOT IN ('canceled', 'incomplete_expired')
  `;

  let synced = 0;
  let failed = 0;
  for (const sub of subs) {
    try {
      await syncStripeSubscription(sub.stripe_subscription_id);
      synced++;
    } catch (error) {
      failed++;
      logger.error({ error, subscriptionId: sub.stripe_subscription_id }, "Error reconciling subscription");
    }
  }

  logger.info({ synced, failed }, "Subscription reconciliation finished");
  return NextResponse.json({ synced, failed });
}
