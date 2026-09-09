import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

/**
 * POST /api/users/dismiss-stripe-notice
 * Marca que o usuario dispensou o banner de aviso de pagamento Stripe.
 * O banner reaparece automaticamente apos 7 dias para lembrar ate outubro.
 */
export async function POST() {
  try {
    const user = await requireAuth();

    await sql`
      UPDATE users
      SET stripe_notice_dismissed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${user.id}
    `;

    logger.info({ userId: user.id }, "Stripe notice dismissed");

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Nao autenticado") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    logger.error(error, "Error dismissing stripe notice");
    return NextResponse.json({ error: "Erro ao salvar preferencia" }, { status: 500 });
  }
}