import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { rsvpSchema } from "@/lib/validations";
import logger from "@/lib/logger";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

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
        { error: "Dados invÃ¡lidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { status, role, preferredPosition, secondaryPosition } = validation.data;

    if (preferredPosition && secondaryPosition && preferredPosition === secondaryPosition) {
      return NextResponse.json(
        { error: "As posiÃ§Ãµes preferida e secundÃ¡ria devem ser diferentes" },
        { status: 400 }
      );
    }

    const { event } = await requireEventAccess(eventId, user, {
      allowSystemAdmin: false,
    });

    if (event.status === "canceled") {
      return NextResponse.json(
        { error: "Este evento foi cancelado" },
        { status: 400 }
      );
    }

    if (event.status === "finished") {
      return NextResponse.json(
        { error: "Este evento jÃ¡ foi finalizado" },
        { status: 400 }
      );
    }

    if (event.list_opens_at && status === "yes") {
      const listOpensAt = new Date(event.list_opens_at);
      if (new Date() < listOpensAt) {
        const formatted = listOpensAt.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        return NextResponse.json(
          { error: `A lista abre em ${formatted}` },
          { status: 400 }
        );
      }
    }

    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'gk') as gk_count,
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'line') as line_count
      FROM event_attendance
      WHERE event_id = ${eventId} AND user_id != ${user.id}
    `;

    let finalStatus = status;

    if (status === "yes") {
      const totalPlayers = parseInt(counts.gk_count) + parseInt(counts.line_count);
      const gkCount = parseInt(counts.gk_count);

      if (role === "gk" && gkCount >= event.max_goalkeepers) {
        finalStatus = event.waitlist_enabled ? "waitlist" : "yes";
      } else if (totalPlayers >= event.max_players) {
        finalStatus = event.waitlist_enabled ? "waitlist" : "yes";
      }
    }

    const [currentAttendance] = await sql`
      SELECT status FROM event_attendance
      WHERE event_id = ${eventId} AND user_id = ${user.id}
    `;

    const isSelfRemoval = currentAttendance?.status === "yes" && status === "no";
    const isReconfirmation = currentAttendance?.status === "no" && status === "yes";

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

    if (isSelfRemoval && event.waitlist_enabled) {
      const waitlistPlayers = await sql`
        SELECT * FROM event_attendance
        WHERE event_id = ${eventId} AND status = 'waitlist'
        ORDER BY order_of_arrival ASC NULLS LAST, created_at ASC
      `;

      for (const waitlistPlayer of waitlistPlayers) {
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
        if (waitlistPlayer.role === "gk") {
          canConfirm = gkCount < event.max_goalkeepers && totalPlayers < event.max_players;
        } else {
          canConfirm = totalPlayers < event.max_players;
        }

        if (canConfirm) {
          await sql`
            UPDATE event_attendance
            SET status = 'yes', updated_at = NOW()
            WHERE id = ${waitlistPlayer.id}
          `;
          break;
        }
      }
    }

    logger.info(
      { eventId, userId: user.id, status: finalStatus },
      "RSVP updated"
    );

    return NextResponse.json({ attendance });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error updating RSVP",
      fallbackMessage: "Erro ao atualizar confirmaÃ§Ã£o",
    });
  }
}
