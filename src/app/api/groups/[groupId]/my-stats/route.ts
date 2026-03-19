import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

// GET /api/groups/[groupId]/my-stats - Estatísticas pessoais do usuário no grupo
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId } = await params;
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("seasonId");

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

    // Determine date filter for season
    let seasonFilter: { startsAt: string; endsAt: string } | null = null;

    if (seasonId) {
      const [season] = await sql`
        SELECT starts_at, ends_at FROM seasons
        WHERE id = ${seasonId} AND group_id = ${groupId}
      `;
      if (season) {
        seasonFilter = { startsAt: season.starts_at, endsAt: season.ends_at };
      }
    } else {
      const [active] = await sql`
        SELECT starts_at, ends_at FROM seasons
        WHERE group_id = ${groupId} AND status = 'active'
        LIMIT 1
      `;
      if (active) {
        seasonFilter = { startsAt: active.starts_at, endsAt: active.ends_at };
      }
    }

    // Buscar estatísticas completas do usuário
    const stats = seasonFilter
      ? await sql`
      WITH
      user_events AS (
        SELECT DISTINCT e.id
        FROM events e
        INNER JOIN teams t ON t.event_id = e.id
        INNER JOIN team_members tm ON tm.team_id = t.id
        WHERE e.group_id = ${groupId}
          AND e.status = 'finished'
          AND tm.user_id = ${user.id}
          AND e.starts_at >= ${seasonFilter.startsAt}
          AND e.starts_at <= ${seasonFilter.endsAt}
      ),
      my_game_results AS (
        SELECT
          t_player.event_id,
          (SELECT COUNT(*) FROM event_actions ea WHERE ea.team_id = t_player.id AND ea.event_id = t_player.event_id AND ea.action_type = 'goal')
          + (SELECT COUNT(*) FROM event_actions ea INNER JOIN teams t_opp ON ea.team_id = t_opp.id WHERE t_opp.event_id = t_player.event_id AND t_opp.id != t_player.id AND ea.action_type = 'own_goal' AND ea.event_id = t_player.event_id) as team_goals,
          (SELECT COUNT(*) FROM event_actions ea INNER JOIN teams t2 ON ea.team_id = t2.id WHERE t2.event_id = t_player.event_id AND t2.id != t_player.id AND ea.action_type = 'goal' AND ea.event_id = t_player.event_id)
          + (SELECT COUNT(*) FROM event_actions ea WHERE ea.team_id = t_player.id AND ea.event_id = t_player.event_id AND ea.action_type = 'own_goal') as opponent_goals
        FROM team_members tm
        INNER JOIN teams t_player ON tm.team_id = t_player.id
        WHERE tm.user_id = ${user.id} AND t_player.event_id IN (SELECT id FROM user_events)
      )
      SELECT
        (SELECT COUNT(*) FROM user_events)::int as games_played,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'goal')::int as goals,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'assist')::int as assists,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'save')::int as saves,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'own_goal')::int as own_goals,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'yellow_card')::int as yellow_cards,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'red_card')::int as red_cards,
        (SELECT COUNT(*) FROM my_game_results WHERE team_goals > opponent_goals)::int as wins,
        (SELECT COUNT(*) FROM my_game_results WHERE team_goals < opponent_goals)::int as losses,
        (SELECT COUNT(*) FROM my_game_results WHERE team_goals = opponent_goals)::int as draws,
        (SELECT COUNT(*) FROM player_ratings WHERE rated_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND 'mvp' = ANY(tags))::int as mvp_count
    `
      : await sql`
      WITH
      user_events AS (
        SELECT DISTINCT e.id
        FROM events e
        INNER JOIN teams t ON t.event_id = e.id
        INNER JOIN team_members tm ON tm.team_id = t.id
        WHERE e.group_id = ${groupId}
          AND e.status = 'finished'
          AND tm.user_id = ${user.id}
      ),
      my_game_results AS (
        SELECT
          t_player.event_id,
          (SELECT COUNT(*) FROM event_actions ea WHERE ea.team_id = t_player.id AND ea.event_id = t_player.event_id AND ea.action_type = 'goal')
          + (SELECT COUNT(*) FROM event_actions ea INNER JOIN teams t_opp ON ea.team_id = t_opp.id WHERE t_opp.event_id = t_player.event_id AND t_opp.id != t_player.id AND ea.action_type = 'own_goal' AND ea.event_id = t_player.event_id) as team_goals,
          (SELECT COUNT(*) FROM event_actions ea INNER JOIN teams t2 ON ea.team_id = t2.id WHERE t2.event_id = t_player.event_id AND t2.id != t_player.id AND ea.action_type = 'goal' AND ea.event_id = t_player.event_id)
          + (SELECT COUNT(*) FROM event_actions ea WHERE ea.team_id = t_player.id AND ea.event_id = t_player.event_id AND ea.action_type = 'own_goal') as opponent_goals
        FROM team_members tm
        INNER JOIN teams t_player ON tm.team_id = t_player.id
        WHERE tm.user_id = ${user.id} AND t_player.event_id IN (SELECT id FROM user_events)
      )
      SELECT
        (SELECT COUNT(*) FROM user_events)::int as games_played,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'goal')::int as goals,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'assist')::int as assists,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'save')::int as saves,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'own_goal')::int as own_goals,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'yellow_card')::int as yellow_cards,
        (SELECT COUNT(*) FROM event_actions WHERE subject_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND action_type = 'red_card')::int as red_cards,
        (SELECT COUNT(*) FROM my_game_results WHERE team_goals > opponent_goals)::int as wins,
        (SELECT COUNT(*) FROM my_game_results WHERE team_goals < opponent_goals)::int as losses,
        (SELECT COUNT(*) FROM my_game_results WHERE team_goals = opponent_goals)::int as draws,
        (SELECT COUNT(*) FROM player_ratings WHERE rated_user_id = ${user.id} AND event_id IN (SELECT id FROM user_events) AND 'mvp' = ANY(tags))::int as mvp_count
    `;

    if (!stats || stats.length === 0 || stats[0].games_played === '0') {
      return NextResponse.json({
        gamesPlayed: 0,
        goals: 0,
        assists: 0,
        saves: 0,
        ownGoals: 0,
        yellowCards: 0,
        redCards: 0,
        averageRating: null,
        wins: 0,
        losses: 0,
        draws: 0,
        mvpCount: 0,
        tags: {},
      });
    }

    const userStats = stats[0];

    // Buscar tags recebidas
    const tagsQuery = seasonFilter
      ? await sql`
        SELECT UNNEST(tags) as tag, COUNT(*) as count
        FROM player_ratings pr
        INNER JOIN events e ON pr.event_id = e.id
        WHERE e.group_id = ${groupId}
          AND e.status = 'finished'
          AND pr.rated_user_id = ${user.id}
          AND tags IS NOT NULL
          AND e.starts_at >= ${seasonFilter.startsAt}
          AND e.starts_at <= ${seasonFilter.endsAt}
        GROUP BY tag
        ORDER BY count DESC
      `
      : await sql`
        SELECT UNNEST(tags) as tag, COUNT(*) as count
        FROM player_ratings pr
        INNER JOIN events e ON pr.event_id = e.id
        WHERE e.group_id = ${groupId}
          AND e.status = 'finished'
          AND pr.rated_user_id = ${user.id}
          AND tags IS NOT NULL
        GROUP BY tag
        ORDER BY count DESC
      `;

    const tags: Record<string, number> = {};
    (tagsQuery as unknown as Array<{ tag: string; count: string }>).forEach((t) => {
      tags[t.tag] = parseInt(t.count);
    });

    return NextResponse.json({
      gamesPlayed: parseInt(userStats.games_played) || 0,
      goals: parseInt(userStats.goals) || 0,
      assists: parseInt(userStats.assists) || 0,
      saves: parseInt(userStats.saves) || 0,
      ownGoals: parseInt(userStats.own_goals) || 0,
      yellowCards: parseInt(userStats.yellow_cards) || 0,
      redCards: parseInt(userStats.red_cards) || 0,
      averageRating: null,
      wins: parseInt(userStats.wins) || 0,
      losses: parseInt(userStats.losses) || 0,
      draws: parseInt(userStats.draws) || 0,
      mvpCount: parseInt(userStats.mvp_count) || 0,
      tags,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching user stats");
    return NextResponse.json(
      { error: "Erro ao buscar suas estatísticas" },
      { status: 500 }
    );
  }
}
