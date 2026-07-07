import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import { sendPushToUser } from "@/lib/mobile/fcm";
import logger from "@/lib/logger";

// Vercel Cron: 0 9 * * * (diariamente às 9h UTC = 6h BRT)
// Cobre notificações de pagamento:
//   #4 Pagamento pendente (lembrete mensal)       → pendente > 7 dias
//   #5 Aviso 24h antes do prazo                   → due_date = amanhã
//   #6 Pagamento em atraso (24h após vencimento)  → due_date = ontem

function authGuard(request: NextRequest): NextResponse | null {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
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

// ─── Handler principal ───────────────────────────────────────────────────────
async function handle(request: NextRequest) {
  const denied = authGuard(request);
  if (denied) return denied;

  try {
    const [dueWarning, overdue, pendingMonthly] = await Promise.all([
      notifyDueWarning(),
      notifyOverdue(),
      notifyPendingMonthly(),
    ]);

    logger.info({ dueWarning, overdue, pendingMonthly }, "notify-payment-reminders executed");

    return NextResponse.json({
      ok: true,
      sent: { dueWarning, overdue, pendingMonthly },
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
