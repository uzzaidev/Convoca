import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { createChampionshipSchema } from "@/lib/validations";
import { rowToChampionship, type ChampionshipRow } from "@/types/championship";

type Params = Promise<{ groupId: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user);

    const rows = await sql<ChampionshipRow[]>`
      SELECT c.*
      FROM championships c
      WHERE c.group_id = ${groupId}
      ORDER BY c.created_at DESC
    `;

    return NextResponse.json({ championships: rows.map(rowToChampionship) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error listing championships");
    return NextResponse.json({ error: "Erro ao listar campeonatos" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar campeonatos",
    });

    const body = await request.json();
    const parsed = createChampionshipSchema.safeParse({ ...body, groupId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const [row] = await sql<ChampionshipRow[]>`
      INSERT INTO championships (
        group_id, name, description, format, team_formation,
        starts_at, ends_at, venue_id,
        match_duration_minutes, match_win_goal_diff, can_captain_edit_rules,
        points_win, points_draw, points_loss,
        created_by
      ) VALUES (
        ${d.groupId}, ${d.name}, ${d.description ?? null}, ${d.format}, ${d.teamFormation},
        ${d.startsAt ?? null}, ${d.endsAt ?? null}, ${d.venueId ?? null},
        ${d.matchDurationMinutes}, ${d.matchWinGoalDiff}, ${d.canCaptainEditRules},
        ${d.pointsWin}, ${d.pointsDraw}, ${d.pointsLoss},
        ${user.id}
      )
      RETURNING *
    `;

    logger.info({ championshipId: row.id, groupId, userId: user.id }, "Championship created");
    return NextResponse.json({ championship: rowToChampionship(row) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error creating championship");
    return NextResponse.json({ error: "Erro ao criar campeonato" }, { status: 500 });
  }
}
