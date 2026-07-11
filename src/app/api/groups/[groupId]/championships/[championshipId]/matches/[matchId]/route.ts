import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { updateChampionshipMatchSchema } from "@/lib/validations";

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
    const context = await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem registrar resultados",
    });

    // Verify championship is active and belongs to group
    const [champ] = await sql`
      SELECT id, status FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
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

    // Check if all matches in the championship are finished → auto-finish
    const [pending] = await sql`
      SELECT COUNT(*) AS cnt
      FROM championship_matches cm
      JOIN championship_rounds cr ON cr.id = cm.round_id
      JOIN championship_phases cp ON cp.id = cr.phase_id
      WHERE cp.championship_id = ${championshipId}
        AND cm.status NOT IN ('finished', 'cancelled')
    `;

    if (Number(pending.cnt) === 0) {
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
