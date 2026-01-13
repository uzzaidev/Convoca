import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

// GET /api/users/me/pending-charges-count - Get count of pending charges for current user
export async function GET() {
  try {
    const user = await requireAuth();

    const [result] = await sql`
      SELECT COUNT(*)::int as count
      FROM charges
      WHERE user_id = ${user.id}
      AND status = 'pending'
    `;

    logger.info(
      { userId: user.id, count: result.count },
      "Fetched pending charges count"
    );

    return NextResponse.json({ count: result.count || 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching pending charges count");
    return NextResponse.json(
      { error: "Erro ao buscar cobranças pendentes" },
      { status: 500 }
    );
  }
}
