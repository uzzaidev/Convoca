import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string; expenseId: string }>;

// DELETE /api/groups/:groupId/expenses/:expenseId - Delete expense (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, expenseId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem excluir despesas",
    });

    const [expense] = await sql`
      DELETE FROM expenses
      WHERE id = ${expenseId} AND group_id = ${groupId}
      RETURNING *
    `;

    if (!expense) {
      return NextResponse.json(
        { error: "Despesa nÃ£o encontrada" },
        { status: 404 }
      );
    }

    await sql`
      UPDATE wallets
      SET balance_cents = balance_cents + ${expense.amount_cents}, updated_at = NOW()
      WHERE owner_type = 'group' AND owner_id = ${groupId}
    `;

    logger.info(
      { groupId, expenseId, deletedBy: user.id },
      "Expense deleted"
    );

    return NextResponse.json({ message: "Despesa excluÃ­da com sucesso" });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error deleting expense",
      fallbackMessage: "Erro ao excluir despesa",
    });
  }
}
