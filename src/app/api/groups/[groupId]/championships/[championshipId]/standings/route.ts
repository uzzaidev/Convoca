import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { rowToStanding, type ChampionshipStandingRow } from "@/types/championship";

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

    // Read materialized view — always sorted by: points DESC, wins DESC, goal_diff DESC, goals_for DESC
    const rows = await sql<ChampionshipStandingRow[]>`
      SELECT *
      FROM mv_championship_standings
      WHERE championship_id = ${championshipId}
      ORDER BY points DESC, wins DESC, goal_diff DESC, goals_for DESC, team_name
    `;

    const standings = rows.map((r, i) => rowToStanding(r, i + 1));

    // Top scorer per player (from event_actions linked to this championship)
    const topScorers = await sql`
      SELECT
        u.id        AS user_id,
        u.name      AS user_name,
        u.image     AS user_image,
        ct.name     AS team_name,
        ct.color    AS team_color,
        COUNT(*)    AS goals
      FROM event_actions ea
      JOIN events e ON e.id = ea.event_id
      JOIN championship_matches cm ON cm.event_id = e.id
      JOIN championship_rounds cr ON cr.id = cm.round_id
      JOIN championship_phases cp ON cp.id = cr.phase_id
      JOIN users u ON u.id = ea.actor_user_id
      JOIN championship_team_players ctp ON ctp.user_id = u.id
      JOIN championship_teams ct ON ct.id = ctp.championship_team_id
        AND ct.championship_id = ${championshipId}
      WHERE cp.championship_id = ${championshipId}
        AND ea.action_type = 'goal'
      GROUP BY u.id, u.name, u.image, ct.name, ct.color
      ORDER BY goals DESC, u.name
      LIMIT 10
    `;

    return NextResponse.json({ standings, topScorers });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error fetching championship standings");
    return NextResponse.json({ error: "Erro ao buscar classificação" }, { status: 500 });
  }
}
