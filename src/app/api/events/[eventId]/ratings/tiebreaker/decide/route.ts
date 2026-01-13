import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
        { error: "Dados inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { tiebreakerId, winnerUserId } = validation.data;

    // Verificar se usuário é admin do grupo
    const [membership] = await sql`
      SELECT gm.role
      FROM events e
      INNER JOIN group_members gm ON e.group_id = gm.group_id
      WHERE e.id = ${eventId} AND gm.user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem decidir o vencedor" },
        { status: 403 }
      );
    }

    // Buscar tiebreaker e validar
    const [tiebreaker] = await sql`
      SELECT * FROM mvp_tiebreakers
      WHERE id = ${tiebreakerId} AND event_id = ${eventId}
    `;

    if (!tiebreaker) {
      return NextResponse.json(
        { error: "Desempate não encontrado" },
        { status: 404 }
      );
    }

    if (tiebreaker.status === "completed" || tiebreaker.status === "admin_decided") {
      return NextResponse.json(
        { error: "Este desempate já foi finalizado" },
        { status: 400 }
      );
    }

    // Validar que o vencedor é um dos jogadores empatados
    const tiedUserIds = tiebreaker.tied_user_ids as string[];
    if (!tiedUserIds.includes(winnerUserId)) {
      return NextResponse.json(
        { error: "O vencedor deve ser um dos jogadores empatados" },
        { status: 400 }
      );
    }

    // Atualizar tiebreaker com decisão do admin
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
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error recording admin decision");
    return NextResponse.json(
      { error: "Erro ao registrar decisão" },
      { status: 500 }
    );
  }
}
