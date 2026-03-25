import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { z } from "zod";
import logger from "@/lib/logger";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ eventId: string }>;

const adminRsvpSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["yes", "no"]),
  preferredPosition: z.enum(["gk", "defender", "midfielder", "forward"]).optional(),
  secondaryPosition: z.enum(["gk", "defender", "midfielder", "forward"]).optional(),
});

async function promoteFromWaitlist(eventId: string, event: { max_goalkeepers: number; max_players: number }) {
  const waitlistPlayers = await sql`
    SELECT * FROM event_attendance
    WHERE event_id = ${eventId} AND status = 'waitlist'
    ORDER BY order_of_arrival ASC NULLS LAST, created_at ASC
  `;

  for (const waitlistPlayer of waitlistPlayers) {
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
        { error: "Dados invÃ¡lidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, status, preferredPosition, secondaryPosition } = validation.data;

    const { event } = await requireEventAccess(eventId, admin, {
      minRole: "admin",
      adminErrorMessage: "VocÃª nÃ£o tem permissÃ£o para gerenciar confirmaÃ§Ãµes",
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

    const [userMembership] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${userId}
    `;

    if (!userMembership) {
      return NextResponse.json(
        { error: "UsuÃ¡rio nÃ£o Ã© membro deste grupo" },
        { status: 403 }
      );
    }

    if (status === "no") {
      await sql`
        DELETE FROM event_attendance
        WHERE event_id = ${eventId} AND user_id = ${userId}
      `;

      await promoteFromWaitlist(eventId, event);

      logger.info(
        { eventId, userId, adminId: admin.id },
        "Admin removed player attendance"
      );

      return NextResponse.json({ success: true });
    }

    if (!preferredPosition) {
      return NextResponse.json(
        { error: "PosiÃ§Ã£o preferencial Ã© obrigatÃ³ria" },
        { status: 400 }
      );
    }

    if (preferredPosition === secondaryPosition && secondaryPosition !== undefined) {
      return NextResponse.json(
        { error: "PosiÃ§Ãµes devem ser diferentes" },
        { status: 400 }
      );
    }

    const role = preferredPosition === "gk" ? "gk" : "line";

    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'gk') as gk_count,
        COUNT(*) FILTER (WHERE status = 'yes' AND role = 'line') as line_count
      FROM event_attendance
      WHERE event_id = ${eventId} AND user_id != ${userId}
    `;

    let finalStatus = "yes";

    const totalPlayers = parseInt(counts.gk_count) + parseInt(counts.line_count);
    const gkCount = parseInt(counts.gk_count);

    if (role === "gk" && gkCount >= event.max_goalkeepers) {
      if (event.waitlist_enabled) {
        finalStatus = "waitlist";
      } else {
        return NextResponse.json(
          { error: `Limite de goleiros atingido (${event.max_goalkeepers}). NÃ£o Ã© possÃ­vel adicionar mais goleiros.` },
          { status: 400 }
        );
      }
    } else if (totalPlayers >= event.max_players) {
      if (event.waitlist_enabled) {
        finalStatus = "waitlist";
      } else {
        return NextResponse.json(
          { error: `Limite de jogadores atingido (${event.max_players}). NÃ£o Ã© possÃ­vel adicionar mais jogadores.` },
          { status: 400 }
        );
      }
    }

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
    return handleRouteError(error, {
      logMessage: "Error in admin RSVP",
      fallbackMessage: "Erro ao processar confirmaÃ§Ã£o",
    });
  }
}
