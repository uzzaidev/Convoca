import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type RouteParams = {
  params: Promise<{ groupId: string; seasonId: string }>;
};

const DEFAULT_SCORING = {
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  pointsGoal: 0,
  pointsAssist: 0,
  pointsMvp: 0,
  pointsPresence: 0,
};

// POST /api/groups/[groupId]/seasons/[seasonId]/finish - Finalizar temporada e criar snapshot
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId, seasonId } = await params;

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas administradores podem finalizar temporadas",
    });

    const [season] = await sql`
      SELECT id, name, status, starts_at, ends_at
      FROM seasons
      WHERE id = ${seasonId} AND group_id = ${groupId}
    `;

    if (!season) {
      return NextResponse.json(
        { error: "Temporada nÃ£o encontrada" },
        { status: 404 }
      );
    }

    if (season.status === "finished") {
      return NextResponse.json(
        { error: "Esta temporada jÃ¡ foi finalizada" },
        { status: 400 }
      );
    }

    const [groupData] = await sql`
      SELECT draw_config FROM groups WHERE id = ${groupId}
    `;
    const cfg = groupData?.draw_config ?? {};
    const scoring = {
      pointsWin: cfg.points_win ?? DEFAULT_SCORING.pointsWin,
      pointsDraw: cfg.points_draw ?? DEFAULT_SCORING.pointsDraw,
      pointsLoss: cfg.points_loss ?? DEFAULT_SCORING.pointsLoss,
      pointsGoal: cfg.points_goal ?? DEFAULT_SCORING.pointsGoal,
      pointsAssist: cfg.points_assist ?? DEFAULT_SCORING.pointsAssist,
      pointsMvp: cfg.points_mvp ?? DEFAULT_SCORING.pointsMvp,
      pointsPresence: cfg.points_presence ?? DEFAULT_SCORING.pointsPresence,
    };

    const rankings = await sql`
      WITH
      season_events AS (
        SELECT id FROM events
        WHERE group_id = ${groupId}
          AND status = 'finished'
          AND starts_at >= ${season.starts_at}
          AND starts_at <= ${season.ends_at}
      ),
      team_scores AS (
        SELECT
          t.event_id,
          t.id as team_id,
          (
            SELECT COUNT(*) FROM event_actions ea
            WHERE ea.team_id = t.id AND ea.event_id = t.event_id AND ea.action_type = 'goal'
          ) + (
            SELECT COUNT(*) FROM event_actions ea
            INNER JOIN teams t_opp ON ea.team_id = t_opp.id
            WHERE ea.action_type = 'own_goal'
              AND t_opp.event_id = t.event_id
              AND ea.team_id != t.id
              AND ea.event_id = t.event_id
          ) as goals_scored,
          (
            SELECT COUNT(*) FROM event_actions ea
            INNER JOIN teams t2 ON ea.team_id = t2.id
            WHERE t2.event_id = t.event_id AND t2.id != t.id AND ea.action_type = 'goal' AND ea.event_id = t.event_id
          ) + (
            SELECT COUNT(*) FROM event_actions ea
            WHERE ea.team_id = t.id AND ea.event_id = t.event_id AND ea.action_type = 'own_goal'
          ) as goals_conceded
        FROM teams t
        WHERE t.event_id IN (SELECT id FROM season_events)
      ),
      player_games AS (
        SELECT
          tm.user_id,
          ts.event_id,
          ts.team_id,
          ts.goals_scored as team_goals,
          ts.goals_conceded as opponent_goals,
          CASE
            WHEN ts.goals_scored > ts.goals_conceded THEN 'win'
            WHEN ts.goals_scored < ts.goals_conceded THEN 'loss'
            ELSE 'draw'
          END as result
        FROM team_members tm
        INNER JOIN team_scores ts ON tm.team_id = ts.team_id
      ),
      player_stats AS (
        SELECT
          pg.user_id,
          COUNT(DISTINCT pg.event_id) as games_played,
          COUNT(CASE WHEN pg.result = 'win' THEN 1 END) as wins,
          COUNT(CASE WHEN pg.result = 'draw' THEN 1 END) as draws,
          COUNT(CASE WHEN pg.result = 'loss' THEN 1 END) as losses,
          SUM(pg.team_goals) as team_goals,
          SUM(pg.opponent_goals) as goals_conceded,
          (SELECT COUNT(*) FROM event_actions ea WHERE ea.subject_user_id = pg.user_id AND ea.event_id IN (SELECT id FROM season_events) AND ea.action_type = 'goal') as goals,
          (SELECT COUNT(*) FROM event_actions ea WHERE ea.subject_user_id = pg.user_id AND ea.event_id IN (SELECT id FROM season_events) AND ea.action_type = 'assist') as assists,
          (SELECT COUNT(*) FROM event_actions ea WHERE ea.subject_user_id = pg.user_id AND ea.event_id IN (SELECT id FROM season_events) AND ea.action_type = 'own_goal') as own_goals,
          (SELECT COUNT(*) FROM player_ratings pr WHERE pr.rated_user_id = pg.user_id AND pr.event_id IN (SELECT id FROM season_events) AND 'mvp' = ANY(pr.tags)) as mvp_count
        FROM player_games pg
        GROUP BY pg.user_id
      )
      SELECT
        u.id as user_id,
        u.name as player_name,
        u.image as player_image,
        ps.games_played::int,
        ps.wins::int,
        ps.draws::int,
        ps.losses::int,
        ps.goals::int,
        ps.assists::int,
        ps.own_goals::int,
        ps.mvp_count::int,
        ps.team_goals::int,
        ps.goals_conceded::int,
        (ps.team_goals - ps.goals_conceded)::int as goal_difference,
        (
          ps.wins * ${scoring.pointsWin} +
          ps.draws * ${scoring.pointsDraw} +
          ps.losses * ${scoring.pointsLoss} +
          ps.goals * ${scoring.pointsGoal} +
          ps.assists * ${scoring.pointsAssist} +
          ps.mvp_count * ${scoring.pointsMvp} +
          ps.games_played * ${scoring.pointsPresence}
        )::int as points
      FROM player_stats ps
      INNER JOIN users u ON ps.user_id = u.id
      ORDER BY points DESC, goal_difference DESC, goals DESC
    `;

    await sql`DELETE FROM season_snapshots WHERE season_id = ${seasonId}`;

    for (let i = 0; i < rankings.length; i++) {
      const ranking = rankings[i];
      await sql`
        INSERT INTO season_snapshots (
          season_id, user_id, position, points, games_played,
          wins, draws, losses, goals, assists, own_goals,
          mvp_count, team_goals, goals_conceded, goal_difference,
          player_name, player_image
        ) VALUES (
          ${seasonId}, ${ranking.user_id}, ${i + 1}, ${ranking.points}, ${ranking.games_played},
          ${ranking.wins}, ${ranking.draws}, ${ranking.losses}, ${ranking.goals}, ${ranking.assists}, ${ranking.own_goals},
          ${ranking.mvp_count}, ${ranking.team_goals}, ${ranking.goals_conceded}, ${ranking.goal_difference},
          ${ranking.player_name}, ${ranking.player_image}
        )
      `;
    }

    await sql`
      UPDATE seasons SET status = 'finished'
      WHERE id = ${seasonId} AND group_id = ${groupId}
    `;

    logger.info(
      { userId: user.id, groupId, seasonId, playersCount: rankings.length },
      "Season finished and snapshot created"
    );

    return NextResponse.json({
      success: true,
      season: { ...season, status: "finished" },
      playersCount: rankings.length,
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error finishing season",
      fallbackMessage: "Erro ao finalizar temporada",
    });
  }
}
