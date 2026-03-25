import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { createGroupSchema } from "@/lib/validations";
import logger from "@/lib/logger";
import { generateInviteCode } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireAuth();

    const groups = await sql`
      SELECT
        g.id,
        g.name,
        g.description,
        g.privacy,
        g.photo_url,
        g.status,
        g.status_reason,
        g.created_at,
        gm.role AS user_role
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ${user.id}
        AND g.deleted_at IS NULL
      ORDER BY g.created_at DESC
    `;

    return NextResponse.json({ groups });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    logger.error(error, "Error fetching groups");
    return NextResponse.json({ error: "Erro ao buscar grupos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validation = createGroupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, privacy } = validation.data;

    const [group] = await sql`
      INSERT INTO groups (
        name,
        description,
        privacy,
        created_by,
        status,
        status_updated_at,
        status_updated_by
      )
      VALUES (
        ${name},
        ${description || null},
        ${privacy},
        ${user.id},
        'pending',
        NOW(),
        ${user.id}
      )
      RETURNING *
    `;

    await sql`
      INSERT INTO group_members (user_id, group_id, role)
      VALUES (${user.id}, ${group.id}, 'admin')
    `;

    await sql`
      INSERT INTO wallets (owner_type, owner_id, balance_cents)
      VALUES ('group', ${group.id}, 0)
    `;

    const inviteCode = generateInviteCode();
    await sql`
      INSERT INTO invites (group_id, code, created_by)
      VALUES (${group.id}, ${inviteCode}, ${user.id})
    `;

    logger.info({ groupId: group.id, userId: user.id }, "Group created");

    return NextResponse.json(
      {
        group: { ...group, inviteCode },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    logger.error(error, "Error creating group");
    return NextResponse.json({ error: "Erro ao criar grupo" }, { status: 500 });
  }
}
