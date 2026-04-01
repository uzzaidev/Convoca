import { NextResponse } from "next/server";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

/**
 * GET /api/plans
 * Retorna planos ativos para seleção no checkout (endpoint público autenticado)
 */
export async function GET() {
  try {
    const plans = await sql`
      SELECT
        id, name, description, amount_cents, currency,
        interval, interval_count, max_installments,
        trial_days, is_default, sort_order
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY sort_order ASC, amount_cents ASC
    `;

    return NextResponse.json({ plans });
  } catch (error) {
    logger.error(error, "Error listing public plans");
    return NextResponse.json({ error: "Erro ao listar planos" }, { status: 500 });
  }
}
