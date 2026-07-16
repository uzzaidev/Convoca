import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";

type Params = Promise<{ groupId: string; championshipId: string; teamId: string; playerId: string }>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId, teamId, playerId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem vincular jogadores",
    });

    const body = await request.json();
    const { userId } = body as { userId: string };
    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    // Verify the target user is a group member
    const [member] = await sql`
      SELECT user_id FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId}
    `;
    if (!member) {
      return NextResponse.json({ error: "Usuário não é membro do grupo" }, { status: 400 });
    }

    // Ensure the player slot is a guest (user_id IS NULL)
    const [playerRow] = await sql`
      SELECT ctp.id FROM championship_team_players ctp
      JOIN championship_teams ct ON ct.id = ctp.championship_team_id
      WHERE ctp.id = ${playerId}
        AND ct.id = ${teamId}
        AND ct.championship_id = ${championshipId}
        AND ctp.user_id IS NULL
    `;
    if (!playerRow) {
      return NextResponse.json({ error: "Jogador avulso não encontrado" }, { status: 404 });
    }

    // Ensure target user is not already on another team in this championship
    const [conflict] = await sql`
      SELECT ctp.id FROM championship_team_players ctp
      JOIN championship_teams ct ON ct.id = ctp.championship_team_id
      WHERE ct.championship_id = ${championshipId}
        AND ctp.user_id = ${userId}
    `;
    if (conflict) {
      return NextResponse.json({ error: "Usuário já está em outro time neste campeonato" }, { status: 400 });
    }

    const [updated] = await sql`
      UPDATE championship_team_players
      SET user_id = ${userId}, guest_name = NULL, updated_at = NOW()
      WHERE id = ${playerId}
      RETURNING id
    `;

    logger.info({ playerId, userId, teamId, championshipId }, "Guest player linked to user");

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error linking guest player");
    return NextResponse.json({ error: "Erro ao vincular jogador" }, { status: 500 });
  }
}
