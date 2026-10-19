import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import { sendPushToUser } from "@/lib/mobile/fcm";
import { sendSubscriptionRenewalReminderEmail } from "@/lib/email";
import logger from "@/lib/logger";

// Vercel Cron: 0 9 * * * (diariamente às 9h UTC = 6h BRT)
// Cobre notificações de pagamento:
//   #4 Pagamento pendente (lembrete mensal)       → pendente > 7 dias
//   #5 Aviso 24h antes do prazo                   → due_date = amanhã
//   #6 Pagamento em atraso (24h após vencimento)  → due_date = ontem
//   #7 Aviso 7 dias antes da renovação/trial da assinatura do grupo (e-mail + push)

function authGuard(request: NextRequest): NextResponse | null {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }
  return null;
}

async function alreadySent(type: string, refId: string, userId: string): Promise<boolean> {
  const [row] = await sql`
    SELECT 1 FROM notification_log
    WHERE type = ${type} AND ref_id = ${refId} AND user_id = ${userId}
  `;
  return !!row;
}

async function logAndSend(
  type: string,
  refId: string,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (await alreadySent(type, refId, userId)) return false;

  await sendPushToUser(userId, { title, body, data });

  await sql`
    INSERT INTO notification_log (type, ref_id, user_id)
    VALUES (${type}, ${refId}, ${userId})
    ON CONFLICT (type, ref_id, user_id) DO NOTHING
  `;
  return true;
}

// ─── #5 Aviso 24h antes do vencimento ───────────────────────────────────────
async function notifyDueWarning(): Promise<number> {
  const charges = await sql<{ id: string; user_id: string; group_name: string; amount_cents: number }[]>`
    SELECT c.id, c.user_id, g.name AS group_name, c.amount_cents
    FROM charges c
    JOIN groups g ON g.id = c.group_id
    WHERE c.status = 'pending'
      AND c.due_date = CURRENT_DATE + INTERVAL '1 day'
  `;

  let sent = 0;
  for (const charge of charges) {
    const ok = await logAndSend(
      "charge_due_warning",
      charge.id,
      charge.user_id,
      "⚠️ Prazo de pagamento amanhã",
      `Seu pagamento em ${charge.group_name} vence amanhã. Regularize no app.`,
      { kind: "payment", groupName: charge.group_name }
    );
    if (ok) sent++;
  }
  return sent;
}

// ─── #6 Pagamento em atraso (24h após vencimento) ───────────────────────────
async function notifyOverdue(): Promise<number> {
  const charges = await sql<{ id: string; user_id: string; group_name: string }[]>`
    SELECT c.id, c.user_id, g.name AS group_name
    FROM charges c
    JOIN groups g ON g.id = c.group_id
    WHERE c.status = 'pending'
      AND c.due_date = CURRENT_DATE - INTERVAL '1 day'
  `;

  let sent = 0;
  for (const charge of charges) {
    const ok = await logAndSend(
      "charge_overdue",
      charge.id,
      charge.user_id,
      "🚨 Pagamento em atraso",
      `Seu pagamento em ${charge.group_name} está vencido. Regularize agora.`,
      { kind: "payment", groupName: charge.group_name }
    );
    if (ok) sent++;
  }
  return sent;
}

// ─── #4 Lembrete mensal de pagamento pendente ────────────────────────────────
// Disparado uma vez por mês por cobrança pendente que já tenha mais de 7 dias.
// ref_id composto (chargeId_ano_mes) garante no máximo 1 lembrete/mês por cobrança.
async function notifyPendingMonthly(): Promise<number> {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}_${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const charges = await sql<{ id: string; user_id: string; group_name: string }[]>`
    SELECT c.id, c.user_id, g.name AS group_name
    FROM charges c
    JOIN groups g ON g.id = c.group_id
    WHERE c.status = 'pending'
      AND c.created_at < NOW() - INTERVAL '7 days'
      AND (c.due_date IS NULL OR c.due_date < CURRENT_DATE)
  `;

  let sent = 0;
  for (const charge of charges) {
    const refId = `${charge.id}_${monthKey}`;
    const ok = await logAndSend(
      "charge_pending_monthly",
      refId,
      charge.user_id,
      "💰 Pagamento pendente",
      `Você tem um pagamento em aberto em ${charge.group_name}. Regularize no app.`,
      { kind: "payment", groupName: charge.group_name }
    );
    if (ok) sent++;
  }
  return sent;
}

// ─── #7 Aviso 7 dias antes da renovação da assinatura Stripe do grupo ───────
async function notifyUpcomingSubscriptionRenewals(): Promise<number> {
  const subs = await sql<{
    stripe_subscription_id: string;
    group_id: string;
    group_name: string;
    user_id: string;
    user_name: string;
    user_email: string;
    status: string;
    renewal_at: string;
    amount_cents: number;
  }[]>`
    SELECT
      gs.stripe_subscription_id,
      gs.group_id,
      g.name AS group_name,
      gs.user_id,
      u.name AS user_name,
      u.email AS user_email,
      gs.status,
      COALESCE(gs.trial_end, gs.current_period_end) AS renewal_at,
      COALESCE(sp.amount_cents, 5990) AS amount_cents
    FROM group_subscriptions gs
    JOIN groups g ON g.id = gs.group_id
    JOIN users u ON u.id = gs.user_id
    LEFT JOIN subscription_plans sp ON sp.id = gs.plan_id
    WHERE gs.status IN ('active', 'trialing')
      AND gs.canceled_at IS NULL
      AND g.deleted_at IS NULL
      AND COALESCE(gs.trial_end, gs.current_period_end) IS NOT NULL
      AND (COALESCE(gs.trial_end, gs.current_period_end) AT TIME ZONE 'America/Sao_Paulo')::date =
          ((NOW() AT TIME ZONE 'America/Sao_Paulo')::date + 7)
  `;

  let sent = 0;
  const baseUrl = process.env.NEXTAUTH_URL || "https://convoca.uzzai.com.br";

  for (const sub of subs) {
    const renewalDate = new Date(sub.renewal_at);
    const dateKey = renewalDate.toISOString().slice(0, 10);
    const refId = `${sub.stripe_subscription_id}_${dateKey}`;

    if (await alreadySent("sub_renewal_reminder", refId, sub.user_id)) {
      continue;
    }

    const formattedDate = renewalDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const formattedAmount = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(sub.amount_cents / 100);

    const isTrialEnding = sub.status === "trialing";
    const manageUrl = `${baseUrl}/groups/${sub.group_id}/settings`;

    await Promise.allSettled([
      sendSubscriptionRenewalReminderEmail({
        to: sub.user_email,
        userName: sub.user_name || "Organizador",
        groupName: sub.group_name,
        amountCents: sub.amount_cents,
        renewalDate,
        isTrialEnding,
        manageUrl,
      }),
      sendPushToUser(sub.user_id, {
        title: isTrialEnding ? "⏳ Período de teste acabando" : "📅 Renovação de assinatura em breve",
        body: isTrialEnding
          ? `O período de teste do grupo ${sub.group_name} termina em ${formattedDate} (${formattedAmount}).`
          : `A assinatura do grupo ${sub.group_name} (${formattedAmount}) será renovada em ${formattedDate}.`,
        data: { kind: "subscription_renewal", groupId: sub.group_id },
      }),
    ]);

    await sql`
      INSERT INTO notification_log (type, ref_id, user_id)
      VALUES ('sub_renewal_reminder', ${refId}, ${sub.user_id})
      ON CONFLICT (type, ref_id, user_id) DO NOTHING
    `;
    sent++;
  }

  return sent;
}

// ─── Handler principal ───────────────────────────────────────────────────────
async function handle(request: NextRequest) {
  const denied = authGuard(request);
  if (denied) return denied;

  try {
    const [dueWarning, overdue, pendingMonthly, subscriptionRenewal] = await Promise.all([
      notifyDueWarning(),
      notifyOverdue(),
      notifyPendingMonthly(),
      notifyUpcomingSubscriptionRenewals(),
    ]);

    logger.info({ dueWarning, overdue, pendingMonthly, subscriptionRenewal }, "notify-payment-reminders executed");

    return NextResponse.json({
      ok: true,
      sent: { dueWarning, overdue, pendingMonthly, subscriptionRenewal },
    });
  } catch (error) {
    logger.error(error, "Error in notify-payment-reminders cron");
    return NextResponse.json({ error: "Erro ao enviar notificacoes" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
