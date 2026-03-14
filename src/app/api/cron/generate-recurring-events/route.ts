import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

// POST /api/cron/generate-recurring-events
// Called by Vercel Cron daily to generate upcoming events from recurrences
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Get all active recurrences
    const recurrences = await sql`
      SELECT * FROM event_recurrences WHERE is_active = true
    `;

    if (recurrences.length === 0) {
      return NextResponse.json({ message: "Nenhuma recorrência ativa", generated: 0 });
    }

    let generated = 0;
    const now = new Date();

    for (const rec of recurrences) {
      const recTyped = rec as {
        id: string;
        group_id: string;
        frequency: string;
        day_of_week: number;
        start_time: string;
        venue_id: string | null;
        max_players: number;
        max_goalkeepers: number;
        waitlist_enabled: boolean;
        list_opens_hours_before: number;
        created_by: string | null;
      };
      // Calculate next occurrence dates (generate up to 2 weeks ahead)
      const dates = getNextOccurrences(recTyped, now, 14);

      for (const eventDate of dates) {
        // Check if event already exists for this recurrence on this date
        const dateStr = eventDate.toISOString().split("T")[0];
        const [existing] = await sql`
          SELECT id FROM events
          WHERE recurrence_id = ${recTyped.id}
            AND starts_at::date = ${dateStr}
            AND status != 'canceled'
        `;

        if (existing) continue;

        // Calculate list_opens_at
        const listOpensAt = new Date(eventDate.getTime() - recTyped.list_opens_hours_before * 60 * 60 * 1000);

        const [event] = await sql`
          INSERT INTO events (
            group_id, starts_at, venue_id, max_players, max_goalkeepers,
            waitlist_enabled, recurrence_id, list_opens_at, created_by
          )
          VALUES (
            ${recTyped.group_id}, ${eventDate.toISOString()}, ${recTyped.venue_id},
            ${recTyped.max_players}, ${recTyped.max_goalkeepers}, ${recTyped.waitlist_enabled},
            ${recTyped.id}, ${listOpensAt.toISOString()}, ${recTyped.created_by}
          )
          RETURNING id
        `;

        logger.info(
          { eventId: event.id, recurrenceId: recTyped.id, startsAt: eventDate.toISOString() },
          "Recurring event generated"
        );

        generated++;
      }
    }

    logger.info({ generated, recurrences: recurrences.length }, "Recurring events generation complete");

    return NextResponse.json({
      message: `Eventos recorrentes gerados`,
      generated,
      recurrences: recurrences.length,
    });
  } catch (error) {
    logger.error(error, "Error generating recurring events");
    return NextResponse.json(
      { error: "Erro ao gerar eventos recorrentes" },
      { status: 500 }
    );
  }
}

function getNextOccurrences(
  recurrence: { frequency: string; day_of_week: number; start_time: string },
  fromDate: Date,
  daysAhead: number
): Date[] {
  const dates: Date[] = [];
  const endDate = new Date(fromDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const [hours, minutes] = recurrence.start_time.split(":").map(Number);

  // Start from today
  const current = new Date(fromDate);
  current.setHours(hours, minutes, 0, 0);

  // Find the first matching day of week
  while (current.getDay() !== recurrence.day_of_week) {
    current.setDate(current.getDate() + 1);
  }

  // If the first found date is in the past today, skip to next occurrence
  if (current <= fromDate) {
    advanceToNext(current, recurrence.frequency);
  }

  while (current <= endDate) {
    dates.push(new Date(current));
    advanceToNext(current, recurrence.frequency);
  }

  return dates;
}

function advanceToNext(date: Date, frequency: string) {
  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
  }
}
