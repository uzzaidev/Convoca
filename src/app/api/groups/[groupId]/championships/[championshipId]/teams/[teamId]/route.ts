import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";

type Params = Promise<{ groupId: string; championshipId: string; teamId: string }>;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId, teamId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem remover times",
    });

    const [champ] = await sql`
      SELECT id, status FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
    `;
    if (!champ) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }

    const [team] = await sql`
      SELECT id FROM championship_teams
      WHERE id = ${teamId} AND championship_id = ${championshipId} AND is_bye = FALSE
    `;
    if (!team) {
      return NextResponse.json({ error: "Time não encontrado" }, { status: 404 });
    }

    // Block deletion if the team has already played at least one finished match
    const [playedMatch] = await sql`
      SELECT cm.id
      FROM championship_matches cm
      WHERE (cm.home_team_id = ${teamId} OR cm.away_team_id = ${teamId})
        AND cm.status = 'finished'
      LIMIT 1
    `;
    if (playedMatch) {
      return NextResponse.json(
        { error: "Não é possível remover um time que já disputou partidas" },
        { status: 400 }
      );
    }

    await sql`DELETE FROM championship_team_players WHERE championship_team_id = ${teamId}`;
    await sql`DELETE FROM championship_teams WHERE id = ${teamId}`;

    logger.info({ teamId, championshipId, userId: user.id }, "Championship team deleted");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error deleting championship team");
    return NextResponse.json({ error: "Erro ao remover time" }, { status: 500 });
  }
}
