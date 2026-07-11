import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { generateRoundRobin } from "@/lib/round-robin";

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

    // Load real teams (no byes)
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

    // Optional: caller can provide per-round scheduled times
    const body = await request.json().catch(() => ({}));
    const roundSchedules: Record<number, string> = {};
    if (Array.isArray(body.roundSchedules)) {
      for (const rs of body.roundSchedules) {
        if (rs.roundNumber && rs.scheduledAt) {
          roundSchedules[rs.roundNumber] = rs.scheduledAt;
        }
      }
    }

    // Base date for auto-scheduling: championship.starts_at or 7 days from now
    const baseDate = champ.starts_at
      ? new Date(champ.starts_at)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const defaultTime = body.defaultEventStartTime ?? "20:00";
    const [hour, minute] = defaultTime.split(":").map(Number);

    const teamIds = (teams as unknown as { id: string }[]).map(t => t.id);
    const rounds = generateRoundRobin(teamIds);

    // Add virtual bye team to DB if N is odd (for tracking; not shown in standings)
    const needsBye = teams.length % 2 !== 0;
    let byeTeamId: string | null = null;
    if (needsBye) {
      const [byeTeam] = await sql`
        INSERT INTO championship_teams (championship_id, name, color, is_bye)
        VALUES (${championshipId}, 'BYE', '#cccccc', TRUE)
        RETURNING id
      `;
      byeTeamId = byeTeam.id;
      teamIds.push(byeTeamId!);
    }

    // Create the single phase (group_stage) for MVP
    const [phase] = await sql`
      INSERT INTO championship_phases (championship_id, phase_type, name, "order", status)
      VALUES (${championshipId}, 'group_stage', 'Fase de Grupos', 1, 'active')
      RETURNING id
    `;

    let totalMatchesCreated = 0;

    for (let i = 0; i < rounds.length; i++) {
      const roundNumber = i + 1;

      // Scheduled time for this round
      const roundDate = roundSchedules[roundNumber]
        ? new Date(roundSchedules[roundNumber])
        : (() => {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + i * 7); // weekly spacing
            d.setHours(hour, minute, 0, 0);
            return d;
          })();

      const scheduledAt = roundDate.toISOString();

      const [round] = await sql`
        INSERT INTO championship_rounds (phase_id, round_number, scheduled_at)
        VALUES (${phase.id}, ${roundNumber}, ${scheduledAt})
        RETURNING id
      `;

      for (const { homeId, awayId } of rounds[i]) {
        // Auto-create event in group calendar (Decision 2)
        const [event] = await sql`
          INSERT INTO events (
            group_id, starts_at, venue_id, max_players,
            max_goalkeepers, waitlist_enabled, status, created_by
          ) VALUES (
            ${groupId},
            ${scheduledAt},
            ${champ.venue_id ?? null},
            ${champ.match_duration_minutes},
            0,
            FALSE,
            'scheduled',
            ${user.id}
          )
          RETURNING id
        `;

        // Create the championship match linked to the event
        const [match] = await sql`
          INSERT INTO championship_matches (round_id, home_team_id, away_team_id, event_id)
          VALUES (${round.id}, ${homeId}, ${awayId}, ${event.id})
          RETURNING id
        `;

        // Link the event back to the match
        await sql`
          UPDATE events SET championship_match_id = ${match.id} WHERE id = ${event.id}
        `;

        totalMatchesCreated++;
      }
    }

    // Activate championship
    await sql`
      UPDATE championships SET status = 'active', updated_at = NOW()
      WHERE id = ${championshipId}
    `;

    logger.info(
      { championshipId, rounds: rounds.length, matches: totalMatchesCreated, userId: user.id },
      "Championship rounds generated"
    );

    return NextResponse.json({
      success: true,
      rounds: rounds.length,
      matches: totalMatchesCreated,
    });
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
