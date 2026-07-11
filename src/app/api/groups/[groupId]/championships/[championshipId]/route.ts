import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { updateChampionshipSchema } from "@/lib/validations";
import { rowToChampionship, type ChampionshipRow } from "@/types/championship";

type Params = Promise<{ groupId: string; championshipId: string }>;

async function getChampionship(championshipId: string, groupId: string) {
  const [row] = await sql<ChampionshipRow[]>`
    SELECT * FROM championships
    WHERE id = ${championshipId} AND group_id = ${groupId}
  `;
  return row ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user);

    const row = await getChampionship(championshipId, groupId);
    if (!row) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ championship: rowToChampionship(row) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error fetching championship");
    return NextResponse.json({ error: "Erro ao buscar campeonato" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId } = await params;
    const user = await requireAuth();
    const context = await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem editar campeonatos",
    });

    const existing = await getChampionship(championshipId, groupId);
    if (!existing) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }

    // After active, only name/dates/rules can change (not format or team_formation)
    if (existing.status === "finished" || existing.status === "cancelled") {
      if (!context.isSystemAdmin) {
        return NextResponse.json(
          { error: "Campeonato encerrado não pode ser editado" },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const parsed = updateChampionshipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // Block format/team_formation changes after draft
    if (existing.status !== "draft" && !context.isSystemAdmin) {
      if (d.teamFormation !== undefined) {
        return NextResponse.json(
          { error: "Modo de formação de times não pode ser alterado após início" },
          { status: 400 }
        );
      }
    }

    const [updated] = await sql<ChampionshipRow[]>`
      UPDATE championships SET
        name                   = COALESCE(${d.name ?? null}, name),
        description            = COALESCE(${d.description ?? null}, description),
        team_formation         = COALESCE(${d.teamFormation ?? null}, team_formation),
        starts_at              = COALESCE(${d.startsAt ?? null}, starts_at),
        ends_at                = COALESCE(${d.endsAt ?? null}, ends_at),
        venue_id               = COALESCE(${d.venueId ?? null}, venue_id),
        match_duration_minutes = COALESCE(${d.matchDurationMinutes ?? null}, match_duration_minutes),
        match_win_goal_diff    = COALESCE(${d.matchWinGoalDiff ?? null}, match_win_goal_diff),
        can_captain_edit_rules = COALESCE(${d.canCaptainEditRules ?? null}, can_captain_edit_rules),
        points_win             = COALESCE(${d.pointsWin ?? null}, points_win),
        points_draw            = COALESCE(${d.pointsDraw ?? null}, points_draw),
        points_loss            = COALESCE(${d.pointsLoss ?? null}, points_loss),
        updated_at             = NOW()
      WHERE id = ${championshipId} AND group_id = ${groupId}
      RETURNING *
    `;

    logger.info({ championshipId, userId: user.id }, "Championship updated");
    return NextResponse.json({ championship: rowToChampionship(updated) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error updating championship");
    return NextResponse.json({ error: "Erro ao atualizar campeonato" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId } = await params;
    const user = await requireAuth();
    const context = await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem excluir campeonatos",
    });

    const existing = await getChampionship(championshipId, groupId);
    if (!existing) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }

    if (existing.status !== "draft" && !context.isSystemAdmin) {
      return NextResponse.json(
        { error: "Apenas campeonatos em rascunho podem ser excluídos" },
        { status: 400 }
      );
    }

    await sql`DELETE FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}`;

    logger.info({ championshipId, userId: user.id }, "Championship deleted");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error deleting championship");
    return NextResponse.json({ error: "Erro ao excluir campeonato" }, { status: 500 });
  }
}
