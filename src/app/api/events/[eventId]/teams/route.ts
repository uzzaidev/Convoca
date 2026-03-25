import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";
import { requireEventAccess } from "@/lib/event-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ eventId: string }>;

const manualTeamsSchema = z.object({
  teams: z.array(
    z.object({
      name: z.string().min(1, "Nome do time Ã© obrigatÃ³rio"),
      members: z.array(
        z.object({
          userId: z.string().uuid(),
          position: z.enum(["gk", "defender", "midfielder", "forward", "line"]),
        })
      ),
    })
  ).min(2, "Pelo menos 2 times sÃ£o necessÃ¡rios"),
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

    await requireEventAccess(eventId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar times",
    });

    await sql`
      DELETE FROM teams WHERE event_id = ${eventId}
    `;

    const createdTeams = [];

    for (let i = 0; i < validatedData.teams.length; i++) {
      const teamData = validatedData.teams[i];

      const [team] = await sql`
        INSERT INTO teams (event_id, name, seed)
        VALUES (${eventId}, ${teamData.name}, ${i})
        RETURNING *
      `;

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: error.errors },
        { status: 400 }
      );
    }

    return handleRouteError(error, {
      logMessage: "Error creating manual teams",
      fallbackMessage: "Erro ao criar times",
    });
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

    await requireEventAccess(eventId, user);

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
    return handleRouteError(error, {
      logMessage: "Error fetching teams",
      fallbackMessage: "Erro ao buscar times",
    });
  }
}
