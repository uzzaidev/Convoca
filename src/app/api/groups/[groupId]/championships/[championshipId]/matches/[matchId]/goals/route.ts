import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { sendPushToUser } from "@/lib/mobile/fcm";

type Params = Promise<{ groupId: string; championshipId: string; matchId: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId, matchId } = await params;
    const user = await requireAuth();

    // Admin ou capitão de time na partida
    let context;
    try {
      context = await requireGroupAccess(groupId, user, { minRole: "admin" });
    } catch {
      context = await requireGroupAccess(groupId, user);
      const [captainCheck] = await sql`
        SELECT ctp.id
        FROM championship_team_players ctp
        JOIN championship_teams ct ON ct.id = ctp.championship_team_id
        JOIN championship_matches cm ON (cm.home_team_id = ct.id OR cm.away_team_id = ct.id)
        WHERE cm.id = ${matchId}
          AND ctp.user_id = ${user.id}
          AND ctp.is_captain = TRUE
      `;
      if (!captainCheck) {
        return NextResponse.json(
          { error: "Apenas admins ou capitães podem registrar gols" },
          { status: 403 }
        );
      }
    }

    const [match] = await sql`
      SELECT cm.id, cm.status, cm.home_score, cm.away_score,
             cm.home_team_id, cm.away_team_id, cm.event_id,
             ht.name AS home_team_name, at.name AS away_team_name
      FROM championship_matches cm
      JOIN championship_rounds cr ON cr.id = cm.round_id
      JOIN championship_phases cp ON cp.id = cr.phase_id
      JOIN championship_teams ht ON ht.id = cm.home_team_id
      JOIN championship_teams at ON at.id = cm.away_team_id
      WHERE cm.id = ${matchId} AND cp.championship_id = ${championshipId}
    `;
    if (!match) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
    }
    if (match.status !== "playing") {
      return NextResponse.json(
        { error: "Gols só podem ser registrados em partidas em andamento" },
        { status: 400 }
      );
    }
    if (!match.event_id) {
      return NextResponse.json(
        { error: "Partida não possui evento vinculado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { teamSide, scorerId, assisterId } = body as {
      teamSide: "home" | "away";
      scorerId: string;
      assisterId?: string;
    };

    if (!teamSide || !scorerId) {
      return NextResponse.json({ error: "teamSide e scorerId são obrigatórios" }, { status: 400 });
    }
    if (teamSide !== "home" && teamSide !== "away") {
      return NextResponse.json({ error: "teamSide deve ser 'home' ou 'away'" }, { status: 400 });
    }

    const teamId = teamSide === "home" ? match.home_team_id : match.away_team_id;

    // Valida que o scorer pertence ao time
    const [scorerCheck] = await sql`
      SELECT ctp.user_id, u.name
      FROM championship_team_players ctp
      JOIN users u ON u.id = ctp.user_id
      WHERE ctp.championship_team_id = ${teamId}
        AND ctp.user_id = ${scorerId}
    `;
    if (!scorerCheck) {
      return NextResponse.json({ error: "Jogador não pertence ao time" }, { status: 400 });
    }

    // Valida assister se fornecido
    let assisterName: string | null = null;
    if (assisterId && assisterId !== scorerId) {
      const [assisterCheck] = await sql`
        SELECT ctp.user_id, u.name
        FROM championship_team_players ctp
        JOIN users u ON u.id = ctp.user_id
        WHERE ctp.championship_team_id = ${teamId}
          AND ctp.user_id = ${assisterId}
      `;
      if (!assisterCheck) {
        return NextResponse.json({ error: "Assistente não pertence ao time" }, { status: 400 });
      }
      assisterName = assisterCheck.name as string;
    }

    // Cria event_actions (team_id = NULL pois são championship_teams, não a tabela teams de peladas)
    const [goalAction] = await sql`
      INSERT INTO event_actions (event_id, actor_user_id, action_type, team_id)
      VALUES (${match.event_id}, ${scorerId}, 'goal', NULL)
      RETURNING id
    `;

    if (assisterId && assisterId !== scorerId) {
      await sql`
        INSERT INTO event_actions (event_id, actor_user_id, action_type, team_id)
        VALUES (${match.event_id}, ${assisterId}, 'assist', NULL)
      `;
    }

    // Incrementa o placar
    const [updated] = await sql`
      UPDATE championship_matches SET
        home_score = CASE WHEN ${teamSide} = 'home' THEN COALESCE(home_score, 0) + 1 ELSE home_score END,
        away_score = CASE WHEN ${teamSide} = 'away' THEN COALESCE(away_score, 0) + 1 ELSE away_score END,
        updated_at = NOW()
      WHERE id = ${matchId}
      RETURNING home_score, away_score
    `;

    logger.info(
      { matchId, scorerId, assisterId, teamSide, userId: user.id },
      "Championship goal registered"
    );

    // Notificação (fire-and-forget)
    void (async () => {
      try {
        const scorerName = scorerCheck.name as string;
        const teamName = (teamSide === "home" ? match.home_team_name : match.away_team_name) as string;
        const homeScore = updated.home_score as number;
        const awayScore = updated.away_score as number;

        const body = assisterName
          ? `⚽ ${scorerName} (assist: ${assisterName}) — ${match.home_team_name} ${homeScore}×${awayScore} ${match.away_team_name}`
          : `⚽ ${scorerName} marcou para ${teamName} — ${match.home_team_name} ${homeScore}×${awayScore} ${match.away_team_name}`;

        const [champRow] = await sql`SELECT name FROM championships WHERE id = ${championshipId}`;
        const champName = (champRow as { name: string } | undefined)?.name ?? "Campeonato";

        const members = await sql`SELECT user_id FROM group_members WHERE group_id = ${groupId}`;
        for (const m of members as unknown as { user_id: string }[]) {
          await sendPushToUser(m.user_id, {
            title: `🏆 Gol — ${champName}`,
            body,
            data: { kind: "championship", championshipId, groupId },
          });
        }
      } catch { /* ignora */ }
    })();

    return NextResponse.json({
      success: true,
      actionId: goalAction.id,
      homeScore: updated.home_score,
      awayScore: updated.away_score,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error registering championship goal");
    return NextResponse.json({ error: "Erro ao registrar gol" }, { status: 500 });
  }
}
