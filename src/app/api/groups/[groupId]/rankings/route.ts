import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string }>;

// Default scoring config (standard football: V=3, E=1, D=0)
const DEFAULT_SCORING = {
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  pointsGoal: 0,
  pointsAssist: 0,
  pointsMvp: 0,
  pointsPresence: 0,
  rankingMode: "standard",
};

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

    // Get scoring configuration for this group
    const [scoringConfig] = await sql`
      SELECT
        points_win as "pointsWin",
        points_draw as "pointsDraw",
        points_loss as "pointsLoss",
        points_goal as "pointsGoal",
        points_assist as "pointsAssist",
        points_mvp as "pointsMvp",
        points_presence as "pointsPresence",
        ranking_mode as "rankingMode"
      FROM scoring_configs
      WHERE group_id = ${groupId}
    `;

    const config = scoringConfig || DEFAULT_SCORING;

    // Get player statistics and rankings with dynamic scoring
    const rankings = await sql`
      WITH
      -- Eventos finalizados do grupo
      finished_events AS (
        SELECT id
        FROM events
        WHERE group_id = ${groupId}
          AND status = 'finished'
      ),
      -- Placar de cada time por evento (gols marcados)
      team_scores AS (
        SELECT
          t.id as team_id,
          t.event_id,
          t.name as team_name,
          t.is_winner,
          COALESCE(
            (SELECT COUNT(*) FROM event_actions ea
             WHERE ea.team_id = t.id AND ea.action_type = 'goal'),
            0
          ) as goals_scored
        FROM teams t
        WHERE t.event_id IN (SELECT id FROM finished_events)
      ),
      -- Jogos de cada jogador com resultado (V/E/D)
      player_matches AS (
        SELECT
          tm.user_id,
          t.event_id,
          ts_own.goals_scored as team_goals,
          COALESCE(
            (SELECT SUM(ts2.goals_scored) FROM team_scores ts2
             WHERE ts2.event_id = t.event_id AND ts2.team_id != t.id),
            0
          ) as opponent_goals,
          CASE
            WHEN ts_own.goals_scored > COALESCE(
              (SELECT SUM(ts2.goals_scored) FROM team_scores ts2
               WHERE ts2.event_id = t.event_id AND ts2.team_id != t.id), 0)
            THEN 'win'
            WHEN ts_own.goals_scored = COALESCE(
              (SELECT SUM(ts2.goals_scored) FROM team_scores ts2
               WHERE ts2.event_id = t.event_id AND ts2.team_id != t.id), 0)
            THEN 'draw'
            ELSE 'loss'
          END as result
        FROM team_members tm
        INNER JOIN teams t ON tm.team_id = t.id
        INNER JOIN team_scores ts_own ON ts_own.team_id = t.id
        WHERE t.event_id IN (SELECT id FROM finished_events)
      ),
      -- Estatísticas agregadas de cada jogador
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

          -- Vitórias, Empates, Derrotas
          COUNT(DISTINCT CASE WHEN pm.result = 'win' THEN pm.event_id END) as wins,
          COUNT(DISTINCT CASE WHEN pm.result = 'draw' THEN pm.event_id END) as draws,
          COUNT(DISTINCT CASE WHEN pm.result = 'loss' THEN pm.event_id END) as losses,

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

          -- Gols do time e gols sofridos
          COALESCE(SUM(DISTINCT pm.team_goals), 0) as team_goals,
          COALESCE(SUM(DISTINCT pm.opponent_goals), 0) as goals_conceded,

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

        -- Resultados dos jogos
        LEFT JOIN player_matches pm ON u.id = pm.user_id

        -- Gols
        LEFT JOIN event_actions eact_goals ON u.id = eact_goals.subject_user_id
          AND eact_goals.action_type = 'goal'
          AND eact_goals.event_id IN (SELECT id FROM finished_events)

        -- Assistências
        LEFT JOIN event_actions eact_assists ON u.id = eact_assists.subject_user_id
          AND eact_assists.action_type = 'assist'
          AND eact_assists.event_id IN (SELECT id FROM finished_events)

        -- Avaliações
        LEFT JOIN player_ratings pr ON u.id = pr.rated_user_id
          AND pr.event_id IN (SELECT id FROM finished_events)

        GROUP BY u.id, u.name, u.image, gm.base_rating
      )
      SELECT
        *,
        -- Saldo de gols
        (team_goals - goals_conceded) as goal_difference,

        -- Taxa de vitória
        CASE
          WHEN games_played > 0
          THEN (wins::float / games_played::float * 100)::numeric(5,2)
          ELSE 0
        END as win_rate,

        -- Pontuação dinâmica baseada na configuração
        (
          (wins * ${config.pointsWin}) +
          (draws * ${config.pointsDraw}) +
          (losses * ${config.pointsLoss}) +
          (goals * ${config.pointsGoal}) +
          (assists * ${config.pointsAssist}) +
          (mvp_count * ${config.pointsMvp}) +
          (games_played * ${config.pointsPresence})
        )::integer as points

      FROM player_stats
      WHERE games_played > 0  -- Só mostrar quem jogou
      ORDER BY points DESC, wins DESC, goal_difference DESC, goals DESC
    `;

    logger.info({
      groupId,
      totalPlayers: rankings.length,
      config: {
        pointsWin: config.pointsWin,
        pointsDraw: config.pointsDraw,
        pointsLoss: config.pointsLoss,
        rankingMode: config.rankingMode,
      }
    }, "Rankings calculated");

    return NextResponse.json({
      rankings,
      scoringConfig: config,
    });
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
