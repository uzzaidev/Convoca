import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { getStripe } from "@/lib/stripe";
import logger from "@/lib/logger";

/**
 * PATCH /api/admin/subscriptions/[subscriptionId]
 * Super admin: gerenciar assinatura de grupo manualmente.
 *
 * Acoes suportadas:
 *   extend_grace       - adiciona N dias de grace_until (padrao: 30)
 *   cancel             - cancela imediatamente no Stripe + banco
 *   reactivate_manual  - reativa com grace_until sem assinatura Stripe
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    await requireSystemAdmin();

    const { subscriptionId } = await params;
    const body = await request.json();
    const { action, days } = body as { action: string; days?: number };

    const [sub] = await sql`
      SELECT gs.*, g.name AS group_name
      FROM group_subscriptions gs
      INNER JOIN groups g ON g.id = gs.group_id
      WHERE gs.id = ${subscriptionId}
    `;

    if (!sub) {
      return NextResponse.json({ error: "Assinatura nao encontrada" }, { status: 404 });
    }

    switch (action) {
      case "extend_grace": {
        const extensionDays = typeof days === "number" && days > 0 ? days : 30;
        const base =
          sub.grace_until && new Date(sub.grace_until as string) > new Date()
            ? new Date(sub.grace_until as string)
            : new Date();
        const newGrace = new Date(base.getTime() + extensionDays * 24 * 60 * 60 * 1000);

        await sql`
          UPDATE group_subscriptions
          SET grace_until = ${newGrace.toISOString()}::timestamp,
              updated_at = NOW()
          WHERE id = ${subscriptionId}
        `;

        await sql`
          UPDATE groups
          SET status = 'active',
              status_reason = ${"Acesso estendido manualmente por " + extensionDays + " dias"},
              status_updated_at = NOW()
          WHERE id = ${sub.group_id}
            AND status IN ('inactive', 'pending_payment')
        `;

        logger.info(
          { subscriptionId, groupId: sub.group_id, graceDays: extensionDays, newGrace },
          "Admin extended grace period"
        );

        return NextResponse.json({
          ok: true,
          grace_until: newGrace.toISOString(),
          message: `Acesso estendido por ${extensionDays} dias.`,
        });
      }

      case "cancel": {
        if (sub.stripe_subscription_id) {
          try {
            await getStripe().subscriptions.cancel(sub.stripe_subscription_id as string);
          } catch (stripeErr) {
            logger.warn({ stripeErr, subscriptionId }, "Stripe cancel failed, updating DB only");
          }
        }

        await sql`
          UPDATE group_subscriptions
          SET status = 'canceled',
              canceled_at = NOW(),
              grace_until = NULL,
              updated_at = NOW()
          WHERE id = ${subscriptionId}
        `;

        await sql`
          UPDATE groups
          SET status = 'inactive',
              status_reason = 'Assinatura cancelada pelo administrador do sistema',
              status_updated_at = NOW()
          WHERE id = ${sub.group_id}
        `;

        logger.info({ subscriptionId, groupId: sub.group_id }, "Admin canceled subscription");

        return NextResponse.json({ ok: true, message: "Assinatura cancelada." });
      }

      case "reactivate_manual": {
        const extensionDays = typeof days === "number" && days > 0 ? days : 30;
        const newGrace = new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000);

        await sql`
          UPDATE group_subscriptions
          SET status = 'active',
              grace_until = ${newGrace.toISOString()}::timestamp,
              canceled_at = NULL,
              updated_at = NOW()
          WHERE id = ${subscriptionId}
        `;

        await sql`
          UPDATE groups
          SET status = 'active',
              status_reason = ${"Reativado manualmente por " + extensionDays + " dias"},
              status_updated_at = NOW()
          WHERE id = ${sub.group_id}
        `;

        logger.info(
          { subscriptionId, groupId: sub.group_id, days: extensionDays },
          "Admin manually reactivated subscription"
        );

        return NextResponse.json({
          ok: true,
          grace_until: newGrace.toISOString(),
          message: `Grupo reativado por ${extensionDays} dias.`,
        });
      }

      default:
        return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("permissao")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }
    logger.error(error, "Error managing subscription");
    return NextResponse.json({ error: "Erro ao processar acao" }, { status: 500 });
  }
}