import { sql } from "@/db/client";
import logger from "@/lib/logger";

const APP_TIME_ZONE = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

const localDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export type EventRecurrenceRecord = {
  id: string;
  group_id: string;
  frequency: "weekly" | "biweekly" | "monthly";
  day_of_week: number;
  start_time: string;
  venue_id: string | null;
  max_players: number;
  max_goalkeepers: number;
  waitlist_enabled: boolean;
  list_opens_hours_before: number;
  created_by: string | null;
};

export function getNextOccurrences(
  recurrence: Pick<EventRecurrenceRecord, "frequency" | "day_of_week" | "start_time">,
  fromDate: Date,
  daysAhead: number
): Date[] {
  const localNow = toNaiveLocalDate(fromDate);
  const endDate = new Date(localNow.getTime() + daysAhead * DAY_MS);
  const [hours, minutes] = parseTime(recurrence.start_time);
  const dates: Date[] = [];

  const current = new Date(localNow);
  current.setUTCHours(hours, minutes, 0, 0);

  while (current.getUTCDay() !== recurrence.day_of_week) {
    current.setUTCDate(current.getUTCDate() + 1);
  }

  if (current <= localNow) {
    advanceToNext(current, recurrence.frequency);
  }

  while (current <= endDate) {
    dates.push(new Date(current));
    advanceToNext(current, recurrence.frequency);
  }

  return dates;
}

export async function generateUpcomingEventsForRecurrence(
  recurrence: EventRecurrenceRecord,
  options?: {
    fromDate?: Date;
    daysAhead?: number;
  }
) {
  const fromDate = options?.fromDate ?? new Date();
  const daysAhead = options?.daysAhead ?? 14;
  const dates = getNextOccurrences(recurrence, fromDate, daysAhead);
  let generated = 0;

  for (const eventDate of dates) {
    const eventDateStr = formatNaiveDate(eventDate);
    const [existing] = await sql`
      SELECT id FROM events
      WHERE recurrence_id = ${recurrence.id}
        AND starts_at::date = ${eventDateStr}
        AND status != 'canceled'
    `;

    if (existing) {
      continue;
    }

    const listOpensAt = new Date(
      eventDate.getTime() - recurrence.list_opens_hours_before * 60 * 60 * 1000
    );

    const [event] = await sql`
      INSERT INTO events (
        group_id, starts_at, venue_id, max_players, max_goalkeepers,
        waitlist_enabled, recurrence_id, list_opens_at, created_by
      )
      VALUES (
        ${recurrence.group_id}, ${formatNaiveTimestamp(eventDate)}, ${recurrence.venue_id},
        ${recurrence.max_players}, ${recurrence.max_goalkeepers}, ${recurrence.waitlist_enabled},
        ${recurrence.id}, ${formatNaiveTimestamp(listOpensAt)}, ${recurrence.created_by}
      )
      RETURNING id
    `;

    logger.info(
      {
        eventId: event.id,
        recurrenceId: recurrence.id,
        startsAt: formatNaiveTimestamp(eventDate),
      },
      "Recurring event generated"
    );

    generated++;
  }

  return generated;
}

function toNaiveLocalDate(date: Date) {
  const parts = Object.fromEntries(
    localDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  ) as Record<string, string>;

  return new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    )
  );
}

function parseTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return [Number(hours), Number(minutes)] as const;
}

function formatNaiveDate(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function formatNaiveTimestamp(date: Date) {
  return `${formatNaiveDate(date)} ${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes()
  ).padStart(2, "0")}:${String(date.getUTCSeconds()).padStart(2, "0")}`;
}

function advanceToNext(date: Date, frequency: EventRecurrenceRecord["frequency"]) {
  switch (frequency) {
    case "weekly":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "biweekly":
      date.setUTCDate(date.getUTCDate() + 14);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;
  }
}
