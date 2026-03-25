import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { validateParams, groupUserIdSchema } from "@/lib/validations-params";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string; userId: string }>;

// PATCH /api/groups/:groupId/members/:userId - Update member role (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
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

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem alterar roles de membros",
    });

    const [targetMember] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `;

    if (!targetMember) {
      return NextResponse.json(
        { error: "UsuÃ¡rio nÃ£o Ã© membro deste grupo" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role, is_mensalista, monthly_amount_cents } = body;

    if (role === undefined && is_mensalista === undefined && monthly_amount_cents === undefined) {
      return NextResponse.json(
        { error: "Nenhum campo para atualizar" },
        { status: 400 }
      );
    }

    if (role !== undefined && !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Role invÃ¡lido. Use 'admin' ou 'member'" },
        { status: 400 }
      );
    }

    if (monthly_amount_cents !== undefined && (typeof monthly_amount_cents !== "number" || monthly_amount_cents < 0)) {
      return NextResponse.json(
        { error: "Valor da mensalidade invÃ¡lido" },
        { status: 400 }
      );
    }

    if (role && targetMember.role === "admin" && role === "member") {
      const [adminCount] = await sql`
        SELECT COUNT(*) as count
        FROM group_members
        WHERE group_id = ${groupId} AND role = 'admin'
      `;

      if (parseInt(adminCount.count) <= 1) {
        return NextResponse.json(
          { error: "NÃ£o Ã© possÃ­vel rebaixar o Ãºltimo admin do grupo. Promova outro membro primeiro." },
          { status: 400 }
        );
      }
    }

    const effectiveRole = role ?? targetMember.role;
    const effectiveIsMensalista = is_mensalista ?? targetMember.is_mensalista;
    const effectiveMonthlyAmount = monthly_amount_cents ?? targetMember.monthly_amount_cents;

    const [updated] = await sql`
      UPDATE group_members
      SET role = ${effectiveRole},
          is_mensalista = ${effectiveIsMensalista},
          monthly_amount_cents = ${effectiveMonthlyAmount}
      WHERE group_id = ${groupId} AND user_id = ${userId}
      RETURNING *
    `;

    logger.info(
      { groupId, userId, role: effectiveRole, is_mensalista: effectiveIsMensalista, updatedBy: user.id },
      "Member updated"
    );

    return NextResponse.json({
      message: "Membro atualizado com sucesso",
      member: updated,
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error updating member",
      fallbackMessage: "Erro ao atualizar membro",
    });
  }
}

// DELETE /api/groups/:groupId/members/:userId - Remove member from group (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
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

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem remover membros",
    });

    if (userId === user.id) {
      return NextResponse.json(
        { error: "VocÃª nÃ£o pode remover a si mesmo do grupo" },
        { status: 400 }
      );
    }

    const [targetMember] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `;

    if (!targetMember) {
      return NextResponse.json(
        { error: "UsuÃ¡rio nÃ£o Ã© membro deste grupo" },
        { status: 404 }
      );
    }

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
    return handleRouteError(error, {
      logMessage: "Error removing member",
      fallbackMessage: "Erro ao remover membro",
    });
  }
}
