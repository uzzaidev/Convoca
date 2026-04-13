import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import {
  generateUpcomingEventsForRecurrence,
  type EventRecurrenceRecord,
} from "@/lib/recurrences";
import { createRecurrenceSchema } from "@/lib/validations";
import logger from "@/lib/logger";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string }>;

const dayNames = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

// GET /api/groups/:groupId/recurrences - List recurrences
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user);

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
    return handleRouteError(error, {
      logMessage: "Error fetching recurrences",
      fallbackMessage: "Erro ao buscar recorrencias",
    });
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

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar recorrencias",
    });

    const body = await request.json();
    const validation = createRecurrenceSchema.safeParse({ ...body, groupId });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.flatten() },
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

    const generated = await generateUpcomingEventsForRecurrence(
      recurrence as EventRecurrenceRecord
    );

    logger.info(
      {
        recurrenceId: recurrence.id,
        groupId,
        frequency,
        dayOfWeek: dayNames[dayOfWeek],
        generated,
      },
      "Recurrence created"
    );

    return NextResponse.json({ recurrence, generated }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error creating recurrence",
      fallbackMessage: "Erro ao criar recorrencia",
    });
  }
}
