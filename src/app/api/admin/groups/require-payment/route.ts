import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

/**
 * POST /api/admin/groups/require-payment
 * Admin muda grupo ativo (sem assinatura) para pending_payment
 * Body: { groupId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireSystemAdmin();
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: "groupId é obrigatório" }, { status: 400 });
    }

    // Verificar se grupo existe e está ativo
    const [group] = await sql`
      SELECT id, name, status FROM groups
      WHERE id = ${groupId} AND deleted_at IS NULL
    `;

    if (!group) {
      return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    }

    if (group.status !== "active") {
      return NextResponse.json(
        { error: "Somente grupos ativos podem ser cobrados" },
        { status: 400 }
      );
    }

    // Verificar se já tem assinatura ativa
    const [existingSub] = await sql`
      SELECT id FROM group_subscriptions
      WHERE group_id = ${groupId} AND status IN ('active', 'trialing')
      LIMIT 1
    `;

    if (existingSub) {
      return NextResponse.json(
        { error: "Este grupo já possui assinatura ativa" },
        { status: 400 }
      );
    }

    // Mudar status para pending_payment
    await sql`
      UPDATE groups
      SET status = 'pending_payment',
          status_reason = 'Pagamento de assinatura solicitado pelo administrador.',
          status_updated_at = NOW(),
          status_updated_by = ${admin.id}
      WHERE id = ${groupId}
    `;

    logger.info({ groupId, adminId: admin.id }, "Admin required payment for group");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissão")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    logger.error(error, "Error requiring payment for group");
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
