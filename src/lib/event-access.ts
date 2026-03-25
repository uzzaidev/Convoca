import { sql } from "@/db/client";
import {
  GroupAccessError,
  requireGroupAccess,
  type GroupAccessContext,
} from "@/lib/group-access";
import type { GroupRole, SystemRole } from "@/lib/group-status";

type UserLike = {
  id: string;
  systemRole: SystemRole;
};

type EventAccessOptions = {
  requireMember?: boolean;
  minRole?: GroupRole;
  requireActiveGroup?: boolean;
  allowSystemAdmin?: boolean;
  memberErrorMessage?: string;
  adminErrorMessage?: string;
};

type EventAccessRow = {
  id: string;
  group_id: string;
  status: string;
  starts_at: string;
  venue_id: string | null;
  max_players: number;
  max_goalkeepers: number;
  waitlist_enabled: boolean;
  list_opens_at: string | null;
  created_by: string | null;
  updated_at: string;
};

export type EventAccessContext = {
  event: EventAccessRow;
  groupAccess: GroupAccessContext;
};

export async function requireEventAccess(
  eventId: string,
  user: UserLike,
  options: EventAccessOptions = {}
): Promise<EventAccessContext> {
  const [event] = await sql`
    SELECT *
    FROM events
    WHERE id = ${eventId}
  `;

  if (!event) {
    throw new GroupAccessError("Evento nao encontrado", 404);
  }

  const groupAccess = await requireGroupAccess(event.group_id, user, options);

  return {
    event: event as EventAccessRow,
    groupAccess,
  };
}
