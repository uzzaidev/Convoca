import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { eventActionSchema } from "@/lib/validations";
import logger from "@/lib/logger";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ eventId: string }>;

// GET /api/events/:eventId/actions - Get all actions for event
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    await requireEventAccess(eventId, user);

    const actions = await sql`
      SELECT
        ea.*,
        u.name as actor_name,
        u.image as actor_image,
        su.name as subject_name,
        su.image as subject_image,
        t.name as team_name
      FROM event_actions ea
      INNER JOIN users u ON ea.actor_user_id = u.id
      LEFT JOIN users su ON ea.subject_user_id = su.id
      LEFT JOIN teams t ON ea.team_id = t.id
      WHERE ea.event_id = ${eventId}
      ORDER BY ea.created_at ASC
    `;

    return NextResponse.json({ actions });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error fetching event actions",
      fallbackMessage: "Erro ao buscar aÃ§Ãµes do evento",
    });
  }
}

// POST /api/events/:eventId/actions - Create event action (goal, assist, etc)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const actionData = {
      ...body,
      eventId,
      actorUserId: user.id,
    };

    const validation = eventActionSchema.safeParse(actionData);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { actorUserId, actionType, subjectUserId, teamId, minute, metadata } = validation.data;

    await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem registrar aÃ§Ãµes",
    });

    const [action] = await sql`
      INSERT INTO event_actions (
        event_id,
        actor_user_id,
        action_type,
        subject_user_id,
        team_id,
        minute,
        metadata
      )
      VALUES (
        ${eventId},
        ${actorUserId},
        ${actionType},
        ${subjectUserId || null},
        ${teamId || null},
        ${minute || null},
        ${metadata ? JSON.stringify(metadata) : null}
      )
      RETURNING *
    `;

    logger.info(
      { eventId, actionType, actorUserId },
      "Event action created"
    );

    return NextResponse.json({ action }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error creating event action",
      fallbackMessage: "Erro ao criar aÃ§Ã£o",
    });
  }
}

// DELETE /api/events/:eventId/actions - Delete event action (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const { actionId } = body;

    if (!actionId) {
      return NextResponse.json(
        { error: "actionId Ã© obrigatÃ³rio" },
        { status: 400 }
      );
    }

    await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem deletar aÃ§Ãµes",
    });

    const result = await sql`
      DELETE FROM event_actions
      WHERE id = ${actionId} AND event_id = ${eventId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "AÃ§Ã£o nÃ£o encontrada" },
        { status: 404 }
      );
    }

    logger.info(
      { eventId, actionId, userId: user.id },
      "Event action deleted"
    );

    return NextResponse.json({ message: "AÃ§Ã£o deletada com sucesso" });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error deleting event action",
      fallbackMessage: "Erro ao deletar aÃ§Ã£o",
    });
  }
}
