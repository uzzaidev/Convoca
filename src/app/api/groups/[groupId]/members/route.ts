import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string }>;

// POST /api/groups/:groupId/members - Add member to group (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Check if current user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem adicionar membros" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Check if user exists
    const [targetUser] = await sql`
      SELECT id, name, email FROM users WHERE id = ${userId}
    `;

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const [existingMember] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `;

    if (existingMember) {
      return NextResponse.json(
        { error: "Usuário já é membro deste grupo" },
        { status: 400 }
      );
    }

    // Add user to group with default role 'member' and base_rating 5 (scale 0-10)
    const [newMember] = await sql`
      INSERT INTO group_members (group_id, user_id, role, base_rating)
      VALUES (${groupId}, ${userId}, 'member', 5)
      RETURNING *
    `;

    logger.info(
      { groupId, userId, addedBy: user.id },
      "Member added to group by admin"
    );

    // Return member with user info
    return NextResponse.json({
      message: "Membro adicionado com sucesso",
      member: {
        ...newMember,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error adding member to group");
    return NextResponse.json(
      { error: "Erro ao adicionar membro" },
      { status: 500 }
    );
  }
}
