import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ eventId: string }>;

const swapPlayersSchema = z.object({
  player1: z.object({
    userId: z.string().uuid(),
    currentTeamId: z.string().uuid(),
  }),
  player2: z.object({
    userId: z.string().uuid(),
    currentTeamId: z.string().uuid(),
  }),
});

// POST /api/events/:eventId/teams/swap - Swap two players between teams
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = swapPlayersSchema.parse(body);

    await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem trocar jogadores",
    });

    const teamsCheck = await sql`
      SELECT t.id
      FROM teams t
      WHERE t.event_id = ${eventId}
        AND t.id IN (${validatedData.player1.currentTeamId}, ${validatedData.player2.currentTeamId})
    `;

    if (teamsCheck.length !== 2) {
      return NextResponse.json(
        { error: "Um ou ambos os times nÃ£o pertencem a este evento" },
        { status: 400 }
      );
    }

    const [player1Info] = await sql`
      SELECT position FROM team_members
      WHERE team_id = ${validatedData.player1.currentTeamId}
        AND user_id = ${validatedData.player1.userId}
    `;

    const [player2Info] = await sql`
      SELECT position FROM team_members
      WHERE team_id = ${validatedData.player2.currentTeamId}
        AND user_id = ${validatedData.player2.userId}
    `;

    if (!player1Info || !player2Info) {
      return NextResponse.json(
        { error: "Um ou ambos os jogadores nÃ£o foram encontrados" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE team_members
      SET team_id = CASE
        WHEN user_id = ${validatedData.player1.userId} AND team_id = ${validatedData.player1.currentTeamId}
          THEN ${validatedData.player2.currentTeamId}
        WHEN user_id = ${validatedData.player2.userId} AND team_id = ${validatedData.player2.currentTeamId}
          THEN ${validatedData.player1.currentTeamId}
      END
      WHERE (user_id = ${validatedData.player1.userId} AND team_id = ${validatedData.player1.currentTeamId})
         OR (user_id = ${validatedData.player2.userId} AND team_id = ${validatedData.player2.currentTeamId})
    `;

    logger.info(
      {
        eventId,
        userId: user.id,
        player1: validatedData.player1.userId,
        player2: validatedData.player2.userId,
      },
      "Players swapped between teams"
    );

    return NextResponse.json({
      success: true,
      message: "Jogadores trocados com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: error.errors },
        { status: 400 }
      );
    }

    return handleRouteError(error, {
      logMessage: "Error swapping players",
      fallbackMessage: "Erro ao trocar jogadores",
    });
  }
}
