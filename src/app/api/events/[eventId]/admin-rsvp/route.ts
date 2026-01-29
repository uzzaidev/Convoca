import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { z } from "zod";
import logger from "@/lib/logger";

type Params = Promise<{ eventId: string }>;

const adminRsvpSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["yes", "no"]),
  preferredPosition: z.enum(["gk", "defender", "midfielder", "forward"]).optional(),
  secondaryPosition: z.enum(["gk", "defender", "midfielder", "forward"]).optional(),
});

// Helper function to promote first eligible person from waitlist
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function promoteFromWaitlist(eventId: string, event: any) {
  // Get all waitlist players ordered by arrival
  const waitlistPlayers = await sql`
    SELECT * FROM event_attendance
    WHERE event_id = ${eventId} AND status = 'waitlist'
    ORDER BY order_of_arrival ASC NULLS LAST, created_at ASC
  `;

  for (const waitlistPlayer of waitlistPlayers) {
    // Re-check current counts to ensure we have a spot
    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'gk') as gk_count,
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'line') as line_count
      FROM event_attendance
      WHERE event_id = ${eventId}
    `;

    const totalPlayers = parseInt(counts.gk_count) + parseInt(counts.line_count);
    const gkCount = parseInt(counts.gk_count);

    let canConfirm = false;
    if (waitlistPlayer.role === "gk") {
      // GK can only be promoted if GK slots AND total slots are available
      canConfirm = gkCount < event.max_goalkeepers && totalPlayers < event.max_players;
    } else {
      // Line player can be promoted if total slots are available
      canConfirm = totalPlayers < event.max_players;
    }

    if (canConfirm) {
      await sql`
        UPDATE event_attendance
        SET status = 'yes', updated_at = NOW()
        WHERE id = ${waitlistPlayer.id}
      `;
      // Only promote one player per removal
      break;
    }
  }
}

// POST /api/events/:eventId/admin-rsvp - Admin confirms/unconfirms a player
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const admin = await requireAuth();

    const body = await request.json();
    const validation = adminRsvpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, status, preferredPosition, secondaryPosition } = validation.data;

    // Get event details
    const [event] = await sql`
      SELECT * FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Check if admin is member of the group with admin role
    const [adminMembership] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${admin.id}
    `;

    if (!adminMembership || adminMembership.role !== "admin") {
      return NextResponse.json(
        { error: "Você não tem permissão para gerenciar confirmações" },
        { status: 403 }
      );
    }

    // Check if event is in a valid state for RSVP management
    if (event.status === "canceled") {
      return NextResponse.json(
        { error: "Este evento foi cancelado" },
        { status: 400 }
      );
    }

    if (event.status === "finished") {
      return NextResponse.json(
        { error: "Este evento já foi finalizado" },
        { status: 400 }
      );
    }

    // Check if user to be confirmed is member of the group
    const [userMembership] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${userId}
    `;

    if (!userMembership) {
      return NextResponse.json(
        { error: "Usuário não é membro deste grupo" },
        { status: 403 }
      );
    }

    if (status === "no") {
      // Remove attendance
      await sql`
        DELETE FROM event_attendance
        WHERE event_id = ${eventId} AND user_id = ${userId}
      `;

      // Check waitlist and promote if needed
      await promoteFromWaitlist(eventId, event);

      logger.info(
        { eventId, userId, adminId: admin.id },
        "Admin removed player attendance"
      );

      return NextResponse.json({ success: true });
    }

    // Confirming player
    if (!preferredPosition) {
      return NextResponse.json(
        { error: "Posição preferencial é obrigatória" },
        { status: 400 }
      );
    }

    if (preferredPosition === secondaryPosition && secondaryPosition !== undefined) {
      return NextResponse.json(
        { error: "Posições devem ser diferentes" },
        { status: 400 }
      );
    }

    const role = preferredPosition === "gk" ? "gk" : "line";

    // Count current confirmations (excluding the user being confirmed to avoid double-counting)
    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'gk') as gk_count,
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'line') as line_count
      FROM event_attendance
      WHERE event_id = ${eventId} AND user_id != ${userId}
    `;

    let finalStatus = "yes";

    // Check if we need to put user in waitlist or reject
    const totalPlayers = parseInt(counts.gk_count) + parseInt(counts.line_count);
    const gkCount = parseInt(counts.gk_count);

    if (role === "gk" && gkCount >= event.max_goalkeepers) {
      if (event.waitlist_enabled) {
        finalStatus = "waitlist";
      } else {
        return NextResponse.json(
          { error: `Limite de goleiros atingido (${event.max_goalkeepers}). Não é possível adicionar mais goleiros.` },
          { status: 400 }
        );
      }
    } else if (totalPlayers >= event.max_players) {
      if (event.waitlist_enabled) {
        finalStatus = "waitlist";
      } else {
        return NextResponse.json(
          { error: `Limite de jogadores atingido (${event.max_players}). Não é possível adicionar mais jogadores.` },
          { status: 400 }
        );
      }
    }

    // Upsert attendance
    const [attendance] = await sql`
      INSERT INTO event_attendance (event_id, user_id, role, status, preferred_position, secondary_position)
      VALUES (${eventId}, ${userId}, ${role}, ${finalStatus}, ${preferredPosition}, ${secondaryPosition || null})
      ON CONFLICT (event_id, user_id)
      DO UPDATE SET
        role = ${role},
        status = ${finalStatus},
        preferred_position = ${preferredPosition},
        secondary_position = ${secondaryPosition || null},
        updated_at = NOW()
      RETURNING *
    `;

    logger.info(
      { eventId, userId, adminId: admin.id, status: finalStatus },
      "Admin confirmed player attendance"
    );

    return NextResponse.json({ attendance });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error in admin RSVP");
    return NextResponse.json(
      { error: "Erro ao processar confirmação" },
      { status: 500 }
    );
  }
}
