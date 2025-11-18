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

    // Buscar estatísticas completas do usuário
    const stats = await sql`
      WITH
      -- Eventos finalizados do grupo onde o usuário participou (check-in feito)
      user_events AS (
        SELECT DISTINCT e.id
        FROM events e
        INNER JOIN event_attendance ea ON e.id = ea.event_id
        WHERE e.group_id = ${groupId}
          AND e.status = 'finished'
          AND ea.user_id = ${user.id}
          AND ea.status = 'yes'
          AND ea.checked_in_at IS NOT NULL
      )
      SELECT
        -- Jogos jogados
        COUNT(DISTINCT ue.id) as games_played,

        -- Gols
        COUNT(DISTINCT CASE
          WHEN ea.action_type = 'goal' AND ea.subject_user_id = ${user.id}
          THEN ea.id
        END) as goals,

        -- Assistências
        COUNT(DISTINCT CASE
          WHEN ea.action_type = 'assist' AND ea.subject_user_id = ${user.id}
          THEN ea.id
        END) as assists,

        -- Defesas (goleiro)
        COUNT(DISTINCT CASE
          WHEN ea.action_type = 'save' AND ea.subject_user_id = ${user.id}
          THEN ea.id
        END) as saves,

        -- Cartões amarelos
        COUNT(DISTINCT CASE
          WHEN ea.action_type = 'yellow_card' AND ea.subject_user_id = ${user.id}
          THEN ea.id
        END) as yellow_cards,

        -- Cartões vermelhos
        COUNT(DISTINCT CASE
          WHEN ea.action_type = 'red_card' AND ea.subject_user_id = ${user.id}
          THEN ea.id
        END) as red_cards,

        -- Vitórias
        COUNT(DISTINCT CASE
          WHEN t.is_winner = true
          THEN t.event_id
        END) as wins,

        -- Derrotas
        COUNT(DISTINCT CASE
          WHEN t.is_winner = false
          THEN t.event_id
        END) as losses,

        -- Contagem de MVPs
        COUNT(DISTINCT CASE
          WHEN 'mvp' = ANY(pr.tags)
          THEN pr.id
        END) as mvp_count

      FROM user_events ue

      -- Ações do usuário
      LEFT JOIN event_actions ea ON ea.event_id = ue.id

      -- Times e vitórias/derrotas
      LEFT JOIN team_members tm ON tm.user_id = ${user.id}
      LEFT JOIN teams t ON tm.team_id = t.id AND t.event_id = ue.id

      -- Avaliações recebidas
      LEFT JOIN player_ratings pr ON pr.rated_user_id = ${user.id} AND pr.event_id = ue.id
    `;

    if (!stats || stats.length === 0 || stats[0].games_played === '0') {
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

    const userStats = stats[0];

    // Buscar tags recebidas
    const tagsResult = await sql`
      SELECT UNNEST(tags) as tag, COUNT(*) as count
      FROM player_ratings pr
      INNER JOIN events e ON pr.event_id = e.id
      WHERE e.group_id = ${groupId}
        AND e.status = 'finished'
        AND pr.rated_user_id = ${user.id}
        AND tags IS NOT NULL
      GROUP BY tag
      ORDER BY count DESC
    `;

    const tags: Record<string, number> = {};
    (tagsResult as unknown as Array<{ tag: string; count: string }>).forEach((t) => {
      tags[t.tag] = parseInt(t.count);
    });

    return NextResponse.json({
      gamesPlayed: parseInt(userStats.games_played) || 0,
      goals: parseInt(userStats.goals) || 0,
      assists: parseInt(userStats.assists) || 0,
      saves: parseInt(userStats.saves) || 0,
      yellowCards: parseInt(userStats.yellow_cards) || 0,
      redCards: parseInt(userStats.red_cards) || 0,
      averageRating: null,
      wins: parseInt(userStats.wins) || 0,
      losses: parseInt(userStats.losses) || 0,
      draws: 0, // TODO: calcular empates quando tivermos essa lógica
      mvpCount: parseInt(userStats.mvp_count) || 0,
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
