import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { rsvpSchema } from "@/lib/validations";
import logger from "@/lib/logger";

type Params = Promise<{ eventId: string }>;

// POST /api/events/:eventId/rsvp - RSVP to an event
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validation = rsvpSchema.safeParse({ ...body, eventId });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { status, role, preferredPosition, secondaryPosition } = validation.data;

    // Get event details
    const [event] = await sql`
      SELECT * FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Check if user is member of the group
    const [membership] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    // Count current confirmations (excluding the current user to avoid double-counting)
    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'gk') as gk_count,
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'line') as line_count
      FROM event_attendance
      WHERE event_id = ${eventId} AND user_id != ${user.id}
    `;

    let finalStatus = status;

    // Check if we need to put user in waitlist
    if (status === "yes") {
      const totalPlayers = parseInt(counts.gk_count) + parseInt(counts.line_count);
      const gkCount = parseInt(counts.gk_count);

      if (role === "gk" && gkCount >= event.max_goalkeepers) {
        finalStatus = event.waitlist_enabled ? "waitlist" : "yes";
      } else if (totalPlayers >= event.max_players) {
        finalStatus = event.waitlist_enabled ? "waitlist" : "yes";
      }
    }

    // Get current attendance status to track self-removal
    const [currentAttendance] = await sql`
      SELECT status FROM event_attendance
      WHERE event_id = ${eventId} AND user_id = ${user.id}
    `;

    // Determine if this is a self-removal (yes → no) or re-confirmation (no → yes)
    const isSelfRemoval = currentAttendance?.status === 'yes' && status === 'no';
    const isReconfirmation = currentAttendance?.status === 'no' && status === 'yes';

    // Upsert attendance
    const [attendance] = await sql`
      INSERT INTO event_attendance (event_id, user_id, role, status, preferred_position, secondary_position, removed_by_self_at)
      VALUES (
        ${eventId},
        ${user.id},
        ${role},
        ${finalStatus},
        ${preferredPosition || null},
        ${secondaryPosition || null},
        ${isSelfRemoval ? sql`NOW()` : null}
      )
      ON CONFLICT (event_id, user_id)
      DO UPDATE SET
        role = ${role},
        status = ${finalStatus},
        preferred_position = ${preferredPosition || null},
        secondary_position = ${secondaryPosition || null},
        removed_by_self_at = CASE
          WHEN ${isSelfRemoval} THEN NOW()
          WHEN ${isReconfirmation} THEN NULL
          ELSE event_attendance.removed_by_self_at
        END,
        updated_at = NOW()
      RETURNING *
    `;

    // If user changed to "no" or "waitlist" to "yes", check waitlist
    if (status === "no" || (finalStatus === "yes" && event.waitlist_enabled)) {
      // Move first person from waitlist to confirmed
      const [firstInWaitlist] = await sql`
        SELECT * FROM event_attendance
        WHERE event_id = ${eventId} AND status = 'waitlist'
        ORDER BY created_at ASC
        LIMIT 1
      `;

      if (firstInWaitlist) {
        const [updatedCounts] = await sql`
          SELECT
            COUNT(*) FILTER (WHERE status = 'yes' AND role = 'gk') as gk_count,
            COUNT(*) FILTER (WHERE status = 'yes' AND role = 'line') as line_count
          FROM event_attendance
          WHERE event_id = ${eventId}
        `;

        const totalPlayers = parseInt(updatedCounts.gk_count) + parseInt(updatedCounts.line_count);
        const gkCount = parseInt(updatedCounts.gk_count);

        let canConfirm = false;
        if (firstInWaitlist.role === "gk" && gkCount < event.max_goalkeepers) {
          canConfirm = true;
        } else if (totalPlayers < event.max_players) {
          canConfirm = true;
        }

        if (canConfirm) {
          await sql`
            UPDATE event_attendance
            SET status = 'yes', updated_at = NOW()
            WHERE id = ${firstInWaitlist.id}
          `;
        }
      }
    }

    logger.info(
      { eventId, userId: user.id, status: finalStatus },
      "RSVP updated"
    );

    return NextResponse.json({ attendance });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error updating RSVP");
    return NextResponse.json(
      { error: "Erro ao atualizar confirmação" },
      { status: 500 }
    );
  }
}
