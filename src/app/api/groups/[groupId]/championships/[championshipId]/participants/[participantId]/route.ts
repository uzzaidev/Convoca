import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";

type Params = Promise<{ groupId: string; championshipId: string; participantId: string }>;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId, participantId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem remover inscritos",
    });

    await sql`
      DELETE FROM championship_participants
      WHERE id = ${participantId}
        AND championship_id = ${championshipId}
        AND championship_id IN (
          SELECT id FROM championships WHERE group_id = ${groupId}
        )
    `;

    logger.info({ participantId, championshipId, userId: user.id }, "Participant removed");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error removing championship participant");
    return NextResponse.json({ error: "Erro ao remover inscrito" }, { status: 500 });
  }
}
