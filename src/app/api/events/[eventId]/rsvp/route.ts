import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = rsvpSchema.safeParse({ ...body, eventId });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { status, role } = validation.data;

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
      WHERE group_id = ${event.group_id} AND user_id = ${session.user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    // Count current confirmations
    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'gk') as gk_count,
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'line') as line_count
      FROM event_attendance
      WHERE event_id = ${eventId}
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

    // Upsert attendance
    const [attendance] = await sql`
      INSERT INTO event_attendance (event_id, user_id, role, status)
      VALUES (${eventId}, ${session.user.id}, ${role}, ${finalStatus})
      ON CONFLICT (event_id, user_id)
      DO UPDATE SET
        role = ${role},
        status = ${finalStatus},
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
      { eventId, userId: session.user.id, status: finalStatus },
      "RSVP updated"
    );

    return NextResponse.json({ attendance });
  } catch (error) {
    logger.error(error, "Error updating RSVP");
    return NextResponse.json(
      { error: "Erro ao atualizar confirmação" },
      { status: 500 }
    );
  }
}
