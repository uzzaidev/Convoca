import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { updateChargeStatusSchema } from "@/lib/validations-charges";

type Params = Promise<{ groupId: string; chargeId: string }>;

// PATCH /api/groups/:groupId/charges/:chargeId - Update charge status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, chargeId } = await params;
    const user = await requireAuth();

    // Check if current user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem atualizar cobranças" },
        { status: 403 }
      );
    }

    // Check if charge exists and belongs to the group
    const [existingCharge] = await sql`
      SELECT * FROM charges
      WHERE id = ${chargeId} AND group_id = ${groupId}
    `;

    if (!existingCharge) {
      return NextResponse.json(
        { error: "Cobrança não encontrada" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateChargeStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    // Update charge status
    const [updatedCharge] = await sql`
      UPDATE charges
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${chargeId}
      RETURNING *
    `;

    logger.info(
      { groupId, chargeId, status, updatedBy: user.id },
      "Charge status updated"
    );

    // Get user info
    const [userInfo] = await sql`
      SELECT id, name, image FROM users WHERE id = ${updatedCharge.user_id}
    `;

    return NextResponse.json({
      message: "Status atualizado com sucesso",
      charge: {
        ...updatedCharge,
        user_id: userInfo.id,
        user_name: userInfo.name,
        user_image: userInfo.image,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error updating charge status");
    return NextResponse.json(
      { error: "Erro ao atualizar cobrança" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/:groupId/charges/:chargeId - Delete charge (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, chargeId } = await params;
    const user = await requireAuth();

    // Check if current user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem excluir cobranças" },
        { status: 403 }
      );
    }

    // Check if charge exists and belongs to the group
    const [existingCharge] = await sql`
      SELECT * FROM charges
      WHERE id = ${chargeId} AND group_id = ${groupId}
    `;

    if (!existingCharge) {
      return NextResponse.json(
        { error: "Cobrança não encontrada" },
        { status: 404 }
      );
    }

    // Delete charge
    await sql`
      DELETE FROM charges WHERE id = ${chargeId}
    `;

    logger.info(
      { groupId, chargeId, deletedBy: user.id },
      "Charge deleted"
    );

    return NextResponse.json({
      message: "Cobrança excluída com sucesso",
    });
  } catch (error) {
    logger.error({ error }, "Error deleting charge");
    return NextResponse.json(
      { error: "Erro ao excluir cobrança" },
      { status: 500 }
    );
  }
}
