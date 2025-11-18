import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { createEventSchema } from "@/lib/validations";
import logger from "@/lib/logger";

// GET /api/events - List events (with filters)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const groupId = searchParams.get("groupId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10;

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId é obrigatório" },
        { status: 400 }
      );
    }

    // Check if user is member of the group
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    // Build query with filters
    let events;
    
    if (status) {
      events = await sql`
        SELECT
          e.id,
          e.starts_at,
          e.status,
          e.max_players,
          v.name as venue_name
        FROM events e
        LEFT JOIN venues v ON e.venue_id = v.id
        WHERE e.group_id = ${groupId} AND e.status = ${status}
        ORDER BY e.starts_at DESC
        LIMIT ${limit}
      `;
    } else {
      events = await sql`
        SELECT
          e.id,
          e.starts_at,
          e.status,
          e.max_players,
          v.name as venue_name
        FROM events e
        LEFT JOIN venues v ON e.venue_id = v.id
        WHERE e.group_id = ${groupId}
        ORDER BY e.starts_at DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching events");
    return NextResponse.json(
      { error: "Erro ao buscar eventos" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

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
      WHERE group_id = ${groupId} AND user_id = ${user.id}
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
        ${user.id}
      )
      RETURNING *
    `;

    logger.info({ eventId: event.id, groupId, userId: user.id }, "Event created");

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error creating event");
    return NextResponse.json(
      { error: "Erro ao criar evento" },
      { status: 500 }
    );
  }
}
