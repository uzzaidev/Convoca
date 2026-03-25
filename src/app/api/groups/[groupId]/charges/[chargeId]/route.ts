import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { updateChargeStatusSchema } from "@/lib/validations-charges";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string; chargeId: string }>;

// PATCH /api/groups/:groupId/charges/:chargeId - Update charge status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, chargeId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem atualizar cobranÃ§as",
    });

    const [existingCharge] = await sql`
      SELECT * FROM charges
      WHERE id = ${chargeId} AND group_id = ${groupId}
    `;

    if (!existingCharge) {
      return NextResponse.json(
        { error: "CobranÃ§a nÃ£o encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateChargeStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status } = validation.data;

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
    return handleRouteError(error, {
      logMessage: "Error updating charge status",
      fallbackMessage: "Erro ao atualizar cobranÃ§a",
    });
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

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem excluir cobranÃ§as",
    });

    const [existingCharge] = await sql`
      SELECT * FROM charges
      WHERE id = ${chargeId} AND group_id = ${groupId}
    `;

    if (!existingCharge) {
      return NextResponse.json(
        { error: "CobranÃ§a nÃ£o encontrada" },
        { status: 404 }
      );
    }

    await sql`
      DELETE FROM charges WHERE id = ${chargeId}
    `;

    logger.info(
      { groupId, chargeId, deletedBy: user.id },
      "Charge deleted"
    );

    return NextResponse.json({
      message: "CobranÃ§a excluÃ­da com sucesso",
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error deleting charge",
      fallbackMessage: "Erro ao excluir cobranÃ§a",
    });
  }
}
