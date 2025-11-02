import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

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

// Smart team draw algorithm that considers positions, ratings, and configuration
function drawTeams(players: Player[], numTeams: number = 2, config?: DrawConfig) {
  // If no config provided, use simple balanced distribution
  if (!config) {
    console.log('No draw config found, using simple balanced distribution for', players.length, 'players in', numTeams, 'teams');
    const sortedPlayers = [...players].sort((a, b) => (b.base_rating || 0) - (a.base_rating || 0));
    const teams = Array.from({ length: numTeams }, () => [] as PlayerWithAssignedPosition[]);

    sortedPlayers.forEach((player, index) => {
      const teamIndex = index % numTeams;
      // Assign position based on player preference or default
      const assignedPosition = player.preferred_position || player.role || 'noPreference';
      teams[teamIndex].push({ ...player, assigned_position: assignedPosition });
    });

    console.log('Balanced distribution result:', teams.map((team, i) => `Team ${i}: ${team.length} players`));
    return teams;
  }

  console.log('Using position-first distribution with config');

  // Create teams structure with position tracking
  const teams: { players: PlayerWithAssignedPosition[], positionCounts: Record<string, number> }[] = Array.from(
    { length: numTeams },
    () => ({ players: [], positionCounts: { gk: 0, defender: 0, midfielder: 0, forward: 0 } })
  );

  // Track assigned players to ensure each player is in only one team
  const assignedPlayers = new Set<string>();

  // Positions in order of priority (GK first as it's most critical)
  const positions = ["gk", "defender", "midfielder", "forward"] as const;

  // PHASE 1: Allocate players who chose each position (prioritize by rating - highest first)
  positions.forEach((position) => {
    const slotsPerTeam = config.positions[position];
    console.log(`\n=== PHASE 1: Processing ${position} (${slotsPerTeam} slots per team) ===`);

    // Get available players who chose this position (not yet assigned)
    const preferredPlayers = players.filter(p =>
      !assignedPlayers.has(p.user_id) &&
      (p.preferred_position === position || p.secondary_position === position)
    );

    // Sort by rating (highest first for phase 1)
    preferredPlayers.sort((a, b) => (b.base_rating || 0) - (a.base_rating || 0));

    console.log(`Players who chose ${position}:`, preferredPlayers.map(p => `${p.name}(${p.base_rating})`));

    // Assign players to position slots across teams (round-robin for balance)
    let playerIndex = 0;
    for (let slot = 0; slot < slotsPerTeam; slot++) {
      for (let teamIndex = 0; teamIndex < numTeams && playerIndex < preferredPlayers.length; teamIndex++) {
        const player = preferredPlayers[playerIndex++];
        if (player && !assignedPlayers.has(player.user_id)) {
          teams[teamIndex].players.push({ ...player, assigned_position: position });
          teams[teamIndex].positionCounts[position]++;
          assignedPlayers.add(player.user_id);
          console.log(`✓ Assigned ${player.name} to Team ${teamIndex} as ${position} (Phase 1)`);
        }
      }
    }
  });

  // PHASE 2: Fill unfilled position slots with remaining players (prioritize by rating - lowest first)
  console.log('\n=== PHASE 2: Filling unfilled position slots ===');

  positions.forEach((position) => {
    const slotsPerTeam = config.positions[position];

    // Check each team for unfilled slots
    teams.forEach((team, teamIndex) => {
      const currentCount = team.positionCounts[position];
      const slotsNeeded = slotsPerTeam - currentCount;

      if (slotsNeeded > 0) {
        console.log(`Team ${teamIndex} needs ${slotsNeeded} more ${position}(s)`);

        // Get remaining unassigned players (sorted by lowest rating first)
        const remainingPlayers = players
          .filter(p => !assignedPlayers.has(p.user_id))
          .sort((a, b) => (a.base_rating || 0) - (b.base_rating || 0));

        // Fill the needed slots
        for (let i = 0; i < slotsNeeded && remainingPlayers.length > 0; i++) {
          const player = remainingPlayers.shift();
          if (player) {
            team.players.push({ ...player, assigned_position: position });
            team.positionCounts[position]++;
            assignedPlayers.add(player.user_id);
            console.log(`⚠ Assigned ${player.name} to Team ${teamIndex} as ${position} (Phase 2 - forced)`);
          }
        }
      }
    });
  });

  // PHASE 3: Add remaining players as reserves (highest rating first for fair distribution)
  const remainingPlayers = players
    .filter(p => !assignedPlayers.has(p.user_id))
    .sort((a, b) => (b.base_rating || 0) - (a.base_rating || 0));

  console.log(`\n=== PHASE 3: Adding ${remainingPlayers.length} reserves ===`);

  const maxPlayersPerTeam = config.playersPerTeam + config.reservesPerTeam;
  let playerIndex = 0;

  // Fill reserves round-robin until teams are full or no more players
  while (playerIndex < remainingPlayers.length) {
    let assignedInThisRound = false;

    for (let teamIndex = 0; teamIndex < numTeams && playerIndex < remainingPlayers.length; teamIndex++) {
      if (teams[teamIndex].players.length < maxPlayersPerTeam) {
        const player = remainingPlayers[playerIndex++];
        if (player && !assignedPlayers.has(player.user_id)) {
          // Reserves keep their preferred position or default to 'noPreference'
          const assignedPosition = player.preferred_position || player.role || 'noPreference';
          teams[teamIndex].players.push({ ...player, assigned_position: assignedPosition });
          assignedPlayers.add(player.user_id);
          console.log(`+ Assigned ${player.name} to Team ${teamIndex} as reserve`);
          assignedInThisRound = true;
        }
      }
    }

    // If no assignments were made in this round, break to avoid infinite loop
    if (!assignedInThisRound) break;
  }

  // Log final team compositions
  console.log('\n=== FINAL TEAMS ===');
  teams.forEach((team, i) => {
    console.log(`Team ${i}: ${team.players.length} players`);
    console.log(`  Positions: GK:${team.positionCounts.gk}, DEF:${team.positionCounts.defender}, MID:${team.positionCounts.midfielder}, FWD:${team.positionCounts.forward}`);
    console.log(`  Total Rating: ${team.players.reduce((sum, p) => sum + (p.base_rating || 0), 0)}`);
  });

  // Return just the player arrays (maintain backward compatibility)
  return teams.map(team => team.players);
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

    // Get event
    const [event] = await sql`
      SELECT * FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Check if user is admin of the group
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem sortear times" },
        { status: 403 }
      );
    }

    // Get confirmed players
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
      WHERE ea.event_id = ${eventId} AND ea.status = 'yes'
    `;

    const confirmedPlayers = confirmedPlayersRaw as Player[];

    if (confirmedPlayers.length < 4) {
      return NextResponse.json(
        { error: "Necessário pelo menos 4 jogadores confirmados" },
        { status: 400 }
      );
    }

    // Delete existing teams
    await sql`
      DELETE FROM teams WHERE event_id = ${eventId}
    `;

    // Get draw configuration for the group
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

    console.log('Draw config found:', drawConfig ? 'YES' : 'NO');
    if (drawConfig) {
      console.log('Config details:', {
        playersPerTeam: drawConfig.playersPerTeam,
        reservesPerTeam: drawConfig.reservesPerTeam,
        positions: {
          gk: drawConfig.gk,
          defender: drawConfig.defender,
          midfielder: drawConfig.midfielder,
          forward: drawConfig.forward,
        }
      });
    }

    const config = drawConfig ? {
      playersPerTeam: drawConfig.playersPerTeam,
      reservesPerTeam: drawConfig.reservesPerTeam,
      positions: {
        gk: drawConfig.gk,
        defender: drawConfig.defender,
        midfielder: drawConfig.midfielder,
        forward: drawConfig.forward,
      },
    } : undefined;

    // Draw teams
    console.log('Starting team draw for event:', eventId, 'with', confirmedPlayers.length, 'players');
    console.log('Player positions:', confirmedPlayers.map(p => ({
      name: p.name,
      position: p.preferred_position || 'none'
    })));
    const drawnTeams = drawTeams(confirmedPlayers, numTeams, config);
    console.log('Teams drawn successfully:', drawnTeams?.length, 'teams created');

    const teamNames = ["Time A", "Time B", "Time C", "Time D"];

    // Validate drawn teams
    if (!drawnTeams || !Array.isArray(drawnTeams) || drawnTeams.length !== numTeams) {
      console.error('Invalid teams result:', drawnTeams);
      return NextResponse.json(
        { error: "Erro interno: times não foram criados corretamente" },
        { status: 500 }
      );
    }

    const createdTeams = [];

    for (let i = 0; i < drawnTeams.length; i++) {
      const teamPlayers = drawnTeams[i];
      console.log(`Processing team ${i} with ${teamPlayers?.length || 0} players`);

      // Validate team has players
      if (!teamPlayers || !Array.isArray(teamPlayers) || teamPlayers.length === 0) {
        console.warn(`Team ${i} has no players, skipping`);
        continue;
      }

      try {
        const [team] = await sql`
          INSERT INTO teams (event_id, name, seed)
          VALUES (${eventId}, ${teamNames[i]}, ${i})
          RETURNING *
        `;
        console.log(`Created team ${team.id} in database`);

        // Add team members with validation
        for (let k = 0; k < teamPlayers.length; k++) {
          const player = teamPlayers[k];
          if (!player || !player.user_id) {
            console.warn(`Invalid player at index ${k} in team ${i}`);
            continue;
          }

          const isStarter = k < (config?.playersPerTeam || 7);
          // Use the assigned_position from the draw algorithm
          const position = player.assigned_position || player.preferred_position || player.role || 'noPreference';

          await sql`
            INSERT INTO team_members (team_id, user_id, position, starter)
            VALUES (${team.id}, ${player.user_id}, ${position}, ${isStarter})
          `;
        }
        console.log(`Added ${teamPlayers.length} players to team ${team.id}`);

        createdTeams.push({
          ...team,
          members: teamPlayers,
        });
      } catch (teamError) {
        console.error(`Error creating team ${i}:`, teamError);
        // Continue with other teams
      }
    }

    // Ensure we have at least one team created
    if (createdTeams.length === 0) {
      console.error('No teams were created successfully');
      return NextResponse.json(
        { error: "Erro: nenhum time pôde ser criado" },
        { status: 500 }
      );
    }

    console.log('Team draw completed successfully with', createdTeams.length, 'teams');
    logger.info({ eventId, userId: user.id }, "Teams drawn");

    return NextResponse.json({ teams: createdTeams });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error drawing teams");
    return NextResponse.json(
      { error: "Erro ao sortear times" },
      { status: 500 }
    );
  }
}
