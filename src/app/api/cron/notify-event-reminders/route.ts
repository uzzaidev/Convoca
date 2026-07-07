import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import { sendPushToUser } from "@/lib/mobile/fcm";
import logger from "@/lib/logger";

// Vercel Cron: 0 * * * * (a cada hora)
// Cobre notificações de eventos:
//   #1 Lista do jogo aberta  → todos os membros do grupo
//   #2 Lembrete 24h antes    → confirmados (status='yes')
//   #3 Lembrete 12h antes    → confirmados (status='yes')

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

// ─── #1 Lista aberta ────────────────────────────────────────────────────────
async function notifyListOpen(): Promise<number> {
  // Eventos cuja lista abriu na última hora (janela de 65min para cobrir drift do cron)
  const events = await sql<{ id: string; group_name: string }[]>`
    SELECT e.id, g.name AS group_name
    FROM events e
    JOIN groups g ON g.id = e.group_id
    WHERE e.list_opens_at >= NOW() - INTERVAL '65 minutes'
      AND e.list_opens_at <  NOW()
      AND e.status NOT IN ('canceled', 'finished')
  `;

  let sent = 0;
  for (const event of events) {
    const members = await sql<{ user_id: string }[]>`
      SELECT gm.user_id
      FROM group_members gm
      WHERE gm.group_id = (SELECT group_id FROM events WHERE id = ${event.id})
    `;

    for (const m of members) {
      const ok = await logAndSend(
        "event_list_open",
        event.id,
        m.user_id,
        "⚽ Lista do jogo aberta!",
        `Confirme sua presença no jogo de ${event.group_name}`,
        { kind: "event", eventId: event.id }
      );
      if (ok) sent++;
    }
  }
  return sent;
}

// ─── #2 Lembrete 24h ────────────────────────────────────────────────────────
async function notifyReminder24h(): Promise<number> {
  const rows = await sql<{ event_id: string; user_id: string; group_name: string }[]>`
    SELECT e.id AS event_id, ea.user_id, g.name AS group_name
    FROM events e
    JOIN groups g ON g.id = e.group_id
    JOIN event_attendance ea ON ea.event_id = e.id
    WHERE ea.status = 'yes'
      AND e.starts_at >= NOW() + INTERVAL '23 hours'
      AND e.starts_at <  NOW() + INTERVAL '25 hours'
      AND e.status NOT IN ('canceled', 'finished')
  `;

  let sent = 0;
  for (const row of rows) {
    const ok = await logAndSend(
      "event_reminder_24h",
      row.event_id,
      row.user_id,
      "⏰ Jogo amanhã!",
      `Seu jogo de ${row.group_name} começa em 24 horas`,
      { kind: "event", eventId: row.event_id }
    );
    if (ok) sent++;
  }
  return sent;
}

// ─── #3 Lembrete 12h ────────────────────────────────────────────────────────
async function notifyReminder12h(): Promise<number> {
  const rows = await sql<{ event_id: string; user_id: string; group_name: string }[]>`
    SELECT e.id AS event_id, ea.user_id, g.name AS group_name
    FROM events e
    JOIN groups g ON g.id = e.group_id
    JOIN event_attendance ea ON ea.event_id = e.id
    WHERE ea.status = 'yes'
      AND e.starts_at >= NOW() + INTERVAL '11 hours'
      AND e.starts_at <  NOW() + INTERVAL '13 hours'
      AND e.status NOT IN ('canceled', 'finished')
  `;

  let sent = 0;
  for (const row of rows) {
    const ok = await logAndSend(
      "event_reminder_12h",
      row.event_id,
      row.user_id,
      "⚡ Jogo hoje!",
      `Faltam 12 horas para o jogo de ${row.group_name}`,
      { kind: "event", eventId: row.event_id }
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
    const [listOpen, reminder24h, reminder12h] = await Promise.all([
      notifyListOpen(),
      notifyReminder24h(),
      notifyReminder12h(),
    ]);

    logger.info({ listOpen, reminder24h, reminder12h }, "notify-event-reminders executed");

    return NextResponse.json({
      ok: true,
      sent: { listOpen, reminder24h, reminder12h },
    });
  } catch (error) {
    logger.error(error, "Error in notify-event-reminders cron");
    return NextResponse.json({ error: "Erro ao enviar notificacoes" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
