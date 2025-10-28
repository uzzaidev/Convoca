import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

// GET /api/groups/[groupId]/my-stats - Estatísticas pessoais do usuário no grupo
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId } = await params;

    // Verificar se o usuário é membro do grupo
    const membership = await sql`
      SELECT role FROM group_members
      WHERE user_id = ${user.id} AND group_id = ${groupId}
    `;

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    // Buscar eventos finalizados do grupo onde o usuário participou
    const events = await sql`
      SELECT e.id
      FROM events e
      INNER JOIN event_attendance ea ON e.id = ea.event_id
      WHERE e.group_id = ${groupId}
        AND e.status = 'finished'
        AND ea.user_id = ${user.id}
        AND ea.checked_in_at IS NOT NULL
    `;

    const eventIds = (events as unknown as Array<{ id: string }>).map(e => e.id);

    if (eventIds.length === 0) {
      return NextResponse.json({
        gamesPlayed: 0,
        goals: 0,
        assists: 0,
        saves: 0,
        yellowCards: 0,
        redCards: 0,
        averageRating: null,
        wins: 0,
        losses: 0,
        draws: 0,
        mvpCount: 0,
        tags: {},
      });
    }

    // Estatísticas de ações
    const actions = await sql`
      SELECT
        action_type,
        COUNT(*) as count
      FROM event_actions
      WHERE event_id = ANY(${eventIds})
        AND actor_user_id = ${user.id}
      GROUP BY action_type
    `;

    const actionsMap: Record<string, number> = {};
    (actions as unknown as Array<{ action_type: string; count: string }>).forEach((a) => {
      actionsMap[a.action_type] = parseInt(a.count);
    });

    // Vitórias, derrotas e empates
    const winLoss = await sql`
      SELECT
        t.is_winner,
        COUNT(*) as count
      FROM team_members tm
      INNER JOIN teams t ON tm.team_id = t.id
      WHERE t.event_id = ANY(${eventIds})
        AND tm.user_id = ${user.id}
        AND t.is_winner IS NOT NULL
      GROUP BY t.is_winner
    `;

    let wins = 0;
    let losses = 0;
    (winLoss as unknown as Array<{ is_winner: boolean; count: string }>).forEach((wl) => {
      if (wl.is_winner === true) wins = parseInt(wl.count);
      if (wl.is_winner === false) losses = parseInt(wl.count);
    });

    // Média de avaliação
    const ratingResult = await sql`
      SELECT AVG(score) as avg_rating
      FROM player_ratings
      WHERE event_id = ANY(${eventIds})
        AND rated_user_id = ${user.id}
    `;

    const averageRating = ratingResult[0]?.avg_rating
      ? parseFloat(ratingResult[0].avg_rating).toFixed(1)
      : null;

    // Tags recebidas (MVP, artilheiro, etc)
    const tagsResult = await sql`
      SELECT UNNEST(tags) as tag, COUNT(*) as count
      FROM player_ratings
      WHERE event_id = ANY(${eventIds})
        AND rated_user_id = ${user.id}
        AND tags IS NOT NULL
      GROUP BY tag
      ORDER BY count DESC
    `;

    const tags: Record<string, number> = {};
    let mvpCount = 0;
    (tagsResult as unknown as Array<{ tag: string; count: string }>).forEach((t) => {
      tags[t.tag] = parseInt(t.count);
      if (t.tag === 'mvp') mvpCount = parseInt(t.count);
    });

    return NextResponse.json({
      gamesPlayed: eventIds.length,
      goals: actionsMap['goal'] || 0,
      assists: actionsMap['assist'] || 0,
      saves: actionsMap['save'] || 0,
      yellowCards: actionsMap['yellow_card'] || 0,
      redCards: actionsMap['red_card'] || 0,
      averageRating,
      wins,
      losses,
      draws: 0, // TODO: calcular empates quando tivermos essa lógica
      mvpCount,
      tags,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching user stats");
    return NextResponse.json(
      { error: "Erro ao buscar suas estatísticas" },
      { status: 500 }
    );
  }
}
