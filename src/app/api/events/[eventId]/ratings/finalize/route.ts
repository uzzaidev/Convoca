import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { eventId } = await context.params;

    await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas administradores podem finalizar votaÃ§Ã£o",
    });

    const voteCounts = await sql`
      SELECT
        rated_user_id,
        u.name as user_name,
        COUNT(*) as vote_count
      FROM player_ratings
      INNER JOIN users u ON player_ratings.rated_user_id = u.id
      WHERE event_id = ${eventId} AND 'mvp' = ANY(tags)
      GROUP BY rated_user_id, u.name
      ORDER BY vote_count DESC
    `;

    if (voteCounts.length === 0) {
      return NextResponse.json(
        { error: "Nenhum voto registrado ainda" },
        { status: 400 }
      );
    }

    const maxVotes = parseInt(voteCounts[0].vote_count as string);
    const tiedPlayers = voteCounts.filter(
      (vote) => parseInt(vote.vote_count as string) === maxVotes
    );

    if (tiedPlayers.length === 1) {
      return NextResponse.json({
        success: true,
        hasTie: false,
        winner: {
          userId: tiedPlayers[0].rated_user_id,
          userName: tiedPlayers[0].user_name,
          voteCount: maxVotes,
        },
      });
    }

    const tiedUserIds = tiedPlayers.map((player) => player.rated_user_id);

    const [existingTiebreaker] = await sql`
      SELECT id, status, round FROM mvp_tiebreakers
      WHERE event_id = ${eventId}
      ORDER BY round DESC
      LIMIT 1
    `;

    if (
      existingTiebreaker &&
      existingTiebreaker.status !== "completed" &&
      existingTiebreaker.status !== "admin_decided"
    ) {
      return NextResponse.json(
        { error: "JÃ¡ existe um desempate em andamento para este evento" },
        { status: 400 }
      );
    }

    const round = existingTiebreaker ? (existingTiebreaker.round as number) + 1 : 1;

    const [tiebreaker] = await sql`
      INSERT INTO mvp_tiebreakers (
        event_id,
        round,
        status,
        tied_user_ids
      ) VALUES (
        ${eventId},
        ${round},
        'pending',
        ${tiedUserIds}
      )
      RETURNING *
    `;

    logger.info(
      { eventId, tiedUserIds, round, userId: user.id },
      "MVP tiebreaker created"
    );

    return NextResponse.json({
      success: true,
      hasTie: true,
      tiebreaker: {
        id: tiebreaker.id,
        round,
        status: tiebreaker.status,
        tiedPlayers: tiedPlayers.map((player) => ({
          userId: player.rated_user_id,
          userName: player.user_name,
          voteCount: maxVotes,
        })),
      },
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error finalizing MVP voting",
      fallbackMessage: "Erro ao finalizar votaÃ§Ã£o",
    });
  }
}
