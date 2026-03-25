import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ eventId: string; teamId: string }>;

const updateTeamSchema = z.object({
  name: z.string().min(1, "Nome Ã© obrigatÃ³rio").max(50, "Nome muito longo"),
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

    await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem editar nomes dos times",
    });

    const [team] = await sql`
      SELECT t.*, e.group_id
      FROM teams t
      INNER JOIN events e ON t.event_id = e.id
      WHERE t.id = ${teamId} AND t.event_id = ${eventId}
    `;

    if (!team) {
      return NextResponse.json(
        { error: "Time nÃ£o encontrado" },
        { status: 404 }
      );
    }

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: error.errors },
        { status: 400 }
      );
    }

    return handleRouteError(error, {
      logMessage: "Error updating team name",
      fallbackMessage: "Erro ao atualizar nome do time",
    });
  }
}
