import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string }>;

const DEFAULT_TIEBREAKERS = [
  "wins",
  "goal_difference",
  "goals",
  "games_played",
] as const;

const DEFAULT_SCORING = {
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  pointsGoal: 0,
  pointsAssist: 0,
  pointsMvp: 0,
  pointsPresence: 0,
  rankingMode: "standard",
  tiebreakers: DEFAULT_TIEBREAKERS,
};

type RankingRow = Record<string, unknown> & {
  points?: number | string | null;
  wins?: number | string | null;
  goal_difference?: number | string | null;
  goals?: number | string | null;
  games_played?: number | string | null;
  assists?: number | string | null;
  mvp_count?: number | string | null;
};

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

// Compare fn for one tiebreaker key. Returns the JS-sort delta (negative = a first).
function compareByKey(a: RankingRow, b: RankingRow, key: string): number {
  switch (key) {
    case "wins":
      return toNum(b.wins) - toNum(a.wins);
    case "goal_difference":
      return toNum(b.goal_difference) - toNum(a.goal_difference);
    case "goals":
      return toNum(b.goals) - toNum(a.goals);
    case "games_played":
      return toNum(b.games_played) - toNum(a.games_played);
    case "games_played_asc":
      return toNum(a.games_played) - toNum(b.games_played);
    case "assists":
      return toNum(b.assists) - toNum(a.assists);
    case "mvp_count":
      return toNum(b.mvp_count) - toNum(a.mvp_count);
    default:
      return 0;
  }
}

function sortRankings<T extends RankingRow>(
  rows: T[],
  rawTiebreakers: unknown
): T[] {
  const tb: string[] = Array.isArray(rawTiebreakers)
    ? rawTiebreakers.filter((k): k is string => typeof k === "string")
    : [...DEFAULT_TIEBREAKERS];
  return [...rows].sort((a, b) => {
    const dp = toNum(b.points) - toNum(a.points);
    if (dp !== 0) return dp;
    for (const key of tb) {
      const d = compareByKey(a, b, key);
      if (d !== 0) return d;
    }
    return 0;
  });
}

// GET /api/groups/:groupId/rankings - Get player rankings for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("seasonId");

    const group = await requireGroupAccess(groupId, user);

    if (group.appMode === "control") {
      return NextResponse.json(
        { error: "Rankings desativados para este grupo" },
        { status: 403 }
      );
    }

    if (seasonId && seasonId !== "all") {
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
        const snapshots = await sql`
          SELECT
            user_id,
            player_name,
            player_image,
            position,
            points,
            games_played,
            wins,
            draws,
            losses,
            goals,
            assists,
            own_goals,
            mvp_count,
            team_goals,
            goals_conceded,
            goal_difference
          FROM season_snapshots
          WHERE season_id = ${seasonId}
          ORDER BY position ASC
        `;

        const [scoringConfig] = await sql`
          SELECT
            points_win as "pointsWin",
            points_draw as "pointsDraw",
            points_loss as "pointsLoss",
            points_goal as "pointsGoal",
            points_assist as "pointsAssist",
            points_mvp as "pointsMvp",
            points_presence as "pointsPresence",
            ranking_mode as "rankingMode",
            tiebreakers
          FROM scoring_configs
          WHERE group_id = ${groupId}
        `;

        return NextResponse.json({
          rankings: snapshots.map((snapshot: Record<string, unknown>) => ({
            user_id: snapshot.user_id,
            player_name: snapshot.player_name,
            player_image: snapshot.player_image,
            games_played: snapshot.games_played,
            wins: snapshot.wins,
            draws: snapshot.draws,
            losses: snapshot.losses,
            goals: snapshot.goals,
            assists: snapshot.assists,
            own_goals: snapshot.own_goals,
            mvp_count: snapshot.mvp_count,
            team_goals: snapshot.team_goals,
            goals_conceded: snapshot.goals_conceded,
            goal_difference: snapshot.goal_difference,
            points: snapshot.points,
            win_rate: Number(snapshot.games_played) > 0
              ? ((Number(snapshot.wins) / Number(snapshot.games_played)) * 100).toFixed(2)
              : "0",
          })),
          scoringConfig: {
            ...(scoringConfig || DEFAULT_SCORING),
            tiebreakers: Array.isArray(scoringConfig?.tiebreakers)
              ? (scoringConfig.tiebreakers as unknown[]).filter(
                  (k): k is string => typeof k === "string"
                )
              : [...DEFAULT_TIEBREAKERS],
          },
          season: { id: season.id, name: season.name, status: season.status },
        });
      }
    }

    let seasonFilter: { startsAt: string; endsAt: string } | null = null;
    let activeSeason: { id: string; name: string; status: string } | null = null;

    if (seasonId === "all") {
      // Agregação geral: sem filtro de temporada.
    } else if (seasonId) {
      const [season] = await sql`
        SELECT id, name, status, starts_at, ends_at
        FROM seasons
        WHERE id = ${seasonId} AND group_id = ${groupId}
      `;
      if (season) {
        seasonFilter = { startsAt: season.starts_at, endsAt: season.ends_at };
        activeSeason = { id: season.id, name: season.name, status: season.status };
      }
    } else {
      const [active] = await sql`
        SELECT id, name, status, starts_at, ends_at
        FROM seasons
        WHERE group_id = ${groupId} AND status = 'active'
        LIMIT 1
      `;
      if (active) {
        seasonFilter = { startsAt: active.starts_at, endsAt: active.ends_at };
        activeSeason = { id: active.id, name: active.name, status: active.status };
      }
    }

    const [scoringConfig] = await sql`
      SELECT
        points_win as "pointsWin",
        points_draw as "pointsDraw",
        points_loss as "pointsLoss",
        points_goal as "pointsGoal",
        points_assist as "pointsAssist",
        points_mvp as "pointsMvp",
        points_presence as "pointsPresence",
        ranking_mode as "rankingMode",
        tiebreakers
      FROM scoring_configs
      WHERE group_id = ${groupId}
    `;

    const config = scoringConfig || DEFAULT_SCORING;
    const rawTiebreakers =
      (scoringConfig?.tiebreakers as unknown) ?? DEFAULT_TIEBREAKERS;

    const rankings = seasonFilter
      ? await sql`
      WITH
      finished_events AS (
        SELECT id
        FROM events
        WHERE group_id = ${groupId}
          AND status = 'finished'
          AND starts_at >= ${seasonFilter.startsAt}
          AND starts_at <= ${seasonFilter.endsAt}
      ),
      event_mvp_winners AS (
        -- Vencedor claro (sem empate e sem tiebreaker): jogador com mais votos
        SELECT pv.rated_user_id as user_id, pv.event_id
        FROM (
          SELECT rated_user_id, event_id, COUNT(*) as vote_count
          FROM player_ratings
          WHERE 'mvp' = ANY(tags) AND event_id IN (SELECT id FROM finished_events)
          GROUP BY rated_user_id, event_id
        ) pv
        WHERE NOT EXISTS (
          SELECT 1 FROM player_ratings pr_other
          WHERE 'mvp' = ANY(pr_other.tags)
            AND pr_other.event_id = pv.event_id
            AND pr_other.rated_user_id != pv.rated_user_id
          GROUP BY pr_other.rated_user_id
          HAVING COUNT(*) >= pv.vote_count
        )
        AND NOT EXISTS (SELECT 1 FROM mvp_tiebreakers WHERE event_id = pv.event_id)
        UNION
        -- Vencedor do tiebreaker resolvido
        SELECT winner_user_id as user_id, event_id
        FROM mvp_tiebreakers
        WHERE event_id IN (SELECT id FROM finished_events)
          AND winner_user_id IS NOT NULL
          AND status IN ('completed', 'admin_decided')
      ),
      team_scores AS (
        SELECT
          t.id as team_id,
          t.event_id,
          t.name as team_name,
          t.is_winner,
          COALESCE(
            (SELECT COUNT(*) FROM event_actions ea
             WHERE ea.team_id = t.id AND ea.action_type = 'goal'
             AND ea.event_id IN (SELECT id FROM finished_events)),
            0
          )
          + COALESCE(
            (SELECT COUNT(*) FROM event_actions ea
             INNER JOIN teams t_opp ON ea.team_id = t_opp.id
             WHERE ea.action_type = 'own_goal'
               AND t_opp.event_id = t.event_id
               AND ea.team_id != t.id
               AND ea.event_id IN (SELECT id FROM finished_events)),
            0
          ) as goals_scored
        FROM teams t
        WHERE t.event_id IN (SELECT id FROM finished_events)
      ),
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
      player_stats AS (
        SELECT
          u.id as user_id,
          u.name as player_name,
          u.image as player_image,
          gm.base_rating,
          COUNT(DISTINCT CASE
            WHEN ea.status = 'yes' AND ea.checked_in_at IS NOT NULL
            THEN ea.event_id
          END) as games_played,
          COUNT(DISTINCT CASE WHEN pm.result = 'win' THEN pm.event_id END) as wins,
          COUNT(DISTINCT CASE WHEN pm.result = 'draw' THEN pm.event_id END) as draws,
          COUNT(DISTINCT CASE WHEN pm.result = 'loss' THEN pm.event_id END) as losses,
          COUNT(DISTINCT CASE
            WHEN eact_goals.action_type = 'goal'
            THEN eact_goals.id
          END) as goals,
          COUNT(DISTINCT CASE
            WHEN eact_assists.action_type = 'assist'
            THEN eact_assists.id
          END) as assists,
          COUNT(DISTINCT CASE
            WHEN eact_og.action_type = 'own_goal'
            THEN eact_og.id
          END) as own_goals,
          COALESCE(SUM(DISTINCT pm.team_goals), 0) as team_goals,
          COALESCE(SUM(DISTINCT pm.opponent_goals), 0) as goals_conceded,
          COUNT(DISTINCT emw.event_id) as mvp_count
        FROM users u
        INNER JOIN group_members gm ON u.id = gm.user_id AND gm.group_id = ${groupId}
        LEFT JOIN event_attendance ea ON u.id = ea.user_id
          AND ea.event_id IN (SELECT id FROM finished_events)
        LEFT JOIN player_matches pm ON u.id = pm.user_id
        LEFT JOIN event_actions eact_goals ON u.id = eact_goals.subject_user_id
          AND eact_goals.action_type = 'goal'
          AND eact_goals.event_id IN (SELECT id FROM finished_events)
        LEFT JOIN event_actions eact_assists ON u.id = eact_assists.subject_user_id
          AND eact_assists.action_type = 'assist'
          AND eact_assists.event_id IN (SELECT id FROM finished_events)
        LEFT JOIN event_actions eact_og ON u.id = eact_og.subject_user_id
          AND eact_og.action_type = 'own_goal'
          AND eact_og.event_id IN (SELECT id FROM finished_events)
        LEFT JOIN event_mvp_winners emw ON u.id = emw.user_id
        GROUP BY u.id, u.name, u.image, gm.base_rating
      )
      SELECT
        *,
        (team_goals - goals_conceded) as goal_difference,
        CASE
          WHEN games_played > 0
          THEN (wins::float / games_played::float * 100)::numeric(5,2)
          ELSE 0
        END as win_rate,
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
      WHERE games_played > 0
      ORDER BY points DESC
    `
      : await sql`
      WITH
      finished_events AS (
        SELECT id
        FROM events
        WHERE group_id = ${groupId}
          AND status = 'finished'
      ),
      event_mvp_winners AS (
        -- Vencedor claro (sem empate e sem tiebreaker): jogador com mais votos
        SELECT pv.rated_user_id as user_id, pv.event_id
        FROM (
          SELECT rated_user_id, event_id, COUNT(*) as vote_count
          FROM player_ratings
          WHERE 'mvp' = ANY(tags) AND event_id IN (SELECT id FROM finished_events)
          GROUP BY rated_user_id, event_id
        ) pv
        WHERE NOT EXISTS (
          SELECT 1 FROM player_ratings pr_other
          WHERE 'mvp' = ANY(pr_other.tags)
            AND pr_other.event_id = pv.event_id
            AND pr_other.rated_user_id != pv.rated_user_id
          GROUP BY pr_other.rated_user_id
          HAVING COUNT(*) >= pv.vote_count
        )
        AND NOT EXISTS (SELECT 1 FROM mvp_tiebreakers WHERE event_id = pv.event_id)
        UNION
        -- Vencedor do tiebreaker resolvido
        SELECT winner_user_id as user_id, event_id
        FROM mvp_tiebreakers
        WHERE event_id IN (SELECT id FROM finished_events)
          AND winner_user_id IS NOT NULL
          AND status IN ('completed', 'admin_decided')
      ),
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
          )
          + COALESCE(
            (SELECT COUNT(*) FROM event_actions ea
             INNER JOIN teams t_opp ON ea.team_id = t_opp.id
             WHERE ea.action_type = 'own_goal'
               AND t_opp.event_id = t.event_id
               AND ea.team_id != t.id),
            0
          ) as goals_scored
        FROM teams t
        WHERE t.event_id IN (SELECT id FROM finished_events)
      ),
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
      player_stats AS (
        SELECT
          u.id as user_id,
          u.name as player_name,
          u.image as player_image,
          gm.base_rating,
          COUNT(DISTINCT CASE
            WHEN ea.status = 'yes' AND ea.checked_in_at IS NOT NULL
            THEN ea.event_id
          END) as games_played,
          COUNT(DISTINCT CASE WHEN pm.result = 'win' THEN pm.event_id END) as wins,
          COUNT(DISTINCT CASE WHEN pm.result = 'draw' THEN pm.event_id END) as draws,
          COUNT(DISTINCT CASE WHEN pm.result = 'loss' THEN pm.event_id END) as losses,
          COUNT(DISTINCT CASE
            WHEN eact_goals.action_type = 'goal'
            THEN eact_goals.id
          END) as goals,
          COUNT(DISTINCT CASE
            WHEN eact_assists.action_type = 'assist'
            THEN eact_assists.id
          END) as assists,
          COUNT(DISTINCT CASE
            WHEN eact_og.action_type = 'own_goal'
            THEN eact_og.id
          END) as own_goals,
          COALESCE(SUM(DISTINCT pm.team_goals), 0) as team_goals,
          COALESCE(SUM(DISTINCT pm.opponent_goals), 0) as goals_conceded,
          COUNT(DISTINCT emw.event_id) as mvp_count
        FROM users u
        INNER JOIN group_members gm ON u.id = gm.user_id AND gm.group_id = ${groupId}
        LEFT JOIN event_attendance ea ON u.id = ea.user_id
          AND ea.event_id IN (SELECT id FROM finished_events)
        LEFT JOIN player_matches pm ON u.id = pm.user_id
        LEFT JOIN event_actions eact_goals ON u.id = eact_goals.subject_user_id
          AND eact_goals.action_type = 'goal'
          AND eact_goals.event_id IN (SELECT id FROM finished_events)
        LEFT JOIN event_actions eact_assists ON u.id = eact_assists.subject_user_id
          AND eact_assists.action_type = 'assist'
          AND eact_assists.event_id IN (SELECT id FROM finished_events)
        LEFT JOIN event_actions eact_og ON u.id = eact_og.subject_user_id
          AND eact_og.action_type = 'own_goal'
          AND eact_og.event_id IN (SELECT id FROM finished_events)
        LEFT JOIN event_mvp_winners emw ON u.id = emw.user_id
        GROUP BY u.id, u.name, u.image, gm.base_rating
      )
      SELECT
        *,
        (team_goals - goals_conceded) as goal_difference,
        CASE
          WHEN games_played > 0
          THEN (wins::float / games_played::float * 100)::numeric(5,2)
          ELSE 0
        END as win_rate,
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
      WHERE games_played > 0
      ORDER BY points DESC
    `;

    const sortedRankings = sortRankings(
      rankings as unknown as RankingRow[],
      rawTiebreakers
    );

    logger.info({
      groupId,
      seasonId: activeSeason?.id || null,
      totalPlayers: sortedRankings.length,
      config: {
        pointsWin: config.pointsWin,
        pointsDraw: config.pointsDraw,
        pointsLoss: config.pointsLoss,
        rankingMode: config.rankingMode,
      }
    }, "Rankings calculated");

    const normalizedConfig = {
      ...config,
      tiebreakers: Array.isArray(rawTiebreakers)
        ? (rawTiebreakers as unknown[]).filter(
            (k): k is string => typeof k === "string"
          )
        : [...DEFAULT_TIEBREAKERS],
    };

    return NextResponse.json({
      rankings: sortedRankings,
      scoringConfig: normalizedConfig,
      ...(activeSeason && { season: activeSeason }),
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error fetching rankings",
      fallbackMessage: "Erro ao buscar rankings",
    });
  }
}
