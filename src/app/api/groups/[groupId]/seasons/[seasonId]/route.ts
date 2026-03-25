import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { updateSeasonSchema } from "@/lib/validations";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type RouteParams = {
  params: Promise<{ groupId: string; seasonId: string }>;
};

// GET /api/groups/[groupId]/seasons/[seasonId] - Detalhes da temporada
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId, seasonId } = await params;

    await requireGroupAccess(groupId, user);

    const [season] = await sql`
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
      WHERE s.id = ${seasonId} AND s.group_id = ${groupId}
    `;

    if (!season) {
      return NextResponse.json(
        { error: "Temporada nÃ£o encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ season });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error fetching season",
      fallbackMessage: "Erro ao buscar temporada",
    });
  }
}

// PATCH /api/groups/[groupId]/seasons/[seasonId] - Atualizar temporada
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId, seasonId } = await params;

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas administradores podem editar temporadas",
    });

    const [existing] = await sql`
      SELECT id, status, starts_at, ends_at FROM seasons
      WHERE id = ${seasonId} AND group_id = ${groupId}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: "Temporada nÃ£o encontrada" },
        { status: 404 }
      );
    }

    if (existing.status === "finished") {
      return NextResponse.json(
        { error: "NÃ£o Ã© possÃ­vel editar uma temporada finalizada" },
        { status: 400 }
      );
    }

    const originalStartsAt = existing.starts_at;
    const originalEndsAt = existing.ends_at;

    const body = await request.json();
    const parsed = updateSeasonSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    const hasUpdates = updates.name !== undefined || updates.startsAt !== undefined || updates.endsAt !== undefined;
    if (!hasUpdates) {
      return NextResponse.json(
        { error: "Nenhum campo para atualizar" },
        { status: 400 }
      );
    }

    const [updated] = await sql`
      UPDATE seasons
      SET
        name = COALESCE(${updates.name ?? null}, name),
        starts_at = COALESCE(${updates.startsAt ?? null}, starts_at),
        ends_at = COALESCE(${updates.endsAt ?? null}, ends_at)
      WHERE id = ${seasonId} AND group_id = ${groupId}
      RETURNING id, name, starts_at, ends_at, status, created_at
    `;

    if (updates.startsAt || updates.endsAt) {
      const overlap = await sql`
        SELECT id, name FROM seasons
        WHERE group_id = ${groupId}
          AND id != ${seasonId}
          AND (
            (starts_at <= ${updated.ends_at} AND ends_at >= ${updated.starts_at})
          )
      `;

      if (overlap.length > 0) {
        await sql`
          UPDATE seasons
          SET starts_at = ${originalStartsAt}, ends_at = ${originalEndsAt}
          WHERE id = ${seasonId}
        `;
        return NextResponse.json(
          { error: `As datas conflitam com a temporada "${overlap[0].name}"` },
          { status: 400 }
        );
      }
    }

    logger.info({ userId: user.id, groupId, seasonId }, "Season updated");

    return NextResponse.json({ season: updated });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error updating season",
      fallbackMessage: "Erro ao atualizar temporada",
    });
  }
}

// DELETE /api/groups/[groupId]/seasons/[seasonId] - Excluir temporada
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { groupId, seasonId } = await params;

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas administradores podem excluir temporadas",
    });

    const [existing] = await sql`
      SELECT id, status FROM seasons
      WHERE id = ${seasonId} AND group_id = ${groupId}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: "Temporada nÃ£o encontrada" },
        { status: 404 }
      );
    }

    await sql`DELETE FROM season_snapshots WHERE season_id = ${seasonId}`;
    await sql`DELETE FROM seasons WHERE id = ${seasonId} AND group_id = ${groupId}`;

    logger.info({ userId: user.id, groupId, seasonId }, "Season deleted");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error deleting season",
      fallbackMessage: "Erro ao excluir temporada",
    });
  }
}
