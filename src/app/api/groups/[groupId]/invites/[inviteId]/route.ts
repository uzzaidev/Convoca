import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string; inviteId: string }>;

// DELETE /api/groups/:groupId/invites/:inviteId - Delete an invite (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, inviteId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem deletar convites",
    });

    const [invite] = await sql`
      SELECT * FROM invites
      WHERE id = ${inviteId} AND group_id = ${groupId}
    `;

    if (!invite) {
      return NextResponse.json(
        { error: "Convite nÃ£o encontrado" },
        { status: 404 }
      );
    }

    await sql`
      DELETE FROM invites
      WHERE id = ${inviteId}
    `;

    logger.info({ groupId, inviteId, userId: user.id }, "Invite deleted");

    return NextResponse.json({ message: "Convite deletado com sucesso" });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error deleting invite",
      fallbackMessage: "Erro ao deletar convite",
    });
  }
}
