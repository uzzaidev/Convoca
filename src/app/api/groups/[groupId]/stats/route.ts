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
    const finishedEvents = await sql`
      SELECT id FROM events
      WHERE group_id = ${groupId} AND status = 'finished'
    `;

    if (finishedEvents.length === 0) {
      return NextResponse.json({
        topScorers: [],
        topAssisters: [],
        topGoalkeepers: [],
        recentMatches: [],
        playerFrequency: [],
      });
    }

    const eventIds = (finishedEvents as unknown as Array<{ id: string }>).map(e => e.id);

    // Artilheiros (top 10)
    const topScorers = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        COUNT(*) as goals
      FROM event_actions ea
      INNER JOIN users u ON ea.subject_user_id = u.id
      INNER JOIN events e ON ea.event_id = e.id
      WHERE e.group_id = ${groupId}
        AND e.status = 'finished'
        AND ea.action_type = 'goal'
        AND ea.subject_user_id IS NOT NULL
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
      INNER JOIN users u ON ea.subject_user_id = u.id
      INNER JOIN events e ON ea.event_id = e.id
      WHERE e.group_id = ${groupId}
        AND e.status = 'finished'
        AND ea.action_type = 'assist'
        AND ea.subject_user_id IS NOT NULL
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
      INNER JOIN users u ON ea.subject_user_id = u.id
      INNER JOIN events e ON ea.event_id = e.id
      WHERE e.group_id = ${groupId}
        AND e.status = 'finished'
        AND ea.action_type = 'save'
        AND ea.subject_user_id IS NOT NULL
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
              WHERE ea2.team_id = t.id
                AND ea2.action_type = 'goal'
                AND ea2.event_id = e.id
            )
          ) ORDER BY t.seed)
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
        -- Jogos que jogou (confirmado + check-in)
        COUNT(DISTINCT CASE
          WHEN ea.status = 'yes' AND ea.checked_in_at IS NOT NULL
          THEN ea.event_id
        END) as games_played,
        -- Jogos que deu DM
        COUNT(DISTINCT CASE
          WHEN ea.status = 'dm'
          THEN ea.event_id
        END) as games_dm,
        -- Jogos que não foi
        COUNT(DISTINCT CASE
          WHEN ea.status = 'no'
          THEN ea.event_id
        END) as games_absent,
        -- Total de jogos no período
        (SELECT total FROM total_count) as total_games,
        -- Frequência percentual (jogos jogados / total de jogos - DMs)
        CASE
          WHEN (SELECT total FROM total_count) > 0
          THEN ROUND(
            COUNT(DISTINCT CASE WHEN ea.status = 'yes' AND ea.checked_in_at IS NOT NULL THEN ea.event_id END)::numeric * 100.0 /
            NULLIF((SELECT total FROM total_count)::numeric, 0),
            1
          )
          ELSE 0
        END as frequency_percentage
      FROM users u
      INNER JOIN group_members gm ON u.id = gm.user_id AND gm.group_id = ${groupId}
      LEFT JOIN event_attendance ea ON ea.user_id = u.id
        AND ea.event_id IN (SELECT id FROM recent_events)
      GROUP BY u.id, u.name, u.image
      HAVING COUNT(DISTINCT ea.event_id) > 0  -- Pelo menos teve alguma interação
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
