import { getDb } from "@/lib/db";

export interface EventWithAttendance {
  id: number;
  groupId: number;
  startsAt: Date;
  maxPlayers: number;
  status: "scheduled" | "live" | "finished" | "canceled";
  attendees: {
    userId: number;
    role: "gk" | "line";
    status: "yes" | "no" | "waitlist";
  }[];
}

export async function getEventWithAttendees(eventId: string): Promise<EventWithAttendance | null> {
  const sql = getDb();
  
  const eventResult = await sql`
    SELECT id, group_id as "groupId", starts_at as "startsAt", max_players as "maxPlayers", status
    FROM events
    WHERE id = ${parseInt(eventId)}
  ` as Array<{
    id: number;
    groupId: number;
    startsAt: Date;
    maxPlayers: number;
    status: "scheduled" | "live" | "finished" | "canceled";
  }>;
  
  if (eventResult.length === 0) return null;
  const event = eventResult[0];

  const attendees = await sql`
    SELECT user_id as "userId", role, status
    FROM event_attendance
    WHERE event_id = ${event.id}
  ` as Array<{
    userId: number;
    role: "gk" | "line";
    status: "yes" | "no" | "waitlist";
  }>;

  return {
    id: event.id,
    groupId: event.groupId,
    startsAt: event.startsAt,
    maxPlayers: event.maxPlayers,
    status: event.status,
    attendees,
  };
}
