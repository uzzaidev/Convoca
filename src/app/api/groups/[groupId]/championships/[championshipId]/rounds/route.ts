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

    const [champ] = await sql`
      SELECT id FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
    `;
    if (!champ) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }

    const rounds = await sql`
      SELECT
        cr.id,
        cr.round_number,
        cr.scheduled_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',          cm.id,
              'homeTeamId',  cm.home_team_id,
              'awayTeamId',  cm.away_team_id,
              'homeTeamName', ht.name,
              'awayTeamName', at.name,
              'homeTeamColor', ht.color,
              'awayTeamColor', at.color,
              'homeScore',   cm.home_score,
              'awayScore',   cm.away_score,
              'status',      cm.status,
              'eventId',     cm.event_id,
              'playedAt',    cm.played_at
            ) ORDER BY cm.created_at
          ) FILTER (WHERE cm.id IS NOT NULL),
          '[]'
        ) AS matches
      FROM championship_phases cp
      JOIN championship_rounds cr ON cr.phase_id = cp.id
      LEFT JOIN championship_matches cm ON cm.round_id = cr.id
      LEFT JOIN championship_teams ht ON ht.id = cm.home_team_id
      LEFT JOIN championship_teams at ON at.id = cm.away_team_id
      WHERE cp.championship_id = ${championshipId}
      GROUP BY cr.id, cr.round_number, cr.scheduled_at
      ORDER BY cr.round_number
    `;

    return NextResponse.json({ rounds });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error fetching championship rounds");
    return NextResponse.json({ error: "Erro ao buscar rodadas" }, { status: 500 });
  }
}
