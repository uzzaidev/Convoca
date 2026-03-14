import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string; recurrenceId: string }>;

// PATCH /api/groups/:groupId/recurrences/:recurrenceId - Update recurrence
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, recurrenceId } = await params;
    const user = await requireAuth();

    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem editar recorrências" },
        { status: 403 }
      );
    }

    const [existing] = await sql`
      SELECT * FROM event_recurrences
      WHERE id = ${recurrenceId} AND group_id = ${groupId}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: "Recorrência não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      frequency,
      dayOfWeek,
      startTime,
      venueId,
      maxPlayers,
      maxGoalkeepers,
      waitlistEnabled,
      listOpensHoursBefore,
      isActive,
    } = body;

    const [updated] = await sql`
      UPDATE event_recurrences
      SET
        frequency = COALESCE(${frequency ?? null}, frequency),
        day_of_week = COALESCE(${dayOfWeek ?? null}, day_of_week),
        start_time = COALESCE(${startTime ?? null}, start_time),
        venue_id = COALESCE(${venueId ?? null}, venue_id),
        max_players = COALESCE(${maxPlayers ?? null}, max_players),
        max_goalkeepers = COALESCE(${maxGoalkeepers ?? null}, max_goalkeepers),
        waitlist_enabled = COALESCE(${waitlistEnabled ?? null}, waitlist_enabled),
        list_opens_hours_before = COALESCE(${listOpensHoursBefore ?? null}, list_opens_hours_before),
        is_active = COALESCE(${isActive ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${recurrenceId} AND group_id = ${groupId}
      RETURNING *
    `;

    logger.info({ recurrenceId, groupId }, "Recurrence updated");

    return NextResponse.json({ recurrence: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error updating recurrence");
    return NextResponse.json(
      { error: "Erro ao atualizar recorrência" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/:groupId/recurrences/:recurrenceId - Delete recurrence
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, recurrenceId } = await params;
    const user = await requireAuth();

    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem excluir recorrências" },
        { status: 403 }
      );
    }

    const [existing] = await sql`
      SELECT * FROM event_recurrences
      WHERE id = ${recurrenceId} AND group_id = ${groupId}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: "Recorrência não encontrada" },
        { status: 404 }
      );
    }

    // Deactivate instead of hard delete to preserve history  
    await sql`
      UPDATE event_recurrences
      SET is_active = false, updated_at = NOW()
      WHERE id = ${recurrenceId} AND group_id = ${groupId}
    `;

    logger.info({ recurrenceId, groupId }, "Recurrence deactivated");

    return NextResponse.json({ message: "Recorrência desativada com sucesso" });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error deleting recurrence");
    return NextResponse.json(
      { error: "Erro ao excluir recorrência" },
      { status: 500 }
    );
  }
}
