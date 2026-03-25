import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { eventId } = await context.params;

    await requireEventAccess(eventId, user);

    const [tiebreaker] = await sql`
      SELECT * FROM mvp_tiebreakers
      WHERE event_id = ${eventId}
      ORDER BY round DESC
      LIMIT 1
    `;

    if (!tiebreaker) {
      return NextResponse.json({
        hasTiebreaker: false,
      });
    }

    const tiedUserIds = tiebreaker.tied_user_ids as string[];
    const players = await sql`
      SELECT id, name, image
      FROM users
      WHERE id = ANY(${tiedUserIds})
    `;

    const voteCounts = await sql`
      SELECT
        voted_user_id,
        COUNT(*) as vote_count
      FROM mvp_tiebreaker_votes
      WHERE tiebreaker_id = ${tiebreaker.id}
      GROUP BY voted_user_id
    `;

    const [userVote] = await sql`
      SELECT voted_user_id
      FROM mvp_tiebreaker_votes
      WHERE tiebreaker_id = ${tiebreaker.id} AND voter_user_id = ${user.id}
    `;

    const [participantCount] = await sql`
      SELECT COUNT(DISTINCT user_id) as count
      FROM event_attendance
      WHERE event_id = ${eventId} AND status = 'yes'
    `;

    const playersWithVotes = players.map((player) => {
      const voteCount = voteCounts.find(
        (vote) => vote.voted_user_id === player.id
      );
      return {
        userId: player.id,
        userName: player.name,
        userImage: player.image,
        voteCount: voteCount ? parseInt(voteCount.vote_count as string) : 0,
      };
    });

    return NextResponse.json({
      hasTiebreaker: true,
      tiebreaker: {
        id: tiebreaker.id,
        round: tiebreaker.round,
        status: tiebreaker.status,
        createdAt: tiebreaker.created_at,
        completedAt: tiebreaker.completed_at,
        winnerId: tiebreaker.winner_user_id,
        decidedBy: tiebreaker.decided_by,
        players: playersWithVotes,
        userHasVoted: !!userVote,
        userVotedFor: userVote?.voted_user_id || null,
        totalParticipants: parseInt(participantCount.count as string),
      },
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error fetching tiebreaker status",
      fallbackMessage: "Erro ao buscar status do desempate",
    });
  }
}
