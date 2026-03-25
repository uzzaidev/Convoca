import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ eventId: string }>;

// GET /api/events/:eventId - Get event details
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();
    const { groupAccess } = await requireEventAccess(eventId, user);

    const [event] = await sql`
      SELECT
        e.*,
        g.name as group_name,
        v.name as venue_name,
        v.address as venue_address
      FROM events e
      INNER JOIN groups g ON e.group_id = g.id
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE e.id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento nao encontrado" }, { status: 404 });
    }

    const attendance = await sql`
      SELECT
        ea.id,
        ea.status,
        ea.role,
        ea.checked_in_at,
        ea.order_of_arrival,
        u.id as user_id,
        u.name as user_name,
        u.image as user_image
      FROM event_attendance ea
      INNER JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = ${eventId}
      ORDER BY
        CASE ea.status
          WHEN 'yes' THEN 1
          WHEN 'waitlist' THEN 2
          WHEN 'no' THEN 3
        END,
        ea.created_at ASC
    `;

    const teams = await sql`
      SELECT
        t.id,
        t.name,
        t.seed,
        t.is_winner,
        json_agg(
          json_build_object(
            'userId', u.id,
            'userName', u.name,
            'userImage', u.image,
            'position', tm.position,
            'starter', tm.starter
          ) ORDER BY tm.position DESC, tm.starter DESC
        ) as members
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE t.event_id = ${eventId}
      GROUP BY t.id, t.name, t.seed, t.is_winner
      ORDER BY t.seed ASC
    `;

    return NextResponse.json({
      event: {
        ...event,
        userRole: groupAccess.userRole,
        isSystemAdmin: groupAccess.isSystemAdmin,
        attendance,
        teams: teams.length > 0 ? teams : null,
      },
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error fetching event details",
      fallbackMessage: "Erro ao buscar detalhes do evento",
    });
  }
}

// PATCH /api/events/:eventId - Update event (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem editar eventos",
    });

    const body = await request.json();
    const { startsAt, venueId, maxPlayers, maxGoalkeepers, waitlistEnabled, status, listOpensAt } = body;

    const [updated] = await sql`
      UPDATE events
      SET
        starts_at = COALESCE(${startsAt ?? null}, starts_at),
        venue_id = COALESCE(${venueId ?? null}, venue_id),
        max_players = COALESCE(${maxPlayers ?? null}, max_players),
        max_goalkeepers = COALESCE(${maxGoalkeepers ?? null}, max_goalkeepers),
        waitlist_enabled = COALESCE(${waitlistEnabled ?? null}, waitlist_enabled),
        status = COALESCE(${status ?? null}, status),
        list_opens_at = COALESCE(${listOpensAt ?? null}, list_opens_at),
        updated_at = NOW()
      WHERE id = ${eventId}
      RETURNING *
    `;

    logger.info({ eventId, userId: user.id }, "Event updated");

    return NextResponse.json({ event: updated });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error updating event",
      fallbackMessage: "Erro ao atualizar evento",
    });
  }
}

// DELETE /api/events/:eventId - Delete/cancel event (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem deletar eventos",
    });

    await sql`
      UPDATE events
      SET status = 'canceled', updated_at = NOW()
      WHERE id = ${eventId}
    `;

    logger.info({ eventId, userId: user.id }, "Event canceled");

    return NextResponse.json({
      message: "Evento cancelado com sucesso",
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error canceling event",
      fallbackMessage: "Erro ao cancelar evento",
    });
  }
}
