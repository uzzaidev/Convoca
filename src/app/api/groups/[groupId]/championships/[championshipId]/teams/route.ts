import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { createChampionshipTeamSchema } from "@/lib/validations";

type Params = Promise<{ groupId: string; championshipId: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user);

    // Verify championship belongs to group
    const [champ] = await sql`
      SELECT id FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
    `;
    if (!champ) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }

    const teams = await sql`
      SELECT
        ct.id,
        ct.championship_id,
        ct.name,
        ct.color,
        ct.seed,
        ct.is_bye,
        ct.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',        ctp.id,
              'userId',    ctp.user_id,
              'guestName', ctp.guest_name,
              'userName',  COALESCE(u.name, ctp.guest_name),
              'userImage', u.image,
              'isCaptain', ctp.is_captain
            ) ORDER BY ctp.created_at
          ) FILTER (WHERE ctp.id IS NOT NULL),
          '[]'
        ) AS players
      FROM championship_teams ct
      LEFT JOIN championship_team_players ctp ON ctp.championship_team_id = ct.id
      LEFT JOIN users u ON u.id = ctp.user_id
      WHERE ct.championship_id = ${championshipId} AND ct.is_bye = FALSE
      GROUP BY ct.id
      ORDER BY ct.seed NULLS LAST, ct.created_at
    `;

    return NextResponse.json({ teams });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error listing championship teams");
    return NextResponse.json({ error: "Erro ao listar times" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar times",
    });

    const [champ] = await sql`
      SELECT id, status FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
    `;
    if (!champ) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }
    if (champ.status !== "draft") {
      return NextResponse.json(
        { error: "Times só podem ser criados enquanto o campeonato está em rascunho" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Support creating multiple teams at once (draw mode) or one at a time (manual)
    const isBatch = Array.isArray(body.teams);
    const teamInputs = isBatch ? body.teams : [body];

    const createdTeams = [];

    for (const input of teamInputs) {
      const parsed = createChampionshipTeamSchema.safeParse(input);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Dados inválidos", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const d = parsed.data;

      // Validate registered playerIds are members of the group
      if (d.playerIds.length > 0) {
        const memberCheck = await sql`
          SELECT user_id FROM group_members
          WHERE group_id = ${groupId} AND user_id = ANY(${d.playerIds})
        `;
        if (memberCheck.length !== d.playerIds.length) {
          return NextResponse.json(
            { error: `Todos os jogadores devem ser membros do grupo` },
            { status: 400 }
          );
        }

        // Check no registered player is already on another team in this championship
        const conflict = await sql`
          SELECT ctp.user_id, u.name
          FROM championship_team_players ctp
          JOIN championship_teams ct ON ct.id = ctp.championship_team_id
          JOIN users u ON u.id = ctp.user_id
          WHERE ct.championship_id = ${championshipId}
            AND ctp.user_id = ANY(${d.playerIds})
        `;
        if (conflict.length > 0) {
          const names = (conflict as unknown as { name: string }[]).map(r => r.name).join(", ");
          return NextResponse.json(
            { error: `Jogadores já estão em outro time: ${names}` },
            { status: 400 }
          );
        }
      }

      const [team] = await sql`
        INSERT INTO championship_teams (championship_id, name, color, seed)
        VALUES (${championshipId}, ${d.name}, ${d.color}, ${d.seed ?? null})
        RETURNING *
      `;

      for (const uid of d.playerIds) {
        await sql`
          INSERT INTO championship_team_players (championship_team_id, user_id, is_captain)
          VALUES (${team.id}, ${uid}, ${uid === (d.captainId ?? null)})
        `;
      }

      for (const guestName of d.guestNames) {
        await sql`
          INSERT INTO championship_team_players (championship_team_id, guest_name, is_captain)
          VALUES (${team.id}, ${guestName}, FALSE)
        `;
      }

      createdTeams.push(team);
    }

    logger.info(
      { championshipId, teamCount: createdTeams.length, userId: user.id },
      "Championship teams created"
    );

    return NextResponse.json(
      isBatch ? { teams: createdTeams } : { team: createdTeams[0] },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    // Trigger: player in two teams
    if (error instanceof Error && error.message.includes("já está em outro time")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error(error, "Error creating championship team");
    return NextResponse.json({ error: "Erro ao criar time" }, { status: 500 });
  }
}
