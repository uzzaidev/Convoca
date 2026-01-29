import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";

type Params = Promise<{ eventId: string; teamId: string }>;

const updateTeamSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),
});

// PATCH /api/events/:eventId/teams/:teamId - Update team name
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId, teamId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = updateTeamSchema.parse(body);

    // Get event and verify team belongs to it
    const [team] = await sql`
      SELECT t.*, e.group_id
      FROM teams t
      INNER JOIN events e ON t.event_id = e.id
      WHERE t.id = ${teamId} AND t.event_id = ${eventId}
    `;

    if (!team) {
      return NextResponse.json(
        { error: "Time não encontrado" },
        { status: 404 }
      );
    }

    // Check if user is admin of the group
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${team.group_id} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem editar nomes dos times" },
        { status: 403 }
      );
    }

    // Update team name
    await sql`
      UPDATE teams
      SET name = ${validatedData.name}
      WHERE id = ${teamId}
    `;

    logger.info(
      { eventId, teamId, newName: validatedData.name, userId: user.id },
      "Team name updated"
    );

    return NextResponse.json({
      success: true,
      message: "Nome do time atualizado com sucesso",
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
    logger.error(error, "Error updating team name");
    return NextResponse.json(
      { error: "Erro ao atualizar nome do time" },
      { status: 500 }
    );
  }
}
