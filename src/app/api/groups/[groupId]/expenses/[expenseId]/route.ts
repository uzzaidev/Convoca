import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string; expenseId: string }>;

// DELETE /api/groups/:groupId/expenses/:expenseId - Delete expense (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, expenseId } = await params;
    const user = await requireAuth();

    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem excluir despesas" },
        { status: 403 }
      );
    }

    const [expense] = await sql`
      DELETE FROM expenses
      WHERE id = ${expenseId} AND group_id = ${groupId}
      RETURNING *
    `;

    if (!expense) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    // Credit group wallet back
    await sql`
      UPDATE wallets
      SET balance_cents = balance_cents + ${expense.amount_cents}, updated_at = NOW()
      WHERE owner_type = 'group' AND owner_id = ${groupId}
    `;

    logger.info(
      { groupId, expenseId, deletedBy: user.id },
      "Expense deleted"
    );

    return NextResponse.json({ message: "Despesa excluída com sucesso" });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error deleting expense");
    return NextResponse.json(
      { error: "Erro ao excluir despesa" },
      { status: 500 }
    );
  }
}
