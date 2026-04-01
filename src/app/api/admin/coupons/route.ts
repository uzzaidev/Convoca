import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe";
import logger from "@/lib/logger";
import { z } from "zod";

const createCouponSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  percentOff: z.number().min(1).max(100).optional(),
  amountOff: z.number().min(1).optional(),
  duration: z.enum(["once", "repeating", "forever"]),
  durationInMonths: z.number().min(1).optional(),
  code: z.string().min(3, "Código precisa ter pelo menos 3 caracteres").optional(),
  maxRedemptions: z.number().min(1).optional(),
}).refine(
  (data) => data.percentOff || data.amountOff,
  { message: "Informe percentOff ou amountOff" }
).refine(
  (data) => !(data.percentOff && data.amountOff),
  { message: "Informe apenas percentOff ou amountOff, não ambos" }
).refine(
  (data) => data.duration !== "repeating" || data.durationInMonths,
  { message: "durationInMonths é obrigatório quando duration é repeating" }
);

/**
 * GET /api/admin/coupons
 * Lista todos os cupons/promotion codes do Stripe
 */
export async function GET() {
  try {
    await requireSystemAdmin();

    const stripe = getStripe();

    const promotionCodes = await stripe.promotionCodes.list({
      limit: 100,
      expand: ["data.promotion.coupon"],
    });

    const coupons = promotionCodes.data.map((pc) => {
      const coupon = pc.promotion?.coupon;
      const couponObj = typeof coupon === "object" && coupon ? coupon : null;
      return {
        id: pc.id,
        code: pc.code,
        couponId: couponObj?.id ?? null,
        name: couponObj?.name ?? null,
        percentOff: couponObj?.percent_off ?? null,
        amountOff: couponObj?.amount_off ?? null,
        currency: couponObj?.currency ?? null,
        duration: couponObj?.duration ?? null,
        durationInMonths: couponObj?.duration_in_months ?? null,
        maxRedemptions: pc.max_redemptions,
        timesRedeemed: pc.times_redeemed,
        active: pc.active,
        createdAt: new Date(pc.created * 1000).toISOString(),
      };
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissao")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    logger.error(error, "Error fetching coupons");
    return NextResponse.json({ error: "Erro ao buscar cupons" }, { status: 500 });
  }
}

/**
 * POST /api/admin/coupons
 * Cria um cupom no Stripe + promotion code
 */
export async function POST(request: NextRequest) {
  try {
    await requireSystemAdmin();

    const body = await request.json();
    const validation = createCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, percentOff, amountOff, duration, durationInMonths, code, maxRedemptions } = validation.data;

    const stripe = getStripe();

    // Criar o coupon no Stripe
    const coupon = await stripe.coupons.create({
      name,
      ...(percentOff ? { percent_off: percentOff } : {}),
      ...(amountOff ? { amount_off: amountOff, currency: "brl" } : {}),
      duration,
      ...(durationInMonths ? { duration_in_months: durationInMonths } : {}),
    });

    // Criar o promotion code (código que o cliente digita)
    const promotionCode = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      ...(code ? { code: code.toUpperCase() } : {}),
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
    });

    logger.info(
      { couponId: coupon.id, promotionCodeId: promotionCode.id, code: promotionCode.code },
      "Coupon and promotion code created"
    );

    return NextResponse.json({
      coupon: {
        id: promotionCode.id,
        code: promotionCode.code,
        couponId: coupon.id,
        name: coupon.name,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        currency: coupon.currency,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months,
        maxRedemptions: promotionCode.max_redemptions,
        timesRedeemed: promotionCode.times_redeemed,
        active: promotionCode.active,
        createdAt: new Date(promotionCode.created * 1000).toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissao")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    logger.error(error, "Error creating coupon");
    return NextResponse.json({ error: "Erro ao criar cupom" }, { status: 500 });
  }
}
