import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/db/client";
import { createEventSchema } from "@/lib/validations";
import logger from "@/lib/logger";

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { groupId, startsAt, venueId, maxPlayers, maxGoalkeepers, waitlistEnabled } = validation.data;

    // Check if user is admin of the group
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${session.user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem criar eventos" },
        { status: 403 }
      );
    }

    const [event] = await sql`
      INSERT INTO events (
        group_id,
        starts_at,
        venue_id,
        max_players,
        max_goalkeepers,
        waitlist_enabled,
        created_by
      )
      VALUES (
        ${groupId},
        ${startsAt},
        ${venueId || null},
        ${maxPlayers},
        ${maxGoalkeepers},
        ${waitlistEnabled},
        ${session.user.id}
      )
      RETURNING *
    `;

    logger.info({ eventId: event.id, groupId, userId: session.user.id }, "Event created");

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    logger.error(error, "Error creating event");
    return NextResponse.json(
      { error: "Erro ao criar evento" },
      { status: 500 }
    );
  }
}
