import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string }>;

// GET /api/groups/:groupId/rankings - Get player rankings for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Check if user is member
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    // DEBUG: Ver eventos finalizados e ações
    const debugEvents = await sql`
      SELECT
        e.id as event_id,
        e.status,
        COUNT(DISTINCT ea.id) as total_actions,
        COUNT(DISTINCT CASE WHEN ea.action_type = 'goal' THEN ea.id END) as total_goals
      FROM events e
      LEFT JOIN event_actions ea ON e.id = ea.event_id
      WHERE e.group_id = ${groupId}
      GROUP BY e.id, e.status
    `;

    logger.info({
      groupId,
      events: debugEvents.map((e: any) => ({
        event_id: e.event_id,
        status: e.status,
        total_actions: e.total_actions,
        total_goals: e.total_goals
      }))
    }, "Events and actions in group");

    // DEBUG: Ver todas as ações de gol com detalhes
    const debugGoals = await sql`
      SELECT
        ea.id,
        ea.event_id,
        ea.action_type,
        ea.subject_user_id,
        u.name as player_name,
        e.status as event_status
      FROM event_actions ea
      LEFT JOIN users u ON ea.subject_user_id = u.id
      LEFT JOIN events e ON ea.event_id = e.id
      WHERE e.group_id = ${groupId}
        AND ea.action_type = 'goal'
      ORDER BY e.starts_at DESC
      LIMIT 20
    `;

    logger.info({
      groupId,
      totalGoals: debugGoals.length,
      goals: debugGoals.map((g: any) => ({
        action_id: g.id,
        event_id: g.event_id,
        event_status: g.event_status,
        player_name: g.player_name,
        subject_user_id: g.subject_user_id
      }))
    }, "All goals in group");

    // Get player statistics and rankings
    const rankings = await sql`
      WITH
      -- Eventos finalizados do grupo
      finished_events AS (
        SELECT id
        FROM events
        WHERE group_id = ${groupId}
          AND status = 'finished'
      ),
      -- Estatísticas de cada jogador
      player_stats AS (
        SELECT
          u.id as user_id,
          u.name as player_name,
          u.image as player_image,
          gm.base_rating,

          -- Jogos jogados (confirmados E com check-in)
          COUNT(DISTINCT CASE
            WHEN ea.status = 'yes' AND ea.checked_in_at IS NOT NULL
            THEN ea.event_id
          END) as games_played,

          -- Gols marcados
          COUNT(DISTINCT CASE
            WHEN eact_goals.action_type = 'goal'
            THEN eact_goals.id
          END) as goals,

          -- Assistências
          COUNT(DISTINCT CASE
            WHEN eact_assists.action_type = 'assist'
            THEN eact_assists.id
          END) as assists,

          -- Vitórias (jogador no time vencedor)
          COUNT(DISTINCT CASE
            WHEN t.is_winner = true
            THEN t.event_id
          END) as wins,

          -- Contagem de MVPs
          COUNT(DISTINCT CASE
            WHEN 'mvp' = ANY(pr.tags)
            THEN pr.id
          END) as mvp_count

        FROM users u
        INNER JOIN group_members gm ON u.id = gm.user_id AND gm.group_id = ${groupId}

        -- Participação em eventos
        LEFT JOIN event_attendance ea ON u.id = ea.user_id
          AND ea.event_id IN (SELECT id FROM finished_events)

        -- Gols
        LEFT JOIN event_actions eact_goals ON u.id = eact_goals.subject_user_id
          AND eact_goals.action_type = 'goal'
          AND eact_goals.event_id IN (SELECT id FROM finished_events)

        -- Assistências
        LEFT JOIN event_actions eact_assists ON u.id = eact_assists.subject_user_id
          AND eact_assists.action_type = 'assist'
          AND eact_assists.event_id IN (SELECT id FROM finished_events)

        -- Times e vitórias
        LEFT JOIN team_members tm ON u.id = tm.user_id
        LEFT JOIN teams t ON tm.team_id = t.id
          AND t.event_id IN (SELECT id FROM finished_events)

        -- Avaliações
        LEFT JOIN player_ratings pr ON u.id = pr.rated_user_id
          AND pr.event_id IN (SELECT id FROM finished_events)

        GROUP BY u.id, u.name, u.image, gm.base_rating
      )
      SELECT
        *,
        -- Taxa de vitória
        CASE
          WHEN games_played > 0
          THEN (wins::float / games_played::float * 100)::numeric(5,2)
          ELSE 0
        END as win_rate,

        -- Pontuação de performance
        (
          (games_played * 1) +
          (goals * 3) +
          (assists * 2) +
          (wins * 5) +
          (mvp_count * 10)
        )::numeric(10,2) as performance_score

      FROM player_stats
      WHERE games_played > 0  -- Só mostrar quem jogou
      ORDER BY performance_score DESC, mvp_count DESC, goals DESC
    `;

    // DEBUG: Log detalhado dos rankings
    logger.info({
      groupId,
      totalPlayers: rankings.length,
      sample: rankings.slice(0, 3).map((r: any) => ({
        name: r.player_name,
        games_played: r.games_played,
        goals: r.goals,
        assists: r.assists,
        wins: r.wins,
        avg_rating: r.avg_rating,
        performance_score: r.performance_score
      }))
    }, "Rankings calculated");

    return NextResponse.json({ rankings });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching rankings");
    return NextResponse.json(
      { error: "Erro ao buscar rankings" },
      { status: 500 }
    );
  }
}
