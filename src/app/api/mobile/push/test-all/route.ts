import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sendPushToUser, type PushMessage } from "@/lib/mobile/fcm";
import logger from "@/lib/logger";

/**
 * POST /api/mobile/push/test-all
 * Força o envio de todos os 9 tipos de notificação para o usuário autenticado.
 * Uso exclusivo para validação em device real. Não grava notification_log.
 */

const DELAY_MS = 600;

const NOTIFICATIONS: PushMessage[] = [
  {
    title: "⚽ Lista do jogo aberta!",
    body: "Confirme sua presença — Pelada da Sexta 20h (TESTE)",
    data: { kind: "test", type: "event_list_open" },
  },
  {
    title: "⏰ Jogo amanhã!",
    body: "Seu jogo começa em 24 horas — Pelada da Sexta (TESTE)",
    data: { kind: "test", type: "event_reminder_24h" },
  },
  {
    title: "⚡ Jogo hoje!",
    body: "Faltam 12 horas para a pelada (TESTE)",
    data: { kind: "test", type: "event_reminder_12h" },
  },
  {
    title: "📅 Novo jogo criado!",
    body: "Pelada da Galera — Sex 20h (TESTE)",
    data: { kind: "test", type: "event_created" },
  },
  {
    title: "🎉 Você entrou na pelada!",
    body: "Saiu da lista de espera e está confirmado (TESTE)",
    data: { kind: "test", type: "waitlist_promoted" },
  },
  {
    title: "🎲 Times sorteados!",
    body: "O sorteio foi feito — veja o seu time (TESTE)",
    data: { kind: "test", type: "teams_drawn" },
  },
  {
    title: "📊 Resultado publicado!",
    body: "Estatísticas e rankings do jogo disponíveis (TESTE)",
    data: { kind: "test", type: "event_result_published" },
  },
  {
    title: "🏆 Resultado registrado!",
    body: "Azul 2 × 1 Vermelho — Copa Semanal Rodada 1 (TESTE)",
    data: { kind: "test", type: "championship_match_result" },
  },
  {
    title: "🏆 Campeonato encerrado!",
    body: "Copa Semanal chegou ao fim. Confira a classificação final! (TESTE)",
    data: { kind: "test", type: "championship_finished" },
  },
];

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function POST() {
  try {
    const user = await requireAuth();

    logger.info({ userId: user.id }, "test-all push: iniciando envio");

    const summary: { type: string; ok: boolean; devices: number }[] = [];

    for (const notif of NOTIFICATIONS) {
      const results = await sendPushToUser(user.id, notif);
      const sent = results.filter((r) => r.ok).length;
      summary.push({
        type: notif.data?.type ?? "unknown",
        ok: sent > 0,
        devices: results.length,
      });

      if (results.length === 0) {
        // Nenhum device registrado — para imediatamente com info útil
        return NextResponse.json(
          {
            ok: false,
            error: "Nenhum device registrado para este usuário. Abra o app nativo (não o browser) e logue com esta conta para registrar o token FCM.",
            sent: 0,
          },
          { status: 422 }
        );
      }

      await sleep(DELAY_MS);
    }

    logger.info({ userId: user.id, summary }, "test-all push: concluído");

    return NextResponse.json({
      ok: true,
      sent: summary.filter((s) => s.ok).length,
      total: NOTIFICATIONS.length,
      summary,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Erro no test-all push");
    return NextResponse.json({ error: "Erro ao enviar notificações de teste" }, { status: 500 });
  }
}
