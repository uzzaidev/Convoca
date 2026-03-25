import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

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

    await requireGroupAccess(groupId, user);

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
    return handleRouteError(error, {
      logMessage: "Error fetching expenses",
      fallbackMessage: "Erro ao buscar despesas",
    });
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

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar despesas",
    });

    const body = await request.json();
    const validation = createExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { category, description, amountCents, date } = validation.data;

    const [expense] = await sql`
      INSERT INTO expenses (group_id, category, description, amount_cents, date, created_by)
      VALUES (${groupId}, ${category}, ${description || null}, ${amountCents}, ${date || new Date().toISOString().split("T")[0]}, ${user.id})
      RETURNING *
    `;

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
    return handleRouteError(error, {
      logMessage: "Error creating expense",
      fallbackMessage: "Erro ao criar despesa",
    });
  }
}
