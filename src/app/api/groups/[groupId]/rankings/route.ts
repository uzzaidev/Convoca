import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Check if user is member
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${session.user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    // Get player statistics and rankings
    const rankings = await sql`
      WITH player_stats AS (
        SELECT
          u.id as user_id,
          u.name as player_name,
          u.image as player_image,
          gm.base_rating,
          -- Count games played
          COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'yes') as games_played,
          -- Count goals scored
          COUNT(DISTINCT eact.id) FILTER (WHERE eact.action_type = 'goal') as goals,
          -- Count assists
          COUNT(DISTINCT eact2.id) FILTER (WHERE eact2.action_type = 'assist') as assists,
          -- Average rating received
          COALESCE(AVG(pr.score), 0)::numeric(4,2) as avg_rating,
          -- Count wins (needs team membership + team.is_winner)
          COUNT(DISTINCT CASE 
            WHEN t.is_winner = true THEN e.id 
            ELSE NULL 
          END) as wins,
          -- MVP count (ratings with 'mvp' tag)
          COUNT(DISTINCT pr2.id) FILTER (WHERE 'mvp' = ANY(pr2.tags)) as mvp_count
        FROM users u
        INNER JOIN group_members gm ON u.id = gm.user_id
        LEFT JOIN event_attendance ea ON u.id = ea.user_id
        LEFT JOIN events e ON ea.event_id = e.id AND e.group_id = ${groupId}
        LEFT JOIN event_actions eact ON u.id = eact.actor_user_id AND eact.event_id = e.id
        LEFT JOIN event_actions eact2 ON u.id = eact2.actor_user_id AND eact2.event_id = e.id
        LEFT JOIN player_ratings pr ON u.id = pr.rated_user_id AND pr.event_id = e.id
        LEFT JOIN player_ratings pr2 ON u.id = pr2.rated_user_id AND pr2.event_id = e.id
        LEFT JOIN team_members tm ON u.id = tm.user_id
        LEFT JOIN teams t ON tm.team_id = t.id AND t.event_id = e.id
        WHERE gm.group_id = ${groupId}
        GROUP BY u.id, u.name, u.image, gm.base_rating
      )
      SELECT
        *,
        -- Calculate win rate
        CASE 
          WHEN games_played > 0 THEN (wins::float / games_played::float * 100)::numeric(5,2)
          ELSE 0
        END as win_rate,
        -- Calculate performance score (weighted sum)
        (
          (games_played * 1) +
          (goals * 3) +
          (assists * 2) +
          (avg_rating * 5) +
          (wins * 5) +
          (mvp_count * 10)
        )::numeric(10,2) as performance_score
      FROM player_stats
      WHERE games_played > 0
      ORDER BY performance_score DESC, avg_rating DESC, goals DESC
    `;

    return NextResponse.json({ rankings });
  } catch (error) {
    logger.error(error, "Error fetching rankings");
    return NextResponse.json(
      { error: "Erro ao buscar rankings" },
      { status: 500 }
    );
  }
}
