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
    currentTeamId: z.string().uuid().optional(),
  }),
  player2: z.object({
    userId: z.string().uuid(),
    currentTeamId: z.string().uuid().optional(),
  }),
}).refine((data) => data.player1.userId !== data.player2.userId, {
  message: "Selecione dois jogadores diferentes",
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

    const memberships = await sql<{
      user_id: string;
      team_id: string;
    }[]>`
      SELECT tm.user_id, tm.team_id
      FROM team_members tm
      INNER JOIN teams t ON t.id = tm.team_id
      WHERE t.event_id = ${eventId}
        AND tm.user_id IN (${validatedData.player1.userId}, ${validatedData.player2.userId})
    `;

    const player1Info = memberships.find(
      (membership) => membership.user_id === validatedData.player1.userId
    );
    const player2Info = memberships.find(
      (membership) => membership.user_id === validatedData.player2.userId
    );

    if (!player1Info || !player2Info) {
      return NextResponse.json(
        { error: "Um ou ambos os jogadores nao foram encontrados" },
        { status: 400 }
      );
    }

    if (player1Info.team_id === player2Info.team_id) {
      return NextResponse.json(
        { error: "Selecione jogadores de times diferentes" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE team_members
      SET team_id = ${player2Info.team_id}
      WHERE user_id = ${validatedData.player1.userId}
        AND team_id = ${player1Info.team_id}
    `;

    await sql`
      UPDATE team_members
      SET team_id = ${player1Info.team_id}
      WHERE user_id = ${validatedData.player2.userId}
        AND team_id = ${player2Info.team_id}
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
      player1: {
        userId: validatedData.player1.userId,
        teamId: player2Info.team_id,
      },
      player2: {
        userId: validatedData.player2.userId,
        teamId: player1Info.team_id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.errors },
        { status: 400 }
      );
    }

    return handleRouteError(error, {
      logMessage: "Error swapping players",
      fallbackMessage: "Erro ao trocar jogadores",
    });
  }
}
