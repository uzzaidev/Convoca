import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

const decisionSchema = z.object({
  tiebreakerId: z.string().uuid(),
  winnerUserId: z.string().uuid(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { eventId } = await context.params;
    const body = await request.json();

    const validation = decisionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { tiebreakerId, winnerUserId } = validation.data;

    await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas administradores podem decidir o vencedor",
    });

    const [tiebreaker] = await sql`
      SELECT * FROM mvp_tiebreakers
      WHERE id = ${tiebreakerId} AND event_id = ${eventId}
    `;

    if (!tiebreaker) {
      return NextResponse.json(
        { error: "Desempate nÃ£o encontrado" },
        { status: 404 }
      );
    }

    if (tiebreaker.status === "completed" || tiebreaker.status === "admin_decided") {
      return NextResponse.json(
        { error: "Este desempate jÃ¡ foi finalizado" },
        { status: 400 }
      );
    }

    const tiedUserIds = tiebreaker.tied_user_ids as string[];
    if (!tiedUserIds.includes(winnerUserId)) {
      return NextResponse.json(
        { error: "O vencedor deve ser um dos jogadores empatados" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE mvp_tiebreakers
      SET
        status = 'admin_decided',
        winner_user_id = ${winnerUserId},
        decided_by = ${user.id},
        completed_at = NOW()
      WHERE id = ${tiebreakerId}
    `;

    logger.info(
      {
        tiebreakerId,
        winnerId: winnerUserId,
        decidedBy: user.id,
        eventId,
      },
      "Admin decided MVP tiebreaker"
    );

    return NextResponse.json({
      success: true,
      message: "Vencedor definido com sucesso",
      winnerId: winnerUserId,
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error recording admin decision",
      fallbackMessage: "Erro ao registrar decisÃ£o",
    });
  }
}
