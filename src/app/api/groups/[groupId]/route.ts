import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string }>;

// GET /api/groups/:groupId - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Check if user is member
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    const [group] = await sql`
      SELECT * FROM groups WHERE id = ${groupId}
    `;

    if (!group) {
      return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    }

    // Get members
    const members = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        gm.role,
        gm.is_goalkeeper,
        gm.base_rating,
        gm.joined_at
      FROM group_members gm
      INNER JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ${groupId}
      ORDER BY gm.joined_at ASC
    `;

    // Get upcoming events
    const events = await sql`
      SELECT
        id,
        starts_at,
        status,
        max_players,
        (SELECT COUNT(*) FROM event_attendance WHERE event_id = events.id AND status = 'yes') as confirmed_count
      FROM events
      WHERE group_id = ${groupId} AND starts_at > NOW()
      ORDER BY starts_at ASC
      LIMIT 5
    `;

    return NextResponse.json({
      group: {
        ...group,
        userRole: membership.role,
        members,
        upcomingEvents: events,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error fetching group details");
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do grupo" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/:groupId - Update group
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Check if user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem atualizar o grupo" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, privacy } = body;

    const [updated] = await sql`
      UPDATE groups
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        privacy = COALESCE(${privacy}, privacy),
        updated_at = NOW()
      WHERE id = ${groupId}
      RETURNING *
    `;

    logger.info({ groupId, userId: user.id }, "Group updated");

    return NextResponse.json({ group: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error updating group");
    return NextResponse.json(
      { error: "Erro ao atualizar grupo" },
      { status: 500 }
    );
  }
}
