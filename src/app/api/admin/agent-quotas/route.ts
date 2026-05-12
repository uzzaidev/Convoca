import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { handleRouteError } from "@/lib/route-errors";
import logger from "@/lib/logger";

const updateQuotaSchema = z.object({
  userId: z.string().uuid(),
  monthlyTokenLimit: z.number().min(0).optional(),
  monthlyRequestLimit: z.number().min(0).optional(),
});

// GET /api/admin/agent-quotas — lista todos os usuários com uso mensal
export async function GET() {
  try {
    await requireSystemAdmin();

    const currentMonth = new Date().toISOString().slice(0, 7).replace("-", "");

    const rows = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(q.monthly_token_limit, 200000) AS monthly_token_limit,
        COALESCE(q.monthly_request_limit, 200) AS monthly_request_limit,
        COALESCE(au.requests, 0) AS requests_used,
        COALESCE(au.input_tokens + au.output_tokens + au.reasoning_tokens, 0) AS tokens_used,
        COALESCE(au.cost_usd_cents, 0) AS cost_usd_cents
      FROM users u
      LEFT JOIN agent_quotas q ON q.user_id = u.id
      LEFT JOIN agent_usage au ON au.user_id = u.id AND au.year_month = ${currentMonth}
      ORDER BY COALESCE(au.requests, 0) DESC
      LIMIT 200
    `;

    return NextResponse.json({ quotas: rows });
  } catch (err) {
    return handleRouteError(err, {
      logMessage: "admin/agent-quotas GET: erro",
      fallbackMessage: "Erro ao listar quotas",
    });
  }
}

// PATCH /api/admin/agent-quotas — atualiza limite de um usuário
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireSystemAdmin();
    const body = updateQuotaSchema.parse(await req.json());

    await sql`
      INSERT INTO agent_quotas (user_id, monthly_token_limit, monthly_request_limit, updated_by)
      VALUES (
        ${body.userId},
        ${body.monthlyTokenLimit ?? 200000},
        ${body.monthlyRequestLimit ?? 200},
        ${admin.id}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        monthly_token_limit = COALESCE(${body.monthlyTokenLimit ?? null}::int, agent_quotas.monthly_token_limit),
        monthly_request_limit = COALESCE(${body.monthlyRequestLimit ?? null}::int, agent_quotas.monthly_request_limit),
        updated_by = ${admin.id},
        updated_at = NOW()
    `;

    logger.info(
      { adminId: admin.id, targetUserId: body.userId },
      "Quota do agente atualizada"
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err, {
      logMessage: "admin/agent-quotas PATCH: erro",
      fallbackMessage: "Erro ao atualizar quota",
    });
  }
}
