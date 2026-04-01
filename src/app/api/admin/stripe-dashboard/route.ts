import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { getStripe } from "@/lib/stripe";
import logger from "@/lib/logger";

/**
 * GET /api/admin/stripe-dashboard
 * Super admin: dashboard financeiro completo
 */
export async function GET() {
  try {
    await requireSystemAdmin();

    const stripe = getStripe();

    // Dados do banco (assinaturas locais)
    const [subStats] = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'trialing')::int AS trialing,
        COUNT(*) FILTER (WHERE status = 'past_due')::int AS past_due,
        COUNT(*) FILTER (WHERE status = 'canceled')::int AS canceled,
        COUNT(*) FILTER (WHERE status = 'incomplete')::int AS incomplete
      FROM group_subscriptions
    `;

    // Assinaturas com próximo vencimento (próximos 30 dias)
    const upcomingRenewals = await sql`
      SELECT
        gs.id,
        gs.stripe_subscription_id,
        gs.status,
        gs.current_period_end,
        gs.trial_end,
        g.name AS group_name,
        u.name AS user_name,
        u.email AS user_email
      FROM group_subscriptions gs
      INNER JOIN groups g ON gs.group_id = g.id
      INNER JOIN users u ON gs.user_id = u.id
      WHERE gs.status IN ('active', 'trialing')
        AND gs.current_period_end IS NOT NULL
        AND gs.current_period_end <= NOW() + INTERVAL '30 days'
      ORDER BY gs.current_period_end ASC
      LIMIT 20
    `;

    // Clientes vinculados ao Stripe
    const [customerStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE stripe_customer_id IS NOT NULL)::int AS linked,
        COUNT(*) FILTER (WHERE stripe_customer_id IS NULL)::int AS unlinked
      FROM users
    `;

    // Últimas faturas/pagamentos do Stripe (últimos 20)
    let recentInvoices: Array<{
      id: string;
      number: string | null;
      customerEmail: string | null;
      customerName: string | null;
      amountPaid: number;
      amountDue: number;
      currency: string;
      status: string | null;
      paid: boolean;
      created: string;
      hostedInvoiceUrl: string | null;
      periodStart: string | null;
      periodEnd: string | null;
    }> = [];

    try {
      const invoices = await stripe.invoices.list({
        limit: 20,
        expand: ["data.customer"],
      });

      recentInvoices = invoices.data.map((inv) => {
        const customer = typeof inv.customer === "object" && inv.customer ? inv.customer : null;
        return {
          id: inv.id,
          number: inv.number,
          customerEmail: customer && "email" in customer ? (customer.email ?? null) : null,
          customerName: customer && "name" in customer ? (customer.name ?? null) : null,
          amountPaid: inv.amount_paid,
          amountDue: inv.amount_due,
          currency: inv.currency,
          status: inv.status as string | null,
          paid: inv.status === "paid",
          created: new Date(inv.created * 1000).toISOString(),
          hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
          periodStart: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
          periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
        };
      });
    } catch (err) {
      logger.warn(err, "Failed to fetch Stripe invoices");
    }

    // Saldo do Stripe
    let balance = { available: 0, pending: 0, currency: "brl" };
    try {
      const stripeBalance = await stripe.balance.retrieve();
      const brl = stripeBalance.available.find((b) => b.currency === "brl");
      const brlPending = stripeBalance.pending.find((b) => b.currency === "brl");
      balance = {
        available: brl?.amount ?? 0,
        pending: brlPending?.amount ?? 0,
        currency: "brl",
      };
    } catch (err) {
      logger.warn(err, "Failed to fetch Stripe balance");
    }

    // Cupons ativos e uso
    let couponStats = { total: 0, active: 0, totalRedemptions: 0 };
    try {
      const promotionCodes = await stripe.promotionCodes.list({ limit: 100 });
      couponStats = {
        total: promotionCodes.data.length,
        active: promotionCodes.data.filter((pc) => pc.active).length,
        totalRedemptions: promotionCodes.data.reduce((sum, pc) => sum + pc.times_redeemed, 0),
      };
    } catch (err) {
      logger.warn(err, "Failed to fetch promotion codes");
    }

    // Receita do mês (MRR estimado)
    let monthlyRevenue = 0;
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const invoicesThisMonth = await stripe.invoices.list({
        limit: 100,
        created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
        status: "paid",
      });
      monthlyRevenue = invoicesThisMonth.data.reduce((sum, inv) => sum + inv.amount_paid, 0);
    } catch (err) {
      logger.warn(err, "Failed to fetch monthly revenue");
    }

    return NextResponse.json({
      subscriptions: subStats,
      upcomingRenewals,
      customers: customerStats,
      recentInvoices,
      balance,
      couponStats,
      monthlyRevenue,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissao")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    logger.error(error, "Error fetching stripe dashboard");
    return NextResponse.json(
      { error: "Erro ao buscar dados financeiros" },
      { status: 500 }
    );
  }
}
