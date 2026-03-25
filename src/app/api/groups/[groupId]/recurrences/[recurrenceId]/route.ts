import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string; recurrenceId: string }>;

// PATCH /api/groups/:groupId/recurrences/:recurrenceId - Update recurrence
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, recurrenceId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem editar recorrÃªncias",
    });

    const [existing] = await sql`
      SELECT * FROM event_recurrences
      WHERE id = ${recurrenceId} AND group_id = ${groupId}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: "RecorrÃªncia nÃ£o encontrada" },
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
    return handleRouteError(error, {
      logMessage: "Error updating recurrence",
      fallbackMessage: "Erro ao atualizar recorrÃªncia",
    });
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

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem excluir recorrÃªncias",
    });

    const [existing] = await sql`
      SELECT * FROM event_recurrences
      WHERE id = ${recurrenceId} AND group_id = ${groupId}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: "RecorrÃªncia nÃ£o encontrada" },
        { status: 404 }
      );
    }

    await sql`
      UPDATE event_recurrences
      SET is_active = false, updated_at = NOW()
      WHERE id = ${recurrenceId} AND group_id = ${groupId}
    `;

    logger.info({ recurrenceId, groupId }, "Recurrence deactivated");

    return NextResponse.json({ message: "RecorrÃªncia desativada com sucesso" });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error deleting recurrence",
      fallbackMessage: "Erro ao excluir recorrÃªncia",
    });
  }
}
