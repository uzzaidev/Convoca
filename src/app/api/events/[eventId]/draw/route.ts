import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";
import { sendPushToUser } from "@/lib/mobile/fcm";

type Params = Promise<{ eventId: string }>;

type Player = {
  user_id: string;
  role: string;
  name: string;
  base_rating: number;
  preferred_position: string | null;
  secondary_position: string | null;
};

type PlayerWithAssignedPosition = Player & {
  assigned_position: string;
};

type DrawConfig = {
  playersPerTeam: number;
  reservesPerTeam: number;
  positions: {
    gk: number;
    defender: number;
    midfielder: number;
    forward: number;
  };
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function drawTeams(players: Player[], numTeams: number = 2, config?: DrawConfig) {
  if (!config) {
    const shuffledPlayers = shuffleArray(players);
    const teams = Array.from({ length: numTeams }, () => [] as PlayerWithAssignedPosition[]);

    shuffledPlayers.forEach((player, index) => {
      const teamIndex = index % numTeams;
      const assignedPosition = player.preferred_position || player.role || "noPreference";
      teams[teamIndex].push({ ...player, assigned_position: assignedPosition });
    });

    return teams;
  }

  const teams: { players: PlayerWithAssignedPosition[]; positionCounts: Record<string, number> }[] = Array.from(
    { length: numTeams },
    () => ({ players: [], positionCounts: { gk: 0, defender: 0, midfielder: 0, forward: 0 } })
  );

  const assignedPlayers = new Set<string>();
  const positions = ["gk", "defender", "midfielder", "forward"] as const;

  positions.forEach((position) => {
    const slotsPerTeam = config.positions[position];

    const preferredPlayers = players.filter(
      (player) =>
        !assignedPlayers.has(player.user_id) &&
        (player.preferred_position === position || player.secondary_position === position)
    );

    preferredPlayers.sort((a, b) => (b.base_rating || 0) - (a.base_rating || 0));

    let playerIndex = 0;
    for (let slot = 0; slot < slotsPerTeam; slot++) {
      for (let teamIndex = 0; teamIndex < numTeams && playerIndex < preferredPlayers.length; teamIndex++) {
        const player = preferredPlayers[playerIndex++];
        if (player && !assignedPlayers.has(player.user_id)) {
          teams[teamIndex].players.push({ ...player, assigned_position: position });
          teams[teamIndex].positionCounts[position]++;
          assignedPlayers.add(player.user_id);
        }
      }
    }
  });

  positions.forEach((position) => {
    const slotsPerTeam = config.positions[position];

    teams.forEach((team) => {
      const currentCount = team.positionCounts[position];
      const slotsNeeded = slotsPerTeam - currentCount;

      if (slotsNeeded > 0) {
        const remainingPlayers = players
          .filter((player) => !assignedPlayers.has(player.user_id))
          .sort((a, b) => (a.base_rating || 0) - (b.base_rating || 0));

        for (let i = 0; i < slotsNeeded && remainingPlayers.length > 0; i++) {
          const player = remainingPlayers.shift();
          if (player) {
            team.players.push({ ...player, assigned_position: position });
            team.positionCounts[position]++;
            assignedPlayers.add(player.user_id);
          }
        }
      }
    });
  });

  const remainingPlayers = players
    .filter((player) => !assignedPlayers.has(player.user_id))
    .sort((a, b) => (b.base_rating || 0) - (a.base_rating || 0));

  const maxPlayersPerTeam = config.playersPerTeam + config.reservesPerTeam;
  let playerIndex = 0;

  while (playerIndex < remainingPlayers.length) {
    let assignedInThisRound = false;

    for (let teamIndex = 0; teamIndex < numTeams && playerIndex < remainingPlayers.length; teamIndex++) {
      if (teams[teamIndex].players.length < maxPlayersPerTeam) {
        const player = remainingPlayers[playerIndex++];
        if (player && !assignedPlayers.has(player.user_id)) {
          const assignedPosition = player.preferred_position || player.role || "noPreference";
          teams[teamIndex].players.push({ ...player, assigned_position: assignedPosition });
          assignedPlayers.add(player.user_id);
          assignedInThisRound = true;
        }
      }
    }

    if (!assignedInThisRound) {
      break;
    }
  }

  return teams.map((team) => team.players);
}

// POST /api/events/:eventId/draw - Draw teams for event
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const { numTeams = 2 } = body;

    const { event } = await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem sortear times",
    });

    if (event.status === "canceled") {
      return NextResponse.json(
        { error: "NÃ£o Ã© possÃ­vel sortear times de um evento cancelado" },
        { status: 400 }
      );
    }

    if (event.status === "finished") {
      return NextResponse.json(
        { error: "NÃ£o Ã© possÃ­vel sortear times de um evento finalizado" },
        { status: 400 }
      );
    }

    const confirmedPlayersRaw = await sql`
      SELECT
        ea.user_id,
        ea.role,
        ea.preferred_position,
        ea.secondary_position,
        u.name,
        gm.base_rating
      FROM event_attendance ea
      INNER JOIN users u ON ea.user_id = u.id
      INNER JOIN group_members gm ON ea.user_id = gm.user_id AND gm.group_id = ${event.group_id}
      WHERE ea.event_id = ${eventId}
        AND ea.status = 'yes'
    `;

    const confirmedPlayers = confirmedPlayersRaw as unknown as Player[];

    if (confirmedPlayers.length < 4) {
      return NextResponse.json(
        { error: "NecessÃ¡rio pelo menos 4 jogadores confirmados para sortear times." },
        { status: 400 }
      );
    }

    const [existingTeams] = await sql`
      SELECT id, created_at FROM teams
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (existingTeams) {
      const teamCreatedAt = new Date(existingTeams.created_at);
      const now = new Date();
      const timeDiffMs = now.getTime() - teamCreatedAt.getTime();

      if (timeDiffMs < 5000) {
        return NextResponse.json(
          { error: "Um sorteio estÃ¡ em andamento. Aguarde alguns segundos e tente novamente." },
          { status: 409 }
        );
      }
    }

    await sql`
      DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE event_id = ${eventId})
    `;
    await sql`
      DELETE FROM teams WHERE event_id = ${eventId}
    `;

    const [drawConfig] = await sql`
      SELECT
        players_per_team as "playersPerTeam",
        reserves_per_team as "reservesPerTeam",
        gk_count as "gk",
        defender_count as "defender",
        midfielder_count as "midfielder",
        forward_count as "forward"
      FROM draw_configs
      WHERE group_id = ${event.group_id}
    `;

    const config = drawConfig
      ? {
          playersPerTeam: drawConfig.playersPerTeam,
          reservesPerTeam: drawConfig.reservesPerTeam,
          positions: {
            gk: drawConfig.gk,
            defender: drawConfig.defender,
            midfielder: drawConfig.midfielder,
            forward: drawConfig.forward,
          },
        }
      : undefined;

    const drawnTeams = drawTeams(confirmedPlayers, numTeams, config);
    const teamNames = ["Time A", "Time B", "Time C", "Time D"];

    if (!drawnTeams || !Array.isArray(drawnTeams) || drawnTeams.length !== numTeams) {
      return NextResponse.json(
        { error: "Erro interno: times nÃ£o foram criados corretamente" },
        { status: 500 }
      );
    }

    const createdTeams = [];

    for (let i = 0; i < drawnTeams.length; i++) {
      const teamPlayers = drawnTeams[i];

      if (!teamPlayers || !Array.isArray(teamPlayers) || teamPlayers.length === 0) {
        continue;
      }

      const [team] = await sql`
        INSERT INTO teams (event_id, name, seed)
        VALUES (${eventId}, ${teamNames[i]}, ${i})
        RETURNING *
      `;

      for (let k = 0; k < teamPlayers.length; k++) {
        const player = teamPlayers[k];
        if (!player || !player.user_id) {
          continue;
        }

        const isStarter = k < (config?.playersPerTeam || 7);
        const position = player.assigned_position || player.preferred_position || player.role || "noPreference";

        await sql`
          INSERT INTO team_members (team_id, user_id, position, starter)
          VALUES (${team.id}, ${player.user_id}, ${position}, ${isStarter})
        `;
      }

      createdTeams.push({
        ...team,
        members: teamPlayers,
      });
    }

    if (createdTeams.length === 0) {
      return NextResponse.json(
        { error: "Erro: nenhum time pÃ´de ser criado" },
        { status: 500 }
      );
    }

    logger.info({ eventId, userId: user.id }, "Teams drawn");

    // Notifica todos os jogadores sorteados (fire-and-forget)
    void (async () => {
      try {
        const [group] = await sql`SELECT name FROM groups WHERE id = ${event.group_id}`;
        const groupName = (group as { name: string } | undefined)?.name ?? "seu grupo";
        for (const p of confirmedPlayers) {
          const alreadySent = await sql`
            SELECT 1 FROM notification_log
            WHERE type = 'teams_drawn' AND ref_id = ${eventId} AND user_id = ${p.user_id}
          `;
          if ((alreadySent as unknown[]).length > 0) continue;
          await sendPushToUser(p.user_id, {
            title: "🎲 Times sorteados!",
            body: `O sorteio foi feito em ${groupName} — veja o seu time.`,
            data: { kind: "event", eventId },
          });
          await sql`
            INSERT INTO notification_log (type, ref_id, user_id)
            VALUES ('teams_drawn', ${eventId}, ${p.user_id})
            ON CONFLICT (type, ref_id, user_id) DO NOTHING
          `;
        }
      } catch { /* ignora — não bloqueia o sorteio */ }
    })();

    return NextResponse.json({ teams: createdTeams });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error drawing teams",
      fallbackMessage: "Erro ao sortear times",
    });
  }
}
