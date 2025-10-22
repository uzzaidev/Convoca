import { getDb } from "@/lib/db";

export interface Group {
  id: number;
  name: string;
  description: string | null;
}

export interface EventSummary {
  id: number;
  groupId: number;
  startsAt: Date;
  status: "scheduled" | "live" | "finished" | "canceled";
  maxPlayers: number;
}

export async function getRecentGroups(limit = 10): Promise<Group[]> {
  const sql = getDb();
  const result = await sql`
    SELECT id, name, description
    FROM groups
    ORDER BY created_at DESC
    LIMIT ${limit}
  ` as Group[];
  return result;
}

export async function getUpcomingEvents(limit = 10): Promise<EventSummary[]> {
  const sql = getDb();
  const result = await sql`
    SELECT id, group_id as "groupId", starts_at as "startsAt", status, max_players as "maxPlayers"
    FROM events
    WHERE status = 'scheduled'
    ORDER BY starts_at ASC
    LIMIT ${limit}
  ` as EventSummary[];
  return result;
}
