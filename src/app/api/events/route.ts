import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { createEventSchema } from "@/lib/validations";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const groupId = searchParams.get("groupId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

    if (!groupId) {
      return NextResponse.json({ error: "groupId e obrigatorio" }, { status: 400 });
    }

    await requireGroupAccess(groupId, user);

    const events = status
      ? await sql`
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
        `
      : await sql`
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

    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error(error, "Error fetching events");
    return NextResponse.json({ error: "Erro ao buscar eventos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { groupId, startsAt, venueId, maxPlayers, maxGoalkeepers, waitlistEnabled, listOpensAt } =
      validation.data;

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar eventos",
    });

    const [event] = await sql`
      INSERT INTO events (
        group_id,
        starts_at,
        venue_id,
        max_players,
        max_goalkeepers,
        waitlist_enabled,
        list_opens_at,
        created_by
      )
      VALUES (
        ${groupId},
        ${startsAt},
        ${venueId || null},
        ${maxPlayers},
        ${maxGoalkeepers},
        ${waitlistEnabled},
        ${listOpensAt || null},
        ${user.id}
      )
      RETURNING *
    `;

    logger.info({ eventId: event.id, groupId, userId: user.id }, "Event created");

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error(error, "Error creating event");
    return NextResponse.json({ error: "Erro ao criar evento" }, { status: 500 });
  }
}
