import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { generateInviteCode } from "@/lib/utils";
import logger from "@/lib/logger";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string }>;

// GET /api/groups/:groupId/invites - List all invites for a group (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem visualizar convites",
    });

    const invites = await sql`
      SELECT
        i.id,
        i.code,
        i.expires_at,
        i.max_uses,
        i.used_count,
        i.created_at,
        u.name as created_by_name
      FROM invites i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.group_id = ${groupId}
      ORDER BY i.created_at DESC
    `;

    return NextResponse.json({ invites });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error fetching invites",
      fallbackMessage: "Erro ao buscar convites",
    });
  }
}

// POST /api/groups/:groupId/invites - Create a new invite (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar convites",
    });

    const body = await request.json();
    const { expiresAt, maxUses } = body;
    const inviteCode = generateInviteCode();

    const [invite] = await sql`
      INSERT INTO invites (group_id, code, created_by, expires_at, max_uses)
      VALUES (
        ${groupId},
        ${inviteCode},
        ${user.id},
        ${expiresAt || null},
        ${maxUses || null}
      )
      RETURNING *
    `;

    logger.info({ groupId, inviteId: invite.id, userId: user.id }, "Invite created");

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error creating invite",
      fallbackMessage: "Erro ao criar convite",
    });
  }
}
