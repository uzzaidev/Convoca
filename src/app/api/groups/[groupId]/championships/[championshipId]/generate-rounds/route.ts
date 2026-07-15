import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { generateRoundRobin } from "@/lib/round-robin";
import { generateSingleElimination, getWinnerSlot } from "@/lib/single-elimination";

type Params = Promise<{ groupId: string; championshipId: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId, championshipId } = await params;
    const user = await requireAuth();
    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem iniciar campeonatos",
    });

    const [champ] = await sql`
      SELECT * FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
    `;
    if (!champ) {
      return NextResponse.json({ error: "Campeonato não encontrado" }, { status: 404 });
    }
    if (champ.status !== "draft") {
      return NextResponse.json(
        { error: "Rodadas já foram geradas para este campeonato" },
        { status: 400 }
      );
    }

    const teams = await sql`
      SELECT id FROM championship_teams
      WHERE championship_id = ${championshipId} AND is_bye = FALSE
      ORDER BY seed NULLS LAST, created_at
    `;

    if (teams.length < 2) {
      return NextResponse.json(
        { error: "O campeonato precisa de ao menos 2 times para gerar rodadas" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const baseDate = champ.starts_at
      ? new Date(champ.starts_at)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const defaultTime = body.defaultEventStartTime ?? "20:00";
    const [hour, minute] = defaultTime.split(":").map(Number);

    // singleDay: todas as rodadas no mesmo dia, espaçadas por duração da partida + 15 min de intervalo
    const singleDay: boolean = body.singleDay === true;

    const teamIds = (teams as unknown as { id: string }[]).map(t => t.id);

    // ── Activate championship ──────────────────────────────────────────────────
    await sql`
      UPDATE championships SET status = 'active', updated_at = NOW()
      WHERE id = ${championshipId}
    `;

    // ── Branch by format ───────────────────────────────────────────────────────
    if (champ.format === "single_elimination") {
      return await generateElimination(
        { groupId, championshipId, userId: user.id, champ, teamIds, baseDate, hour, minute }
      );
    }

    // ── Round-robin (default) ──────────────────────────────────────────────────
    const roundSchedules: Record<number, string> = {};
    if (Array.isArray(body.roundSchedules)) {
      for (const rs of body.roundSchedules) {
        if (rs.roundNumber && rs.scheduledAt) {
          roundSchedules[rs.roundNumber] = rs.scheduledAt;
        }
      }
    }

    const rounds = generateRoundRobin(teamIds);

    const needsBye = teams.length % 2 !== 0;
    if (needsBye) {
      const [byeTeam] = await sql`
        INSERT INTO championship_teams (championship_id, name, color, is_bye)
        VALUES (${championshipId}, 'BYE', '#cccccc', TRUE)
        RETURNING id
      `;
      teamIds.push(byeTeam.id);
    }

    const [phase] = await sql`
      INSERT INTO championship_phases (championship_id, phase_type, name, "order", status)
      VALUES (${championshipId}, 'group_stage', 'Fase de Grupos', 1, 'active')
      RETURNING id
    `;

    let totalMatchesCreated = 0;

    for (let i = 0; i < rounds.length; i++) {
      const roundNumber = i + 1;

      const roundDate = roundSchedules[roundNumber]
        ? new Date(roundSchedules[roundNumber])
        : (() => {
            const d = new Date(baseDate);
            if (singleDay) {
              // Mesmo dia: espaça rodadas por duração da partida + 15 min de intervalo
              const gapMinutes = ((champ.match_duration_minutes as number) + 15) * i;
              d.setHours(hour, minute + gapMinutes, 0, 0);
            } else {
              d.setDate(d.getDate() + i * 7);
              d.setHours(hour, minute, 0, 0);
            }
            return d;
          })();

      const scheduledAt = roundDate.toISOString();

      const [round] = await sql`
        INSERT INTO championship_rounds (phase_id, round_number, scheduled_at)
        VALUES (${phase.id}, ${roundNumber}, ${scheduledAt})
        RETURNING id
      `;

      for (const { homeId, awayId } of rounds[i]) {
        const [event] = await sql`
          INSERT INTO events (
            group_id, starts_at, venue_id, max_players,
            max_goalkeepers, waitlist_enabled, status, created_by
          ) VALUES (
            ${groupId},
            ${scheduledAt},
            ${champ.venue_id ?? null},
            999,
            999,
            FALSE,
            'scheduled',
            ${user.id}
          )
          RETURNING id
        `;

        const [match] = await sql`
          INSERT INTO championship_matches (round_id, home_team_id, away_team_id, match_position, event_id)
          VALUES (${round.id}, ${homeId}, ${awayId}, ${totalMatchesCreated + 1}, ${event.id})
          RETURNING id
        `;

        await sql`UPDATE events SET championship_match_id = ${match.id} WHERE id = ${event.id}`;

        totalMatchesCreated++;
      }
    }

    logger.info(
      { championshipId, rounds: rounds.length, matches: totalMatchesCreated, userId: user.id },
      "Championship rounds generated (round-robin)"
    );

    return NextResponse.json({ success: true, rounds: rounds.length, matches: totalMatchesCreated });

  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error generating championship rounds");
    return NextResponse.json({ error: "Erro ao gerar rodadas" }, { status: 500 });
  }
}

// ── Single-elimination bracket generator ──────────────────────────────────────

async function generateElimination(ctx: {
  groupId: string;
  championshipId: string;
  userId: string;
  champ: Record<string, unknown>;
  teamIds: string[];
  baseDate: Date;
  hour: number;
  minute: number;
}) {
  const { groupId, championshipId, userId, champ, teamIds, baseDate, hour, minute } = ctx;

  const elimRounds = generateSingleElimination(teamIds);

  const [phase] = await sql`
    INSERT INTO championship_phases (championship_id, phase_type, name, "order", status)
    VALUES (${championshipId}, 'group_stage', 'Eliminatórias', 1, 'active')
    RETURNING id
  `;

  // 1. Create all round rows first to get their IDs
  const roundIdByNumber = new Map<number, string>();
  for (const r of elimRounds) {
    const roundDate = new Date(baseDate);
    roundDate.setDate(roundDate.getDate() + (r.roundNumber - 1) * 7);
    roundDate.setHours(hour, minute, 0, 0);

    const [round] = await sql`
      INSERT INTO championship_rounds (phase_id, round_number, scheduled_at, name)
      VALUES (${phase.id}, ${r.roundNumber}, ${roundDate.toISOString()}, ${r.name})
      RETURNING id
    `;
    roundIdByNumber.set(r.roundNumber, round.id);
  }

  // 2. Create TBD match slots for rounds 2+ and map position → match id
  // key: "${roundNumber}-${position}"
  const matchIdByRoundPos = new Map<string, string>();

  for (const r of elimRounds) {
    if (r.roundNumber === 1) continue;
    const roundId = roundIdByNumber.get(r.roundNumber)!;
    for (const m of r.matches) {
      const [match] = await sql`
        INSERT INTO championship_matches (round_id, home_team_id, away_team_id, match_position, status)
        VALUES (${roundId}, NULL, NULL, ${m.position}, 'scheduled')
        RETURNING id
      `;
      matchIdByRoundPos.set(`${r.roundNumber}-${m.position}`, match.id);
    }
  }

  // 3. Process round 1: create real matches and handle BYEs
  const round1 = elimRounds[0];
  const roundId1 = roundIdByNumber.get(1)!;
  let totalMatchesCreated = 0;

  const scheduledAt1 = new Date(baseDate);
  scheduledAt1.setHours(hour, minute, 0, 0);

  for (const m of round1.matches) {
    if (m.isBye) {
      // Auto-advance the non-null team directly into round 2 slot (no match created)
      const advancingTeam = m.homeId ?? m.awayId;
      if (!advancingTeam || elimRounds.length < 2) continue;

      const { nextPosition, slot } = getWinnerSlot(m.position);
      const nextMatchId = matchIdByRoundPos.get(`2-${nextPosition}`);
      if (nextMatchId) {
        if (slot === "home") {
          await sql`UPDATE championship_matches SET home_team_id = ${advancingTeam} WHERE id = ${nextMatchId}`;
        } else {
          await sql`UPDATE championship_matches SET away_team_id = ${advancingTeam} WHERE id = ${nextMatchId}`;
        }
      }
      continue;
    }

    // Real match: no linked event for elimination (teams TBD in later rounds)
    await sql`
      INSERT INTO championship_matches (round_id, home_team_id, away_team_id, match_position, status)
      VALUES (${roundId1}, ${m.homeId}, ${m.awayId}, ${m.position}, 'scheduled')
    `;
    totalMatchesCreated++;
  }

  logger.info(
    {
      championshipId,
      rounds: elimRounds.length,
      matches: totalMatchesCreated,
      userId,
    },
    "Championship rounds generated (single-elimination)"
  );

  return NextResponse.json({
    success: true,
    rounds: elimRounds.length,
    matches: totalMatchesCreated,
    format: "single_elimination",
  });
}
