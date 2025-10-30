import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";

type Params = Promise<{ eventId: string }>;

// Schema for manual team creation
const manualTeamsSchema = z.object({
  teams: z.array(
    z.object({
      name: z.string().min(1, "Nome do time é obrigatório"),
      members: z.array(
        z.object({
          userId: z.string().uuid(),
          position: z.enum(["gk", "defender", "midfielder", "forward", "line"]),
        })
      ),
    })
  ).min(2, "Pelo menos 2 times são necessários"),
});

// POST /api/events/:eventId/teams - Create teams manually
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = manualTeamsSchema.parse(body);

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
        { error: "Apenas admins podem criar times" },
        { status: 403 }
      );
    }

    // Delete existing teams
    await sql`
      DELETE FROM teams WHERE event_id = ${eventId}
    `;

    // Create teams
    const createdTeams = [];

    for (let i = 0; i < validatedData.teams.length; i++) {
      const teamData = validatedData.teams[i];
      
      const [team] = await sql`
        INSERT INTO teams (event_id, name, seed)
        VALUES (${eventId}, ${teamData.name}, ${i})
        RETURNING *
      `;

      // Add team members
      for (const member of teamData.members) {
        await sql`
          INSERT INTO team_members (team_id, user_id, position, starter)
          VALUES (${team.id}, ${member.userId}, ${member.position}, true)
        `;
      }

      createdTeams.push({
        ...team,
        members: teamData.members,
      });
    }

    logger.info({ eventId, userId: user.id }, "Manual teams created");

    return NextResponse.json({ teams: createdTeams });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    logger.error(error, "Error creating manual teams");
    return NextResponse.json(
      { error: "Erro ao criar times" },
      { status: 500 }
    );
  }
}

// GET /api/events/:eventId/teams - Get teams for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const user = await requireAuth();

    // Get event to check group membership
    const [event] = await sql`
      SELECT * FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Check if user is a member of the group
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    // Get teams with members
    const teams = await sql`
      SELECT
        t.id,
        t.name,
        t.seed,
        t.is_winner,
        json_agg(
          json_build_object(
            'userId', u.id,
            'userName', u.name,
            'userImage', u.image,
            'position', tm.position,
            'starter', tm.starter
          ) ORDER BY tm.position DESC, tm.starter DESC
        ) FILTER (WHERE u.id IS NOT NULL) as members
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE t.event_id = ${eventId}
      GROUP BY t.id, t.name, t.seed, t.is_winner
      ORDER BY t.seed ASC
    `;

    return NextResponse.json({ teams });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching teams");
    return NextResponse.json(
      { error: "Erro ao buscar times" },
      { status: 500 }
    );
  }
}
