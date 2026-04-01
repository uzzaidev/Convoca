import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

/**
 * GET /api/stripe/subscription/[groupId]
 * Retorna o status da assinatura de um grupo
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await requireAuth();
    const { groupId } = await params;

    // Verificar se o usuário é membro do grupo
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE user_id = ${user.id} AND group_id = ${groupId}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Grupo não encontrado ou sem acesso" },
        { status: 404 }
      );
    }

    const [subscription] = await sql`
      SELECT
        gs.id,
        gs.status,
        gs.current_period_start,
        gs.current_period_end,
        gs.trial_end,
        gs.canceled_at,
        gs.created_at,
        u.name AS subscriber_name,
        u.email AS subscriber_email
      FROM group_subscriptions gs
      INNER JOIN users u ON gs.user_id = u.id
      WHERE gs.group_id = ${groupId}
      ORDER BY gs.created_at DESC
      LIMIT 1
    `;

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        isActive: false,
      });
    }

    const isActive = ["active", "trialing"].includes(subscription.status);

    return NextResponse.json({
      subscription,
      isActive,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    logger.error(error, "Error fetching subscription status");
    return NextResponse.json(
      { error: "Erro ao buscar status da assinatura" },
      { status: 500 }
    );
  }
}
