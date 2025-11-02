import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { eventActionSchema } from "@/lib/validations";
import logger from "@/lib/logger";

type Params = Promise<{ eventId: string }>;

// GET /api/events/:eventId/actions - Get all actions for event
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    const [event] = await sql`
      SELECT group_id FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Check if user is member
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    const actions = await sql`
      SELECT
        ea.*,
        u.name as actor_name,
        u.image as actor_image,
        t.name as team_name
      FROM event_actions ea
      INNER JOIN users u ON ea.actor_user_id = u.id
      LEFT JOIN teams t ON ea.team_id = t.id
      WHERE ea.event_id = ${eventId}
      ORDER BY ea.created_at ASC
    `;

    return NextResponse.json({ actions });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching event actions");
    return NextResponse.json(
      { error: "Erro ao buscar ações do evento" },
      { status: 500 }
    );
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

    // Use current user as actor
    const actionData = {
      ...body,
      eventId,
      actorUserId: user.id, // Always use logged-in user as actor
    };

    const validation = eventActionSchema.safeParse(actionData);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { actorUserId, actionType, subjectUserId, teamId, minute, metadata } = validation.data;

    const [event] = await sql`
      SELECT * FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Check if user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem registrar ações" },
        { status: 403 }
      );
    }

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
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error creating event action");
    return NextResponse.json(
      { error: "Erro ao criar ação" },
      { status: 500 }
    );
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
        { error: "actionId é obrigatório" },
        { status: 400 }
      );
    }

    const [event] = await sql`
      SELECT * FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Check if user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem deletar ações" },
        { status: 403 }
      );
    }

    // Delete the action
    const result = await sql`
      DELETE FROM event_actions
      WHERE id = ${actionId} AND event_id = ${eventId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Ação não encontrada" },
        { status: 404 }
      );
    }

    logger.info(
      { eventId, actionId, userId: user.id },
      "Event action deleted"
    );

    return NextResponse.json({ message: "Ação deletada com sucesso" });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error deleting event action");
    return NextResponse.json(
      { error: "Erro ao deletar ação" },
      { status: 500 }
    );
  }
}
