import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { validateParams, groupIdSchema } from "@/lib/validations-params";
import { updateGroupStatusSchema } from "@/lib/validations";

type Params = Promise<{ groupId: string }>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const user = await requireSystemAdmin();
    const paramsData = await params;
    const paramsValidation = validateParams(paramsData, groupIdSchema);

    if (!paramsValidation.success) {
      return NextResponse.json({ error: paramsValidation.error }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateGroupStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { groupId } = paramsValidation.data;
    const { status, reason } = validation.data;

    if (status === "rejected" && !reason) {
      return NextResponse.json({ error: "Motivo e obrigatorio para reprovar o grupo" }, { status: 400 });
    }

    const [group] = await sql`
      SELECT id
      FROM groups
      WHERE id = ${groupId}
        AND deleted_at IS NULL
    `;

    if (!group) {
      return NextResponse.json({ error: "Grupo nao encontrado" }, { status: 404 });
    }

    const normalizedReason = status === "active" ? null : reason || null;

    const [updatedGroup] = await sql`
      UPDATE groups
      SET
        status = ${status},
        status_reason = ${normalizedReason},
        status_updated_at = NOW(),
        status_updated_by = ${user.id},
        updated_at = NOW()
      WHERE id = ${groupId}
      RETURNING id, status, status_reason, status_updated_at, status_updated_by
    `;

    logger.info({ groupId, status, updatedBy: user.id }, "Group status updated by system admin");

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "Sem permissao de administrador do sistema") {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    logger.error(error, "Error updating group status");
    return NextResponse.json({ error: "Erro ao atualizar status do grupo" }, { status: 500 });
  }
}
