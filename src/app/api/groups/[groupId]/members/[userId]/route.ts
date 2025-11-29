import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { validateParams, groupUserIdSchema } from "@/lib/validations-params";

type Params = Promise<{ groupId: string; userId: string }>;

// PATCH /api/groups/:groupId/members/:userId - Update member role (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Validate UUIDs
    const paramsData = await params;
    const validation = validateParams(paramsData, groupUserIdSchema);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { groupId, userId } = validation.data;
    const user = await requireAuth();

    // Check if current user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem alterar roles de membros" },
        { status: 403 }
      );
    }

    // Check if target user is a member
    const [targetMember] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `;

    if (!targetMember) {
      return NextResponse.json(
        { error: "Usuário não é membro deste grupo" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválido. Use 'admin' ou 'member'" },
        { status: 400 }
      );
    }

    // If trying to demote an admin to member, check if they're the last admin
    if (targetMember.role === 'admin' && role === 'member') {
      const [adminCount] = await sql`
        SELECT COUNT(*) as count
        FROM group_members
        WHERE group_id = ${groupId} AND role = 'admin'
      `;

      if (parseInt(adminCount.count) <= 1) {
        return NextResponse.json(
          { error: 'Não é possível rebaixar o último admin do grupo. Promova outro membro primeiro.' },
          { status: 400 }
        );
      }
    }

    // Update member role
    const [updated] = await sql`
      UPDATE group_members
      SET role = ${role}
      WHERE group_id = ${groupId} AND user_id = ${userId}
      RETURNING *
    `;

    logger.info(
      { groupId, userId, newRole: role, updatedBy: user.id },
      "Member role updated"
    );

    return NextResponse.json({
      message: "Role do membro atualizado com sucesso",
      member: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error updating member role");
    return NextResponse.json(
      { error: "Erro ao atualizar role do membro" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/:groupId/members/:userId - Remove member from group (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Validate UUIDs
    const paramsData = await params;
    const validation = validateParams(paramsData, groupUserIdSchema);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { groupId, userId } = validation.data;
    const user = await requireAuth();

    // Check if current user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem remover membros" },
        { status: 403 }
      );
    }

    // Prevent admin from removing themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Você não pode remover a si mesmo do grupo" },
        { status: 400 }
      );
    }

    // Check if target user is a member
    const [targetMember] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `;

    if (!targetMember) {
      return NextResponse.json(
        { error: "Usuário não é membro deste grupo" },
        { status: 404 }
      );
    }

    // Remove member
    await sql`
      DELETE FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `;

    logger.info(
      { groupId, userId, removedBy: user.id },
      "Member removed from group"
    );

    return NextResponse.json({
      message: "Membro removido do grupo com sucesso",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error removing member");
    return NextResponse.json(
      { error: "Erro ao remover membro" },
      { status: 500 }
    );
  }
}
