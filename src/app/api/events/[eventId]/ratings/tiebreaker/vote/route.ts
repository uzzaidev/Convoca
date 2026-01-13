import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

const voteSchema = z.object({
  tiebreakerId: z.string().uuid(),
  votedUserId: z.string().uuid(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { eventId } = await context.params;
    const body = await request.json();

    const validation = voteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { tiebreakerId, votedUserId } = validation.data;

    // Verificar se usuário participou do evento
    const [attendance] = await sql`
      SELECT status
      FROM event_attendance
      WHERE event_id = ${eventId} AND user_id = ${user.id}
    `;

    if (!attendance || attendance.status !== "yes") {
      return NextResponse.json(
        { error: "Apenas jogadores confirmados podem votar" },
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

    if (tiebreaker.status === "pending") {
      // Atualizar status para "voting" quando primeiro voto for registrado
      await sql`
        UPDATE mvp_tiebreakers
        SET status = 'voting'
        WHERE id = ${tiebreakerId} AND status = 'pending'
      `;
    }

    // Validar que o voto é para um dos jogadores empatados
    const tiedUserIds = tiebreaker.tied_user_ids as string[];
    if (!tiedUserIds.includes(votedUserId)) {
      return NextResponse.json(
        { error: "Você deve votar em um dos jogadores empatados" },
        { status: 400 }
      );
    }

    // Registrar ou atualizar voto
    await sql`
      INSERT INTO mvp_tiebreaker_votes (
        tiebreaker_id,
        voter_user_id,
        voted_user_id
      ) VALUES (
        ${tiebreakerId},
        ${user.id},
        ${votedUserId}
      )
      ON CONFLICT (tiebreaker_id, voter_user_id)
      DO UPDATE SET
        voted_user_id = EXCLUDED.voted_user_id,
        created_at = NOW()
    `;

    // Contar total de participantes e votos
    const [participantCount] = await sql`
      SELECT COUNT(DISTINCT user_id) as count
      FROM event_attendance
      WHERE event_id = ${eventId} AND status = 'yes'
    `;

    const [voteCount] = await sql`
      SELECT COUNT(DISTINCT voter_user_id) as count
      FROM mvp_tiebreaker_votes
      WHERE tiebreaker_id = ${tiebreakerId}
    `;

    const totalParticipants = parseInt(participantCount.count as string);
    const totalVotes = parseInt(voteCount.count as string);

    // Se todos votaram, verificar se ainda há empate
    if (totalVotes === totalParticipants) {
      const voteCounts = await sql`
        SELECT
          voted_user_id,
          COUNT(*) as vote_count
        FROM mvp_tiebreaker_votes
        WHERE tiebreaker_id = ${tiebreakerId}
        GROUP BY voted_user_id
        ORDER BY vote_count DESC
      `;

      const maxVotes = parseInt(voteCounts[0].vote_count as string);
      const stillTied = voteCounts.filter(
        (vc) => parseInt(vc.vote_count as string) === maxVotes
      );

      if (stillTied.length === 1) {
        // Desempate resolvido!
        await sql`
          UPDATE mvp_tiebreakers
          SET
            status = 'completed',
            winner_user_id = ${stillTied[0].voted_user_id},
            completed_at = NOW()
          WHERE id = ${tiebreakerId}
        `;

        logger.info(
          { tiebreakerId, winnerId: stillTied[0].voted_user_id },
          "Tiebreaker resolved"
        );
      } else {
        // Ainda empatado - admin precisa decidir
        logger.info(
          { tiebreakerId, stillTiedCount: stillTied.length },
          "Tiebreaker still tied - admin decision required"
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Voto registrado com sucesso",
      votesReceived: totalVotes,
      totalParticipants,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error recording tiebreaker vote");
    return NextResponse.json(
      { error: "Erro ao registrar voto" },
      { status: 500 }
    );
  }
}
