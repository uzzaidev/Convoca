import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { createRecurrenceSchema } from "@/lib/validations";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string }>;

const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// GET /api/groups/:groupId/recurrences - List recurrences
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

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

    const recurrences = await sql`
      SELECT
        er.*,
        v.name as venue_name
      FROM event_recurrences er
      LEFT JOIN venues v ON er.venue_id = v.id
      WHERE er.group_id = ${groupId}
      ORDER BY er.day_of_week ASC, er.start_time ASC
    `;

    return NextResponse.json({ recurrences });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching recurrences");
    return NextResponse.json(
      { error: "Erro ao buscar recorrências" },
      { status: 500 }
    );
  }
}

// POST /api/groups/:groupId/recurrences - Create a recurrence
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem criar recorrências" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createRecurrenceSchema.safeParse({ ...body, groupId });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      frequency,
      dayOfWeek,
      startTime,
      venueId,
      maxPlayers,
      maxGoalkeepers,
      waitlistEnabled,
      listOpensHoursBefore,
    } = validation.data;

    const [recurrence] = await sql`
      INSERT INTO event_recurrences (
        group_id, frequency, day_of_week, start_time,
        venue_id, max_players, max_goalkeepers,
        waitlist_enabled, list_opens_hours_before, created_by
      )
      VALUES (
        ${groupId}, ${frequency}, ${dayOfWeek}, ${startTime},
        ${venueId || null}, ${maxPlayers}, ${maxGoalkeepers},
        ${waitlistEnabled}, ${listOpensHoursBefore}, ${user.id}
      )
      RETURNING *
    `;

    logger.info(
      { recurrenceId: recurrence.id, groupId, frequency, dayOfWeek: dayNames[dayOfWeek] },
      "Recurrence created"
    );

    return NextResponse.json({ recurrence }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error creating recurrence");
    return NextResponse.json(
      { error: "Erro ao criar recorrência" },
      { status: 500 }
    );
  }
}
