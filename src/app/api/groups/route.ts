import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/db/client";
import { createGroupSchema } from "@/lib/validations";
import logger from "@/lib/logger";
import { generateInviteCode } from "@/lib/utils";

// GET /api/groups - List all groups for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const groups = await sql`
      SELECT
        g.id,
        g.name,
        g.description,
        g.privacy,
        g.photo_url,
        g.created_at,
        gm.role AS user_role
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ${session.user.id}
      ORDER BY g.created_at DESC
    `;

    return NextResponse.json({ groups });
  } catch (error) {
    logger.error(error, "Error fetching groups");
    return NextResponse.json(
      { error: "Erro ao buscar grupos" },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createGroupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, privacy } = validation.data;

    // Create group
    const [group] = await sql`
      INSERT INTO groups (name, description, privacy, created_by)
      VALUES (${name}, ${description || null}, ${privacy}, ${session.user.id})
      RETURNING *
    `;

    // Add creator as admin
    await sql`
      INSERT INTO group_members (user_id, group_id, role)
      VALUES (${session.user.id}, ${group.id}, 'admin')
    `;

    // Create group wallet
    await sql`
      INSERT INTO wallets (owner_type, owner_id, balance_cents)
      VALUES ('group', ${group.id}, 0)
    `;

    // Create default invite code
    const inviteCode = generateInviteCode();
    await sql`
      INSERT INTO invites (group_id, code, created_by)
      VALUES (${group.id}, ${inviteCode}, ${session.user.id})
    `;

    logger.info({ groupId: group.id, userId: session.user.id }, "Group created");

    return NextResponse.json({
      group: { ...group, inviteCode },
    }, { status: 201 });
  } catch (error) {
    logger.error(error, "Error creating group");
    return NextResponse.json(
      { error: "Erro ao criar grupo" },
      { status: 500 }
    );
  }
}
