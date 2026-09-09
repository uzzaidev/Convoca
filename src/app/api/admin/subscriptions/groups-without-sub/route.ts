import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

/**
 * GET /api/admin/subscriptions/groups-without-sub
 * Super admin: listar grupos ativos sem assinatura Stripe
 */
export async function GET() {
  try {
    await requireSystemAdmin();

    const groups = await sql`
      SELECT
        g.id,
        g.name,
        g.status,
        g.created_at,
        creator.name AS creator_name,
        creator.email AS creator_email,
        COUNT(gm.id)::int AS member_count
      FROM groups g
      LEFT JOIN users creator ON creator.id = g.created_by
      LEFT JOIN group_members gm ON gm.group_id = g.id
      WHERE g.deleted_at IS NULL
        AND g.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM group_subscriptions gs
          WHERE gs.group_id = g.id
            AND (
              gs.status IN ('active', 'trialing')
              OR (gs.grace_until IS NOT NULL AND gs.grace_until > NOW())
            )
        )
      GROUP BY g.id, creator.name, creator.email
      ORDER BY g.created_at DESC
    `;

    return NextResponse.json({ groups });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissao")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }
    logger.error(error, "Error fetching groups without subscription");
    return NextResponse.json({ error: "Erro ao buscar grupos" }, { status: 500 });
  }
}