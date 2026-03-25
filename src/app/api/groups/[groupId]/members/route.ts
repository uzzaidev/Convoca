import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string }>;

// POST /api/groups/:groupId/members - Add member to group (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem adicionar membros",
    });

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId Ã© obrigatÃ³rio" },
        { status: 400 }
      );
    }

    const [targetUser] = await sql`
      SELECT id, name, email FROM users WHERE id = ${userId}
    `;

    if (!targetUser) {
      return NextResponse.json(
        { error: "UsuÃ¡rio nÃ£o encontrado" },
        { status: 404 }
      );
    }

    const [existingMember] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `;

    if (existingMember) {
      return NextResponse.json(
        { error: "UsuÃ¡rio jÃ¡ Ã© membro deste grupo" },
        { status: 400 }
      );
    }

    const [newMember] = await sql`
      INSERT INTO group_members (group_id, user_id, role, base_rating)
      VALUES (${groupId}, ${userId}, 'member', 5)
      RETURNING *
    `;

    logger.info(
      { groupId, userId, addedBy: user.id },
      "Member added to group by admin"
    );

    return NextResponse.json({
      message: "Membro adicionado com sucesso",
      member: {
        ...newMember,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error adding member to group",
      fallbackMessage: "Erro ao adicionar membro",
    });
  }
}
