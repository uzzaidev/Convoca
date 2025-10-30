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

// Balanced team draw algorithm that considers positions and ratings
function drawTeams(players: Player[], numTeams: number = 2) {
  // Separate players by preferred position
  const goalkeepers = players.filter((p) => p.preferred_position === "gk");
  const defenders = players.filter((p) => p.preferred_position === "defender");
  const midfielders = players.filter((p) => p.preferred_position === "midfielder");
  const forwards = players.filter((p) => p.preferred_position === "forward");
  
  // Sort each position group by rating (descending)
  const sortByRating = (a: Player, b: Player) => b.base_rating - a.base_rating;
  goalkeepers.sort(sortByRating);
  defenders.sort(sortByRating);
  midfielders.sort(sortByRating);
  forwards.sort(sortByRating);

  // Initialize teams with total rating tracking
  const teams: { players: Player[]; totalRating: number }[] = Array.from(
    { length: numTeams },
    () => ({ players: [], totalRating: 0 })
  );

  // Helper to add player to team with lowest total rating
  const addToBalancedTeam = (player: Player) => {
    // Find team with lowest total rating
    const targetTeam = teams.reduce((min, team, idx) => {
      return team.totalRating < teams[min].totalRating ? idx : min;
    }, 0);
    
    teams[targetTeam].players.push(player);
    teams[targetTeam].totalRating += player.base_rating;
  };

  // Distribute players position by position to ensure balance
  // Distribute goalkeepers first (most important position)
  goalkeepers.forEach(addToBalancedTeam);
  
  // Then defenders, midfielders, and forwards
  defenders.forEach(addToBalancedTeam);
  midfielders.forEach(addToBalancedTeam);
  forwards.forEach(addToBalancedTeam);

  // Return just the player arrays
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

    // Draw teams
    const drawnTeams = drawTeams(confirmedPlayers, numTeams);
    const teamNames = ["Time A", "Time B", "Time C", "Time D"];

    const createdTeams = [];

    for (let i = 0; i < drawnTeams.length; i++) {
      const [team] = await sql`
        INSERT INTO teams (event_id, name, seed)
        VALUES (${eventId}, ${teamNames[i]}, ${i})
        RETURNING *
      `;

      // Add team members
      for (const player of drawnTeams[i]) {
        await sql`
          INSERT INTO team_members (team_id, user_id, position, starter)
          VALUES (${team.id}, ${player.user_id}, ${player.preferred_position || player.role}, true)
        `;
      }

      createdTeams.push({
        ...team,
        members: drawnTeams[i],
      });
    }

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
