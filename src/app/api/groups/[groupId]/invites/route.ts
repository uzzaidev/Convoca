import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { generateInviteCode } from "@/lib/utils";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string }>;

// GET /api/groups/:groupId/invites - List all invites for a group (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Check if user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem visualizar convites" },
        { status: 403 }
      );
    }

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
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching invites");
    return NextResponse.json(
      { error: "Erro ao buscar convites" },
      { status: 500 }
    );
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

    // Check if user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem criar convites" },
        { status: 403 }
      );
    }

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
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error creating invite");
    return NextResponse.json(
      { error: "Erro ao criar convite" },
      { status: 500 }
    );
  }
}
