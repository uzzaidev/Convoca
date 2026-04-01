import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { getStripe } from "@/lib/stripe";
import logger from "@/lib/logger";

/**
 * GET /api/groups/[groupId]/billing
 * Retorna informações de billing do grupo (assinatura, faturas, plano)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await requireAuth();
    const { groupId } = await params;

    // Verificar se o usuário é admin do grupo
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    // Buscar assinatura do grupo
    const [subscription] = await sql`
      SELECT
        gs.*,
        sp.name as plan_name,
        sp.amount_cents as plan_amount_cents,
        sp.interval as plan_interval,
        sp.interval_count as plan_interval_count,
        sp.description as plan_description
      FROM group_subscriptions gs
      LEFT JOIN subscription_plans sp ON gs.plan_id = sp.id
      WHERE gs.group_id = ${groupId}
      ORDER BY gs.created_at DESC
      LIMIT 1
    `;

    if (!subscription || !subscription.stripe_subscription_id) {
      return NextResponse.json({
        subscription: null,
        invoices: [],
        upcomingInvoice: null,
      });
    }

    const stripe = getStripe();

    // Buscar assinatura do Stripe para dados atualizados
    let stripeSubscription;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );
    } catch {
      return NextResponse.json({
        subscription: {
          ...subscription,
          stripe_status: subscription.status,
        },
        invoices: [],
        upcomingInvoice: null,
      });
    }

    // Buscar faturas
    let invoices: Array<{
      id: string;
      status: string | null;
      amount_due: number;
      amount_paid: number;
      created: number;
      hosted_invoice_url: string | null;
      period_start: number;
      period_end: number;
    }> = [];
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: subscription.stripe_customer_id,
        subscription: subscription.stripe_subscription_id,
        limit: 12,
      });
      invoices = stripeInvoices.data.map((inv) => ({
        id: inv.id,
        status: inv.status as string | null,
        amount_due: inv.amount_due,
        amount_paid: inv.amount_paid,
        created: inv.created,
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
        period_start: inv.period_start,
        period_end: inv.period_end,
      }));
    } catch (err) {
      logger.warn({ err }, "Failed to fetch invoices");
    }

    // Buscar próxima fatura
    let upcomingInvoice: {
      amount_due: number;
      next_payment_attempt: number | null;
    } | null = null;
    try {
      const upcoming = await stripe.invoices.retrieveUpcoming({
        customer: subscription.stripe_customer_id,
        subscription: subscription.stripe_subscription_id,
      });
      upcomingInvoice = {
        amount_due: upcoming.amount_due,
        next_payment_attempt: upcoming.next_payment_attempt,
      };
    } catch {
      // Sem próxima fatura (cancelado ou trial)
    }

    const item = stripeSubscription.items.data[0];

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodStart: item?.current_period_start
          ? new Date(item.current_period_start * 1000).toISOString()
          : subscription.current_period_start,
        currentPeriodEnd: item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : subscription.current_period_end,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000).toISOString()
          : null,
        planName: subscription.plan_name || "Plano Padrão",
        planAmountCents: subscription.plan_amount_cents,
        planInterval: subscription.plan_interval,
        planIntervalCount: subscription.plan_interval_count,
        planDescription: subscription.plan_description,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        stripeCustomerId: subscription.stripe_customer_id,
      },
      invoices,
      upcomingInvoice,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching billing info");
    return NextResponse.json(
      { error: "Erro ao buscar informações de cobrança" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/groups/[groupId]/billing
 * Ações de billing: cancelar assinatura, reativar
 * Body: { action: "cancel" | "reactivate" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await requireAuth();
    const { groupId } = await params;
    const { action } = await request.json();

    // Verificar se o usuário é admin do grupo
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const [subscription] = await sql`
      SELECT stripe_subscription_id FROM group_subscriptions
      WHERE group_id = ${groupId}
        AND status IN ('active', 'trialing')
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Nenhuma assinatura ativa encontrada" },
        { status: 404 }
      );
    }

    const stripe = getStripe();

    if (action === "cancel") {
      // Cancelar ao final do período
      await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      logger.info(
        { groupId, userId: user.id },
        "Subscription cancellation scheduled"
      );

      return NextResponse.json({
        message: "Assinatura será cancelada ao final do período atual",
      });
    }

    if (action === "reactivate") {
      // Reativar (remover cancelamento agendado)
      await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: false }
      );

      logger.info(
        { groupId, userId: user.id },
        "Subscription reactivated"
      );

      return NextResponse.json({
        message: "Assinatura reativada com sucesso",
      });
    }

    return NextResponse.json(
      { error: "Ação inválida" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error processing billing action");
    return NextResponse.json(
      { error: "Erro ao processar ação" },
      { status: 500 }
    );
  }
}
