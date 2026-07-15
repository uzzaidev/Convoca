import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { updateChampionshipMatchSchema } from "@/lib/validations";
import { sendPushToUser } from "@/lib/mobile/fcm";
import { getWinnerSlot } from "@/lib/single-elimination";

type Params = Promise<{ groupId: string; championshipId: string; matchId: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId, matchId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user);

    const [match] = await sql`
      SELECT
        cm.*,
        ht.name  AS home_team_name,
        ht.color AS home_team_color,
        at.name  AS away_team_name,
        at.color AS away_team_color
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

    // Verify group ownership
    const [champ] = await sql`
      SELECT id FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
    `;
    if (!champ) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error fetching championship match");
    return NextResponse.json({ error: "Erro ao buscar partida" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId, matchId } = await params;
    const user = await requireAuth();

    // Admins OR captains of either team can register match results
    let context;
    try {
      context = await requireGroupAccess(groupId, user, { minRole: "admin" });
    } catch {
      // Not admin — check if user is captain of a team in this match
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
          { error: "Apenas admins ou capitães podem registrar resultados" },
          { status: 403 }
        );
      }
    }

    // Verify championship is active and belongs to group
    const [champ] = await sql`
      SELECT id, status, format FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
    `;
    if (!champ) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }
    if (champ.status !== "active" && !context.isSystemAdmin) {
      return NextResponse.json(
        { error: "Resultados só podem ser registrados em campeonatos ativos" },
        { status: 400 }
      );
    }

    // Verify match belongs to this championship
    const [existing] = await sql`
      SELECT cm.id, cm.status, cm.updated_at
      FROM championship_matches cm
      JOIN championship_rounds cr ON cr.id = cm.round_id
      JOIN championship_phases cp ON cp.id = cr.phase_id
      WHERE cm.id = ${matchId} AND cp.championship_id = ${championshipId}
    `;
    if (!existing) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateChampionshipMatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // ── action: start ─────────────────────────────────────────────────────────
    if (d.action === "start") {
      if (existing.status === "finished") {
        return NextResponse.json(
          { error: "Partida já encerrada" },
          { status: 400 }
        );
      }
      const [started] = await sql`
        UPDATE championship_matches SET
          status     = 'playing',
          updated_at = NOW()
        WHERE id = ${matchId}
        RETURNING *
      `;
      logger.info({ matchId, userId: user.id }, "Championship match started");
      return NextResponse.json({ match: started });
    }

    // ── action: cancel ────────────────────────────────────────────────────────
    if (d.action === "cancel") {
      if (existing.status === "finished") {
        return NextResponse.json(
          { error: "Partida já encerrada não pode ser cancelada" },
          { status: 400 }
        );
      }
      if (existing.status === "cancelled") {
        return NextResponse.json(
          { error: "Partida já cancelada" },
          { status: 400 }
        );
      }
      const [cancelled] = await sql`
        UPDATE championship_matches SET
          status     = 'cancelled',
          updated_at = NOW()
        WHERE id = ${matchId}
        RETURNING *
      `;
      if (cancelled.event_id) {
        await sql`UPDATE events SET status = 'cancelled', updated_at = NOW() WHERE id = ${cancelled.event_id}`;
      }
      logger.info({ matchId, userId: user.id }, "Championship match cancelled");
      return NextResponse.json({ match: cancelled });
    }

    // ── Registrar/corrigir resultado ──────────────────────────────────────────
    if (d.homeScore === undefined || d.awayScore === undefined) {
      return NextResponse.json(
        { error: "homeScore e awayScore são obrigatórios" },
        { status: 400 }
      );
    }

    const playedAt = d.playedAt ?? new Date().toISOString();

    const [updated] = await sql`
      UPDATE championship_matches SET
        home_score = ${d.homeScore},
        away_score = ${d.awayScore},
        status     = 'finished',
        played_at  = ${playedAt},
        updated_at = NOW()
      WHERE id = ${matchId}
      RETURNING *
    `;

    // Also finish the linked event if it exists
    if (updated.event_id) {
      await sql`
        UPDATE events SET status = 'finished', updated_at = NOW()
        WHERE id = ${updated.event_id}
      `;
    }

    logger.info(
      { matchId, homeScore: d.homeScore, awayScore: d.awayScore, userId: user.id },
      "Championship match result recorded"
    );

    // Auto-advance winner for single elimination
    if (champ.format === "single_elimination") {
      const [matchInfo] = await sql`
        SELECT cm.match_position, cr.round_number
        FROM championship_matches cm
        JOIN championship_rounds cr ON cr.id = cm.round_id
        JOIN championship_phases cp ON cp.id = cr.phase_id
        WHERE cm.id = ${matchId} AND cp.championship_id = ${championshipId}
      `;

      if (matchInfo?.match_position != null) {
        const winnerId =
          (updated.home_score as number) > (updated.away_score as number)
            ? updated.home_team_id
            : updated.away_team_id;
        const { nextPosition, slot } = getWinnerSlot(matchInfo.match_position as number);
        const nextRound = (matchInfo.round_number as number) + 1;

        const [nextMatch] = await sql`
          SELECT cm.id
          FROM championship_matches cm
          JOIN championship_rounds cr ON cr.id = cm.round_id
          JOIN championship_phases cp ON cp.id = cr.phase_id
          WHERE cp.championship_id = ${championshipId}
            AND cr.round_number = ${nextRound}
            AND cm.match_position = ${nextPosition}
        `;

        if (nextMatch) {
          if (slot === "home") {
            await sql`UPDATE championship_matches SET home_team_id = ${winnerId} WHERE id = ${nextMatch.id}`;
          } else {
            await sql`UPDATE championship_matches SET away_team_id = ${winnerId} WHERE id = ${nextMatch.id}`;
          }
        }
      }
    }

    // Check if all determined matches are finished → auto-finish
    const [pending] = await sql`
      SELECT COUNT(*) AS cnt
      FROM championship_matches cm
      JOIN championship_rounds cr ON cr.id = cm.round_id
      JOIN championship_phases cp ON cp.id = cr.phase_id
      WHERE cp.championship_id = ${championshipId}
        AND cm.status NOT IN ('finished', 'cancelled')
        AND cm.home_team_id IS NOT NULL
        AND cm.away_team_id IS NOT NULL
    `;

    const champFinished = Number(pending.cnt) === 0;
    if (champFinished) {
      await sql`
        UPDATE championships SET status = 'finished', updated_at = NOW()
        WHERE id = ${championshipId}
      `;
      await sql`
        UPDATE championship_phases SET status = 'finished', updated_at = NOW()
        WHERE championship_id = ${championshipId}
      `;
      logger.info({ championshipId }, "Championship auto-finished — all matches done");
    }

    // Notificações (fire-and-forget)
    void (async () => {
      try {
        const [champRow] = await sql`SELECT name FROM championships WHERE id = ${championshipId}`;
        const champName = (champRow as { name: string } | undefined)?.name ?? "Campeonato";

        const [matchRow] = await sql`
          SELECT
            ht.name AS home_name, at.name AS away_name, cr.round_number
          FROM championship_matches cm
          JOIN championship_rounds cr ON cr.id = cm.round_id
          JOIN championship_teams ht ON ht.id = cm.home_team_id
          JOIN championship_teams at ON at.id = cm.away_team_id
          WHERE cm.id = ${matchId}
        `;
        const roundNum = (matchRow as { round_number: number } | undefined)?.round_number ?? 1;
        const homeName = (matchRow as { home_name: string } | undefined)?.home_name ?? "Casa";
        const awayName = (matchRow as { away_name: string } | undefined)?.away_name ?? "Fora";

        // Notifica todos os membros do grupo com o resultado
        const members = await sql`SELECT user_id FROM group_members WHERE group_id = ${groupId}`;
        for (const m of members as unknown as { user_id: string }[]) {
          await sendPushToUser(m.user_id, {
            title: "🏆 Resultado registrado!",
            body: `${homeName} ${d.homeScore} × ${d.awayScore} ${awayName} — ${champName} Rodada ${roundNum}`,
            data: { kind: "championship", championshipId, groupId },
          });
        }

        // Se campeonato encerrou, notifica também
        if (champFinished) {
          for (const m of members as unknown as { user_id: string }[]) {
            await sendPushToUser(m.user_id, {
              title: "🏆 Campeonato encerrado!",
              body: `${champName} chegou ao fim. Confira a classificação final!`,
              data: { kind: "championship", championshipId, groupId },
            });
          }
        }
      } catch { /* ignora */ }
    })();

    return NextResponse.json({ match: updated });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error updating championship match");
    return NextResponse.json({ error: "Erro ao registrar resultado" }, { status: 500 });
  }
}
