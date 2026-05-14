import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

// GET /api/groups/[groupId]/stats - EstatÃ­sticas e rankings do grupo
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId } = await params;
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("seasonId");

    await requireGroupAccess(groupId, user);

    let seasonFilter: { startsAt: string; endsAt: string } | null = null;

    if (seasonId === "all") {
      // Agregação geral: sem filtro de temporada.
    } else if (seasonId) {
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

    const finishedEvents = seasonFilter
      ? await sql`
          SELECT id FROM events
          WHERE group_id = ${groupId} AND status = 'finished'
            AND starts_at >= ${seasonFilter.startsAt}
            AND starts_at <= ${seasonFilter.endsAt}
        `
      : await sql`
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

    const eventIds = (finishedEvents as unknown as Array<{ id: string }>).map((event) => event.id);

    const topScorers = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        COUNT(*) as goals
      FROM event_actions ea
      INNER JOIN users u ON ea.subject_user_id = u.id
      WHERE ea.event_id = ANY(${eventIds})
        AND ea.action_type = 'goal'
        AND ea.subject_user_id IS NOT NULL
      GROUP BY u.id, u.name, u.image
      ORDER BY goals DESC
      LIMIT 10
    `;

    const topAssisters = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        COUNT(*) as assists
      FROM event_actions ea
      INNER JOIN users u ON ea.subject_user_id = u.id
      WHERE ea.event_id = ANY(${eventIds})
        AND ea.action_type = 'assist'
        AND ea.subject_user_id IS NOT NULL
      GROUP BY u.id, u.name, u.image
      ORDER BY assists DESC
      LIMIT 10
    `;

    const topGoalkeepers = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        COUNT(*) as saves
      FROM event_actions ea
      INNER JOIN users u ON ea.subject_user_id = u.id
      WHERE ea.event_id = ANY(${eventIds})
        AND ea.action_type = 'save'
        AND ea.subject_user_id IS NOT NULL
      GROUP BY u.id, u.name, u.image
      ORDER BY saves DESC
      LIMIT 10
    `;

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
            ) + (
              SELECT COUNT(*)
              FROM event_actions ea3
              INNER JOIN teams t_opp ON ea3.team_id = t_opp.id
              WHERE ea3.action_type = 'own_goal'
                AND t_opp.event_id = e.id
                AND ea3.team_id != t.id
                AND ea3.event_id = e.id
            )
          ) ORDER BY t.seed)
          FROM teams t
          WHERE t.event_id = e.id
        ) as teams
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE e.group_id = ${groupId}
        AND e.status = 'finished'
        AND e.id = ANY(${eventIds})
      ORDER BY e.starts_at DESC
      LIMIT 5
    `;

    const playerFrequency = await sql`
      WITH recent_events AS (
        SELECT id
        FROM events
        WHERE group_id = ${groupId}
          AND status = 'finished'
          AND id = ANY(${eventIds})
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
        COUNT(DISTINCT CASE
          WHEN ea.status = 'yes' AND ea.checked_in_at IS NOT NULL
          THEN ea.event_id
        END) as games_played,
        COUNT(DISTINCT CASE
          WHEN ea.status = 'dm'
          THEN ea.event_id
        END) as games_dm,
        COUNT(DISTINCT CASE
          WHEN ea.status = 'no'
          THEN ea.event_id
        END) as games_absent,
        (SELECT total FROM total_count) as total_games,
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
      HAVING COUNT(DISTINCT ea.event_id) > 0
      ORDER BY games_played DESC, frequency_percentage DESC
    `;

    return NextResponse.json({
      topScorers,
      topAssisters,
      topGoalkeepers,
      recentMatches,
      playerFrequency,
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error fetching group stats",
      fallbackMessage: "Erro ao buscar estatÃ­sticas",
    });
  }
}
