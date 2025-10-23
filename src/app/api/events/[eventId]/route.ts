import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type Params = Promise<{ eventId: string }>;

// GET /api/events/:eventId - Get event details
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { eventId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const [event] = await sql`
      SELECT
        e.*,
        g.name as group_name,
        v.name as venue_name,
        v.address as venue_address
      FROM events e
      INNER JOIN groups g ON e.group_id = g.id
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE e.id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Check if user is member of the group
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${event.group_id} AND user_id = ${session.user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    // Get attendance list
    const attendance = await sql`
      SELECT
        ea.id,
        ea.status,
        ea.role,
        ea.checked_in_at,
        ea.order_of_arrival,
        u.id as user_id,
        u.name as user_name,
        u.image as user_image
      FROM event_attendance ea
      INNER JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = ${eventId}
      ORDER BY
        CASE ea.status
          WHEN 'yes' THEN 1
          WHEN 'waitlist' THEN 2
          WHEN 'no' THEN 3
        END,
        ea.created_at ASC
    `;

    // Get teams if draw has been made
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
        ) as members
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE t.event_id = ${eventId}
      GROUP BY t.id, t.name, t.seed, t.is_winner
      ORDER BY t.seed ASC
    `;

    return NextResponse.json({
      event: {
        ...event,
        userRole: membership.role,
        attendance,
        teams: teams.length > 0 ? teams : null,
      },
    });
  } catch (error) {
    logger.error(error, "Error fetching event details");
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do evento" },
      { status: 500 }
    );
  }
}
