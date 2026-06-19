import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-helpers";
import { sendPushToUser } from "@/lib/mobile/fcm";
import logger from "@/lib/logger";

const sendSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(500).optional(),
});

/**
 * Envia uma notificação de teste para os devices do próprio usuário autenticado.
 * Útil para validar o pipeline FCM ponta a ponta.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const raw = await request.json().catch(() => ({}));
    const parsed = sendSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const title = parsed.data.title ?? "Convoca";
    const body = parsed.data.body ?? "Notificação de teste 🔔";

    const results = await sendPushToUser(user.id, {
      title,
      body,
      data: { kind: "test" },
    });

    const sent = results.filter((r) => r.ok).length;

    return NextResponse.json({
      ok: true,
      devices: results.length,
      sent,
      results,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    logger.error(error, "Error sending test push notification");
    return NextResponse.json({ error: "Erro ao enviar notificação" }, { status: 500 });
  }
}
