import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

// POST /api/cron/generate-monthly-charges
// Called by Vercel Cron on the 1st of each month
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 15)
      .toISOString()
      .split("T")[0]; // Due on the 15th of current month

    const monthLabel = now.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    // Find all mensalistas with a monthly amount
    const mensalistas = await sql`
      SELECT gm.user_id, gm.group_id, gm.monthly_amount_cents
      FROM group_members gm
      WHERE gm.is_mensalista = true
        AND gm.monthly_amount_cents > 0
    `;

    if (mensalistas.length === 0) {
      logger.info("No mensalistas found, skipping charge generation");
      return NextResponse.json({ message: "Nenhum mensalista encontrado", generated: 0 });
    }

    let generated = 0;

    for (const m of mensalistas) {
      // Check if a monthly charge already exists for this user/group/month
      const [existing] = await sql`
        SELECT id FROM charges
        WHERE user_id = ${m.user_id}
          AND group_id = ${m.group_id}
          AND type = 'monthly'
          AND due_date >= ${`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`}
          AND due_date < ${`${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}-01`}
      `;

      if (existing) continue; // Already generated for this month

      await sql`
        INSERT INTO charges (group_id, user_id, type, amount_cents, due_date)
        VALUES (${m.group_id}, ${m.user_id}, 'monthly', ${m.monthly_amount_cents}, ${dueDate})
      `;

      generated++;
    }

    logger.info(
      { generated, total: mensalistas.length, month: monthLabel },
      "Monthly charges generated"
    );

    return NextResponse.json({
      message: `Cobranças mensais geradas para ${monthLabel}`,
      generated,
      total: mensalistas.length,
    });
  } catch (error) {
    logger.error(error, "Error generating monthly charges");
    return NextResponse.json(
      { error: "Erro ao gerar cobranças mensais" },
      { status: 500 }
    );
  }
}
