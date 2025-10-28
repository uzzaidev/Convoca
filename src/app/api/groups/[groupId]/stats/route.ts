import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

// GET /api/groups/[groupId]/stats - Estatísticas e rankings do grupo
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId } = await params;

    // Verificar se o usuário é membro do grupo
    const membership = await sql`
      SELECT role FROM group_members
      WHERE user_id = ${user.id} AND group_id = ${groupId}
    `;

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    // Buscar eventos finalizados do grupo
    const events = await sql`
      SELECT id FROM events
      WHERE group_id = ${groupId} AND status = 'finished'
    `;

    const eventIds = (events as unknown as Array<{ id: string }>).map(e => e.id);

    if (eventIds.length === 0) {
      return NextResponse.json({
        topScorers: [],
        topAssisters: [],
        topGoalkeepers: [],
        recentMatches: [],
        playerFrequency: [],
      });
    }

    // Artilheiros (top 10)
    const topScorers = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        COUNT(*) as goals
      FROM event_actions ea
      INNER JOIN users u ON ea.actor_user_id = u.id
      WHERE ea.event_id = ANY(${eventIds})
        AND ea.action_type = 'goal'
      GROUP BY u.id, u.name, u.image
      ORDER BY goals DESC
      LIMIT 10
    `;

    // Garçons - assistências (top 10)
    const topAssisters = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        COUNT(*) as assists
      FROM event_actions ea
      INNER JOIN users u ON ea.actor_user_id = u.id
      WHERE ea.event_id = ANY(${eventIds})
        AND ea.action_type = 'assist'
      GROUP BY u.id, u.name, u.image
      ORDER BY assists DESC
      LIMIT 10
    `;

    // Goleiros - defesas (top 10)
    const topGoalkeepers = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        COUNT(*) as saves
      FROM event_actions ea
      INNER JOIN users u ON ea.actor_user_id = u.id
      WHERE ea.event_id = ANY(${eventIds})
        AND ea.action_type = 'save'
      GROUP BY u.id, u.name, u.image
      ORDER BY saves DESC
      LIMIT 10
    `;

    // Jogos recentes (últimos 5)
    const recentMatches = await sql`
      SELECT
        e.id,
        e.starts_at,
        v.name as venue_name,
        (
          SELECT json_agg(json_build_object(
            'id', t.id,
            'name', t.name,
            'is_winner', t.is_winner,
            'goals', (
              SELECT COUNT(*)
              FROM event_actions ea2
              WHERE ea2.team_id = t.id AND ea2.action_type = 'goal'
            )
          ))
          FROM teams t
          WHERE t.event_id = e.id
        ) as teams
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE e.group_id = ${groupId}
        AND e.status = 'finished'
      ORDER BY e.starts_at DESC
      LIMIT 5
    `;

    // Frequência de jogadores (últimos 10 jogos)
    const playerFrequency = await sql`
      WITH recent_events AS (
        SELECT id
        FROM events
        WHERE group_id = ${groupId}
          AND status = 'finished'
        ORDER BY starts_at DESC
        LIMIT 10
      ),
      total_count AS (
        SELECT COUNT(*) as total FROM recent_events
      )
      SELECT
        u.id,
        u.name,
        u.image,
        COUNT(*) FILTER (WHERE ea.status = 'yes' AND ea.checked_in_at IS NOT NULL) as games_played,
        COUNT(*) FILTER (WHERE ea.status = 'dm') as games_dm,
        COUNT(*) FILTER (WHERE ea.status = 'no') as games_absent,
        (SELECT total FROM total_count) as total_games,
        ROUND(
          COUNT(*) FILTER (WHERE ea.status = 'yes' AND ea.checked_in_at IS NOT NULL) * 100.0 / 
          NULLIF((SELECT total FROM total_count) - COUNT(*) FILTER (WHERE ea.status = 'dm'), 0), 
          1
        ) as frequency_percentage
      FROM users u
      INNER JOIN group_members gm ON u.id = gm.user_id
      LEFT JOIN event_attendance ea ON ea.user_id = u.id AND ea.event_id IN (SELECT id FROM recent_events)
      WHERE gm.group_id = ${groupId}
      GROUP BY u.id, u.name, u.image
      HAVING COUNT(*) FILTER (WHERE ea.status = 'yes' AND ea.checked_in_at IS NOT NULL) > 0
         OR COUNT(*) FILTER (WHERE ea.status = 'dm') > 0
         OR COUNT(*) FILTER (WHERE ea.status = 'no') > 0
      ORDER BY games_played DESC, frequency_percentage DESC
      LIMIT 15
    `;

    return NextResponse.json({
      topScorers,
      topAssisters,
      topGoalkeepers,
      recentMatches,
      playerFrequency,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching group stats");
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
