import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { getStripe } from "@/lib/stripe";
import logger from "@/lib/logger";

type RouteParams = {
  params: Promise<{ planId: string }>;
};

/**
 * PATCH /api/admin/plans/[planId]
 * Atualiza plano (ativar/desativar, alterar dados locais)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSystemAdmin();
    const { planId } = await params;

    const body = await request.json();
    const { isActive, isDefault, name, description, trialDays, sortOrder, maxInstallments } = body;

    const [existing] = await sql`
      SELECT * FROM subscription_plans WHERE id = ${planId}
    `;

    if (!existing) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    // Se ativar/desativar, fazer no Stripe também
    if (isActive !== undefined) {
      const stripe = getStripe();
      await stripe.prices.update(existing.stripe_price_id, {
        active: isActive,
      });
    }

    // Se marcado como default, desmarcar outros
    if (isDefault) {
      await sql`UPDATE subscription_plans SET is_default = false WHERE is_default = true AND id != ${planId}`;
    }

    const [plan] = await sql`
      UPDATE subscription_plans SET
        name = COALESCE(${name ?? null}, name),
        description = COALESCE(${description ?? null}, description),
        trial_days = COALESCE(${trialDays ?? null}, trial_days),
        max_installments = ${maxInstallments !== undefined ? (maxInstallments || null) : existing.max_installments},
        is_active = COALESCE(${isActive ?? null}, is_active),
        is_default = COALESCE(${isDefault ?? null}, is_default),
        sort_order = COALESCE(${sortOrder ?? null}, sort_order),
        updated_at = NOW()
      WHERE id = ${planId}
      RETURNING *
    `;

    logger.info({ planId }, "Subscription plan updated");

    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissão")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    logger.error(error, "Error updating plan");
    return NextResponse.json({ error: "Erro ao atualizar plano" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/plans/[planId]
 * Desativa plano (não deleta, apenas desativa)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireSystemAdmin();
    const { planId } = await params;

    const [existing] = await sql`
      SELECT * FROM subscription_plans WHERE id = ${planId}
    `;

    if (!existing) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    // Desativar no Stripe
    const stripe = getStripe();
    await stripe.prices.update(existing.stripe_price_id, { active: false });

    // Desativar localmente
    await sql`
      UPDATE subscription_plans SET is_active = false, updated_at = NOW()
      WHERE id = ${planId}
    `;

    logger.info({ planId }, "Subscription plan deactivated");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissão")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    logger.error(error, "Error deactivating plan");
    return NextResponse.json({ error: "Erro ao desativar plano" }, { status: 500 });
  }
}
