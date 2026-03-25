import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { playerRatingSchema } from "@/lib/validations";
import logger from "@/lib/logger";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ eventId: string }>;

// GET /api/events/:eventId/ratings - Get user's vote for this event
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    await requireEventAccess(eventId, user, {
      allowSystemAdmin: false,
    });

    const [vote] = await sql`
      SELECT rated_user_id as player_id
      FROM player_ratings
      WHERE event_id = ${eventId} 
        AND rater_user_id = ${user.id}
        AND 'mvp' = ANY(tags)
      LIMIT 1
    `;

    const voteCounts = await sql`
      SELECT
        pr.rated_user_id as user_id,
        u.name as user_name,
        COUNT(*)::int as vote_count
      FROM player_ratings pr
      INNER JOIN users u ON pr.rated_user_id = u.id
      WHERE pr.event_id = ${eventId} AND 'mvp' = ANY(pr.tags)
      GROUP BY pr.rated_user_id, u.name
      ORDER BY vote_count DESC
    `;

    const [totalResult] = await sql`
      SELECT COUNT(DISTINCT rater_user_id)::int as total
      FROM player_ratings
      WHERE event_id = ${eventId} AND 'mvp' = ANY(tags)
    `;

    return NextResponse.json({
      vote: vote || null,
      voteCounts: voteCounts || [],
      totalVoters: totalResult?.total || 0,
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error fetching vote",
      fallbackMessage: "Erro ao buscar voto",
    });
  }
}

// POST /api/events/:eventId/ratings - Submit MVP vote (single player)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validation = playerRatingSchema.safeParse({ ...body, eventId });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { ratedUserId } = validation.data;
    const { groupAccess } = await requireEventAccess(eventId, user, {
      allowSystemAdmin: false,
    });

    const [userInTeam] = await sql`
      SELECT tm.user_id
      FROM team_members tm
      INNER JOIN teams t ON tm.team_id = t.id
      WHERE t.event_id = ${eventId} AND tm.user_id = ${user.id}
    `;

    if (!userInTeam && groupAccess.userRole !== "admin") {
      return NextResponse.json(
        { error: "VocÃª precisa ter participado do evento para votar" },
        { status: 403 }
      );
    }

    if (ratedUserId === user.id) {
      return NextResponse.json(
        { error: "VocÃª nÃ£o pode votar em si mesmo" },
        { status: 400 }
      );
    }

    const [ratedInTeam] = await sql`
      SELECT tm.user_id
      FROM team_members tm
      INNER JOIN teams t ON tm.team_id = t.id
      WHERE t.event_id = ${eventId} AND tm.user_id = ${ratedUserId}
    `;

    if (!ratedInTeam) {
      return NextResponse.json(
        { error: "SÃ³ Ã© possÃ­vel votar em jogadores que participaram" },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM player_ratings
      WHERE event_id = ${eventId} AND rater_user_id = ${user.id}
    `;

    const [vote] = await sql`
      INSERT INTO player_ratings (
        event_id,
        rater_user_id,
        rated_user_id,
        score,
        tags
      )
      VALUES (
        ${eventId},
        ${user.id},
        ${ratedUserId},
        NULL,
        ARRAY['mvp']::TEXT[]
      )
      RETURNING *
    `;

    logger.info(
      { eventId, raterUserId: user.id, ratedUserId },
      "MVP vote submitted"
    );

    return NextResponse.json({ vote });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error submitting vote",
      fallbackMessage: "Erro ao votar",
    });
  }
}
