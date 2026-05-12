import { sql } from "@/db/client";
import {
  type GroupRole,
  type GroupStatus,
  type SystemRole,
  getGroupBlockedMessage,
} from "@/lib/group-status";

type UserLike = {
  id: string;
  systemRole: SystemRole;
};

type GroupAccessRow = {
  id: string;
  name: string;
  description: string | null;
  privacy: string;
  app_mode: "ranking" | "control";
  photo_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  status: GroupStatus;
  status_reason: string | null;
  status_updated_at: string;
  status_updated_by: string | null;
  user_role: GroupRole | null;
};

export type GroupAccessContext = {
  id: string;
  name: string;
  description: string | null;
  privacy: string;
  appMode: "ranking" | "control";
  photoUrl: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  status: GroupStatus;
  statusReason: string | null;
  statusUpdatedAt: string;
  statusUpdatedBy: string | null;
  userRole: GroupRole | null;
  isSystemAdmin: boolean;
};

export class GroupAccessError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "GroupAccessError";
    this.statusCode = statusCode;
  }
}

type GroupAccessOptions = {
  requireMember?: boolean;
  minRole?: GroupRole;
  requireActiveGroup?: boolean;
  allowSystemAdmin?: boolean;
  memberErrorMessage?: string;
  adminErrorMessage?: string;
};

function roleSatisfies(userRole: GroupRole | null, minRole: GroupRole) {
  if (!userRole) {
    return false;
  }

  if (minRole === "member") {
    return true;
  }

  return userRole === "admin";
}

export async function getGroupAccessContext(
  groupId: string,
  user: UserLike
): Promise<GroupAccessContext | null> {
  const [row] = await sql`
    SELECT
      g.id,
      g.name,
      g.description,
      g.privacy,
      g.app_mode,
      g.photo_url,
      g.created_by,
      g.created_at,
      g.updated_at,
      g.status,
      g.status_reason,
      g.status_updated_at,
      g.status_updated_by,
      gm.role AS user_role
    FROM groups g
    LEFT JOIN group_members gm
      ON g.id = gm.group_id
      AND gm.user_id = ${user.id}
    WHERE g.id = ${groupId}
      AND g.deleted_at IS NULL
  `;

  if (!row) {
    return null;
  }

  const group = row as GroupAccessRow;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    privacy: group.privacy,
    appMode: group.app_mode || "ranking",
    photoUrl: group.photo_url,
    createdBy: group.created_by,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
    status: group.status,
    statusReason: group.status_reason,
    statusUpdatedAt: group.status_updated_at,
    statusUpdatedBy: group.status_updated_by,
    userRole: group.user_role,
    isSystemAdmin: user.systemRole === "system_admin",
  };
}

export function ensureGroupAccess(
  context: GroupAccessContext | null,
  options: GroupAccessOptions = {}
) {
  const {
    requireMember = true,
    minRole = "member",
    requireActiveGroup = true,
    allowSystemAdmin = true,
    memberErrorMessage = "Voce nao e membro deste grupo",
    adminErrorMessage = "Apenas admins podem executar esta acao",
  } = options;

  if (!context) {
    throw new GroupAccessError("Grupo nao encontrado", 404);
  }

  if (allowSystemAdmin && context.isSystemAdmin) {
    return context;
  }

  if (requireMember && !context.userRole) {
    throw new GroupAccessError(memberErrorMessage, 403);
  }

  if (requireActiveGroup && context.status !== "active") {
    throw new GroupAccessError(
      getGroupBlockedMessage(context.status, context.statusReason) ||
        "Este grupo nao esta disponivel no momento.",
      403
    );
  }

  if (!roleSatisfies(context.userRole, minRole)) {
    throw new GroupAccessError(adminErrorMessage, 403);
  }

  return context;
}

export async function requireGroupAccess(
  groupId: string,
  user: UserLike,
  options: GroupAccessOptions = {}
) {
  const context = await getGroupAccessContext(groupId, user);
  return ensureGroupAccess(context, options);
}
