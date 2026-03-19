import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { createSeasonSchema } from "@/lib/validations";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

// GET /api/groups/[groupId]/seasons - Listar temporadas do grupo
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId } = await params;

    const membership = await sql`
      SELECT role FROM group_members
      WHERE user_id = ${user.id} AND group_id = ${groupId}
    `;

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    const seasons = await sql`
      SELECT
        s.id,
        s.name,
        s.starts_at,
        s.ends_at,
        s.status,
        s.created_at,
        u.name as created_by_name,
        (
          SELECT COUNT(DISTINCT e.id)
          FROM events e
          WHERE e.group_id = ${groupId}
            AND e.status = 'finished'
            AND e.starts_at >= s.starts_at
            AND e.starts_at <= s.ends_at
        )::int as events_count
      FROM seasons s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.group_id = ${groupId}
      ORDER BY s.starts_at DESC
    `;

    return NextResponse.json({ seasons });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error listing seasons");
    return NextResponse.json(
      { error: "Erro ao listar temporadas" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[groupId]/seasons - Criar temporada
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId } = await params;

    const membership = await sql`
      SELECT role FROM group_members
      WHERE user_id = ${user.id} AND group_id = ${groupId}
    `;

    if (membership.length === 0 || membership[0].role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar temporadas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createSeasonSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, startsAt, endsAt } = parsed.data;

    // Check for overlapping seasons
    const overlap = await sql`
      SELECT id, name FROM seasons
      WHERE group_id = ${groupId}
        AND (
          (starts_at <= ${endsAt} AND ends_at >= ${startsAt})
        )
    `;

    if (overlap.length > 0) {
      return NextResponse.json(
        { error: `As datas conflitam com a temporada "${overlap[0].name}"` },
        { status: 400 }
      );
    }

    // Determine status based on current date
    const now = new Date().toISOString();
    let status: "active" | "upcoming" | "finished" = "upcoming";
    if (startsAt <= now && endsAt >= now) {
      status = "active";
    } else if (endsAt < now) {
      status = "finished";
    }

    // Only one active season allowed
    if (status === "active") {
      const existingActive = await sql`
        SELECT id FROM seasons
        WHERE group_id = ${groupId} AND status = 'active'
      `;
      if (existingActive.length > 0) {
        return NextResponse.json(
          { error: "Já existe uma temporada ativa neste grupo" },
          { status: 400 }
        );
      }
    }

    const [season] = await sql`
      INSERT INTO seasons (group_id, name, starts_at, ends_at, status, created_by)
      VALUES (${groupId}, ${name}, ${startsAt}, ${endsAt}, ${status}, ${user.id})
      RETURNING id, name, starts_at, ends_at, status, created_at
    `;

    logger.info({ userId: user.id, groupId, seasonId: season.id }, "Season created");

    return NextResponse.json({ season }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error creating season");
    return NextResponse.json(
      { error: "Erro ao criar temporada" },
      { status: 500 }
    );
  }
}
