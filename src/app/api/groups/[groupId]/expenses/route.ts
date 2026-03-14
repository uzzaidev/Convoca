import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";

type Params = Promise<{ groupId: string }>;

const createExpenseSchema = z.object({
  category: z.enum(["venue_rental", "equipment", "referee", "other"]),
  description: z.string().max(500).optional(),
  amountCents: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// GET /api/groups/:groupId/expenses - List expenses
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    const expenses = await sql`
      SELECT
        e.id,
        e.category,
        e.description,
        e.amount_cents,
        e.date,
        e.created_at,
        u.name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.group_id = ${groupId}
      ORDER BY e.date DESC, e.created_at DESC
    `;

    return NextResponse.json({ expenses });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching expenses");
    return NextResponse.json(
      { error: "Erro ao buscar despesas" },
      { status: 500 }
    );
  }
}

// POST /api/groups/:groupId/expenses - Create expense (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem criar despesas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { category, description, amountCents, date } = validation.data;

    const [expense] = await sql`
      INSERT INTO expenses (group_id, category, description, amount_cents, date, created_by)
      VALUES (${groupId}, ${category}, ${description || null}, ${amountCents}, ${date || new Date().toISOString().split("T")[0]}, ${user.id})
      RETURNING *
    `;

    // Debit group wallet
    await sql`
      UPDATE wallets
      SET balance_cents = balance_cents - ${amountCents}, updated_at = NOW()
      WHERE owner_type = 'group' AND owner_id = ${groupId}
    `;

    logger.info(
      { groupId, expenseId: expense.id, category, amountCents, createdBy: user.id },
      "Expense created"
    );

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error creating expense");
    return NextResponse.json(
      { error: "Erro ao criar despesa" },
      { status: 500 }
    );
  }
}
