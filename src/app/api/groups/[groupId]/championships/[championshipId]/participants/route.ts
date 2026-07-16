import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";

type Params = Promise<{ groupId: string; championshipId: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user);

    const rows = await sql`
      SELECT
        cp.id,
        cp.user_id   AS "userId",
        cp.guest_name AS "guestName",
        COALESCE(u.name, cp.guest_name) AS "userName",
        cp.created_at AS "createdAt"
      FROM championship_participants cp
      LEFT JOIN users u ON u.id = cp.user_id
      WHERE cp.championship_id = ${championshipId}
      ORDER BY cp.created_at
    `;

    return NextResponse.json({ participants: rows });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error listing championship participants");
    return NextResponse.json({ error: "Erro ao listar inscritos" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem adicionar inscritos",
    });

    const [champ] = await sql`
      SELECT id, status FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
    `;
    if (!champ) return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    if (champ.status !== "draft") {
      return NextResponse.json({ error: "Inscritos só podem ser adicionados em campeonatos em rascunho" }, { status: 400 });
    }

    const body = await request.json();
    const { guestName, userId } = body as { guestName?: string; userId?: string };

    if (!guestName && !userId) {
      return NextResponse.json({ error: "guestName ou userId obrigatório" }, { status: 400 });
    }

    const [row] = await sql`
      INSERT INTO championship_participants (championship_id, user_id, guest_name)
      VALUES (
        ${championshipId},
        ${userId ?? null},
        ${guestName ? guestName.trim() : null}
      )
      ON CONFLICT DO NOTHING
      RETURNING
        id,
        user_id   AS "userId",
        guest_name AS "guestName",
        COALESCE((SELECT name FROM users WHERE id = user_id), guest_name) AS "userName"
    `;

    return NextResponse.json({ participant: row }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error adding championship participant");
    return NextResponse.json({ error: "Erro ao adicionar inscrito" }, { status: 500 });
  }
}
