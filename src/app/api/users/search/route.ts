import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

// GET /api/users/search?q=email - Search users by email
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: "Digite pelo menos 3 caracteres para buscar" },
        { status: 400 }
      );
    }

    // Search users by email (case-insensitive, partial match)
    const users = await sql`
      SELECT
        id,
        name,
        email
      FROM users
      WHERE LOWER(email) LIKE LOWER(${'%' + query + '%'})
      ORDER BY email
      LIMIT 10
    `;

    logger.info({ userId: user.id, query }, "Users searched");

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error searching users");
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}
