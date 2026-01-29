import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";

type Params = Promise<{ eventId: string }>;

// Schema for swapping players
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

    // Get event
    const [event] = await sql`
      SELECT * FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Check if user is admin of the group
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem trocar jogadores" },
        { status: 403 }
      );
    }

    // Verify both teams belong to this event
    const teamsCheck = await sql`
      SELECT t.id
      FROM teams t
      WHERE t.event_id = ${eventId}
        AND t.id IN (${validatedData.player1.currentTeamId}, ${validatedData.player2.currentTeamId})
    `;

    if (teamsCheck.length !== 2) {
      return NextResponse.json(
        { error: "Um ou ambos os times não pertencem a este evento" },
        { status: 400 }
      );
    }

    // Get player 1 info
    const [player1Info] = await sql`
      SELECT position FROM team_members
      WHERE team_id = ${validatedData.player1.currentTeamId}
        AND user_id = ${validatedData.player1.userId}
    `;

    // Get player 2 info
    const [player2Info] = await sql`
      SELECT position FROM team_members
      WHERE team_id = ${validatedData.player2.currentTeamId}
        AND user_id = ${validatedData.player2.userId}
    `;

    if (!player1Info || !player2Info) {
      return NextResponse.json(
        { error: "Um ou ambos os jogadores não foram encontrados" },
        { status: 400 }
      );
    }

    // Perform the swap atomically using a single UPDATE with CASE
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
      message: "Jogadores trocados com sucesso" 
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    logger.error(error, "Error swapping players");
    return NextResponse.json(
      { error: "Erro ao trocar jogadores" },
      { status: 500 }
    );
  }
}
