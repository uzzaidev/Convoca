import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { getStripe } from "@/lib/stripe";
import logger from "@/lib/logger";
import { z } from "zod";

const createPlanSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  amountCents: z.number().int().positive("Valor deve ser positivo"),
  interval: z.enum(["month", "year"]),
  intervalCount: z.number().int().min(1).max(12).default(1),
  maxInstallments: z.number().int().min(2).max(12).nullable().optional(),
  trialDays: z.number().int().min(0).max(90).default(7),
  isDefault: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});

/**
 * GET /api/admin/plans
 * Lista todos os planos (admin)
 */
export async function GET() {
  try {
    await requireSystemAdmin();

    const plans = await sql`
      SELECT * FROM subscription_plans
      ORDER BY sort_order ASC, created_at ASC
    `;

    return NextResponse.json({ plans });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissão")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    logger.error(error, "Error listing plans");
    return NextResponse.json({ error: "Erro ao listar planos" }, { status: 500 });
  }
}

/**
 * POST /api/admin/plans
 * Cria um novo plano (cria Price no Stripe automaticamente)
 */
export async function POST(request: NextRequest) {
  try {
    await requireSystemAdmin();

    const body = await request.json();
    const validation = createPlanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      amountCents,
      interval,
      intervalCount,
      maxInstallments,
      trialDays,
      isDefault,
      sortOrder,
    } = validation.data;

    const stripe = getStripe();

    // Buscar ou criar o produto Convoca no Stripe
    let productId: string;
    const products = await stripe.products.search({
      query: "name:'Convoca - Assinatura de Grupo'",
    });

    if (products.data.length > 0) {
      productId = products.data[0].id;
    } else {
      const product = await stripe.products.create({
        name: "Convoca - Assinatura de Grupo",
        description: "Assinatura mensal para gerenciar um grupo de pelada no Convoca.",
      });
      productId = product.id;
    }

    // Criar Price no Stripe
    const stripePrice = await stripe.prices.create({
      product: productId,
      unit_amount: amountCents,
      currency: "brl",
      recurring: {
        interval: interval,
        interval_count: intervalCount,
      },
      metadata: {
        plan_name: name,
        max_installments: maxInstallments?.toString() || "",
      },
    });

    // Se marcado como default, desmarcar outros
    if (isDefault) {
      await sql`UPDATE subscription_plans SET is_default = false WHERE is_default = true`;
    }

    const [plan] = await sql`
      INSERT INTO subscription_plans (
        name, description, stripe_price_id, stripe_product_id,
        amount_cents, currency, interval, interval_count,
        max_installments, trial_days, is_active, is_default, sort_order
      )
      VALUES (
        ${name}, ${description || null}, ${stripePrice.id}, ${productId},
        ${amountCents}, 'brl', ${interval}, ${intervalCount},
        ${maxInstallments || null}, ${trialDays}, true, ${isDefault}, ${sortOrder}
      )
      RETURNING *
    `;

    logger.info({ planId: plan.id, stripePriceId: stripePrice.id }, "Subscription plan created");

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissão")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    logger.error(error, "Error creating plan");
    return NextResponse.json({ error: "Erro ao criar plano" }, { status: 500 });
  }
}
