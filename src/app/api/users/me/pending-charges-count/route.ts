import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

export async function GET() {
  try {
    const user = await requireAuth();

    const [result] = await sql`
      SELECT COUNT(*)::int as count
      FROM charges c
      INNER JOIN groups g ON g.id = c.group_id
      WHERE c.user_id = ${user.id}
        AND c.status = 'pending'
        AND g.deleted_at IS NULL
        AND g.status = 'active'
    `;

    logger.info({ userId: user.id, count: result.count }, "Fetched pending charges count");

    return NextResponse.json({ count: result.count || 0 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    logger.error(error, "Error fetching pending charges count");
    return NextResponse.json({ error: "Erro ao buscar cobrancas pendentes" }, { status: 500 });
  }
}
