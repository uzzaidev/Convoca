import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { getStripe, STRIPE_PRICE_ID, TRIAL_PERIOD_DAYS } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/subscription";
import logger from "@/lib/logger";

/**
 * POST /api/stripe/checkout
 * Cria uma Checkout Session do Stripe para assinar um grupo
 * Body: { groupId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o grupo existe e o usuário é admin
    const [group] = await sql`
      SELECT g.id, g.name, g.status, gm.role
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE g.id = ${groupId}
        AND gm.user_id = ${user.id}
        AND gm.role = 'admin'
        AND g.deleted_at IS NULL
    `;

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    // Verificar se já tem assinatura ativa
    const [existingSub] = await sql`
      SELECT id, status FROM group_subscriptions
      WHERE group_id = ${groupId}
        AND status IN ('active', 'trialing')
      LIMIT 1
    `;

    if (existingSub) {
      return NextResponse.json(
        { error: "Este grupo já possui uma assinatura ativa" },
        { status: 400 }
      );
    }

    // Buscar ou criar customer no Stripe
    const customerId = await getOrCreateStripeCustomer(user.id);

    // Criar Checkout Session
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
        metadata: {
          group_id: groupId,
          user_id: user.id,
        },
      },
      metadata: {
        group_id: groupId,
        user_id: user.id,
      },
      success_url: `${appUrl}/dashboard/groups/${groupId}?payment=success`,
      cancel_url: `${appUrl}/dashboard/groups/${groupId}?payment=canceled`,
      locale: "pt-BR",
    });

    logger.info(
      { groupId, userId: user.id, sessionId: session.id },
      "Stripe Checkout Session created"
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    logger.error(error, "Error creating checkout session");
    return NextResponse.json(
      { error: "Erro ao criar sessão de pagamento" },
      { status: 500 }
    );
  }
}
