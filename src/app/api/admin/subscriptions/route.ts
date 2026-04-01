import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

/**
 * GET /api/admin/subscriptions
 * Super admin: listar todas as assinaturas de grupos
 */
export async function GET(request: NextRequest) {
  try {
    await requireSystemAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    let subscriptions;
    let total;

    if (status) {
      subscriptions = await sql`
        SELECT
          gs.id,
          gs.group_id,
          gs.user_id,
          gs.stripe_subscription_id,
          gs.status,
          gs.current_period_start,
          gs.current_period_end,
          gs.trial_end,
          gs.canceled_at,
          gs.created_at,
          g.name AS group_name,
          u.name AS user_name,
          u.email AS user_email
        FROM group_subscriptions gs
        INNER JOIN groups g ON gs.group_id = g.id
        INNER JOIN users u ON gs.user_id = u.id
        WHERE gs.status = ${status}
        ORDER BY gs.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      [total] = await sql`
        SELECT COUNT(*)::int as count FROM group_subscriptions WHERE status = ${status}
      `;
    } else {
      subscriptions = await sql`
        SELECT
          gs.id,
          gs.group_id,
          gs.user_id,
          gs.stripe_subscription_id,
          gs.status,
          gs.current_period_start,
          gs.current_period_end,
          gs.trial_end,
          gs.canceled_at,
          gs.created_at,
          g.name AS group_name,
          u.name AS user_name,
          u.email AS user_email
        FROM group_subscriptions gs
        INNER JOIN groups g ON gs.group_id = g.id
        INNER JOIN users u ON gs.user_id = u.id
        ORDER BY gs.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      [total] = await sql`
        SELECT COUNT(*)::int as count FROM group_subscriptions
      `;
    }

    return NextResponse.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("permissao")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    logger.error(error, "Error fetching admin subscriptions");
    return NextResponse.json(
      { error: "Erro ao buscar assinaturas" },
      { status: 500 }
    );
  }
}
