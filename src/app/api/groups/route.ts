import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { createGroupSchema } from "@/lib/validations";
import logger from "@/lib/logger";
import { generateInviteCode } from "@/lib/utils";
import { getStripe, STRIPE_PRICE_ID, TRIAL_PERIOD_DAYS } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/subscription";

export async function GET() {
  try {
    const user = await requireAuth();

    const groups = await sql`
      SELECT
        g.id,
        g.name,
        g.description,
        g.privacy,
        g.photo_url,
        g.status,
        g.status_reason,
        g.created_at,
        gm.role AS user_role
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ${user.id}
        AND g.deleted_at IS NULL
      ORDER BY g.created_at DESC
    `;

    return NextResponse.json({ groups });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    logger.error(error, "Error fetching groups");
    return NextResponse.json({ error: "Erro ao buscar grupos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validation = createGroupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, privacy, planId } = validation.data;

    // Criar grupo com status pending_payment
    const [group] = await sql`
      INSERT INTO groups (
        name,
        description,
        privacy,
        created_by,
        status,
        status_updated_at,
        status_updated_by
      )
      VALUES (
        ${name},
        ${description || null},
        ${privacy},
        ${user.id},
        'pending_payment',
        NOW(),
        ${user.id}
      )
      RETURNING *
    `;

    await sql`
      INSERT INTO group_members (user_id, group_id, role)
      VALUES (${user.id}, ${group.id}, 'admin')
    `;

    await sql`
      INSERT INTO wallets (owner_type, owner_id, balance_cents)
      VALUES ('group', ${group.id}, 0)
    `;

    const inviteCode = generateInviteCode();
    await sql`
      INSERT INTO invites (group_id, code, created_by)
      VALUES (${group.id}, ${inviteCode}, ${user.id})
    `;

    // Criar Stripe Checkout Session para pagamento do grupo
    const customerId = await getOrCreateStripeCustomer(user.id);
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Resolver plano: por planId ou fallback para STRIPE_PRICE_ID
    let priceId = STRIPE_PRICE_ID;
    let trialDays = TRIAL_PERIOD_DAYS;
    let resolvedPlanId: string | null = null;

    if (planId) {
      const [plan] = await sql`
        SELECT id, stripe_price_id, trial_days
        FROM subscription_plans
        WHERE id = ${planId} AND is_active = true
      `;
      if (plan) {
        priceId = plan.stripe_price_id;
        trialDays = plan.trial_days ?? TRIAL_PERIOD_DAYS;
        resolvedPlanId = plan.id;
      }
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          group_id: group.id,
          user_id: user.id,
          plan_id: resolvedPlanId || "",
        },
      },
      metadata: {
        group_id: group.id,
        user_id: user.id,
        plan_id: resolvedPlanId || "",
      },
      success_url: `${appUrl}/groups/${group.id}?payment=success`,
      cancel_url: `${appUrl}/groups/${group.id}?payment=canceled`,
      locale: "pt-BR",
    });

    logger.info({ groupId: group.id, userId: user.id }, "Group created with checkout session");

    return NextResponse.json(
      {
        group: { ...group, inviteCode },
        checkoutUrl: checkoutSession.url,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    logger.error(error, "Error creating group");
    return NextResponse.json({ error: "Erro ao criar grupo" }, { status: 500 });
  }
}
