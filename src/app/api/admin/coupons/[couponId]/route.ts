import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe";
import logger from "@/lib/logger";

/**
 * PATCH /api/admin/coupons/[couponId]
 * Ativa/desativa um promotion code no Stripe
 * Body: { active: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    await requireSystemAdmin();

    const { couponId } = await params;
    const { active } = await request.json();

    if (typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Campo 'active' (boolean) é obrigatório" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const promotionCode = await stripe.promotionCodes.update(couponId, {
      active,
    });

    logger.info(
      { promotionCodeId: couponId, active },
      "Promotion code updated"
    );

    return NextResponse.json({
      coupon: {
        id: promotionCode.id,
        code: promotionCode.code,
        active: promotionCode.active,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissao")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    logger.error(error, "Error updating coupon");
    return NextResponse.json({ error: "Erro ao atualizar cupom" }, { status: 500 });
  }
}
