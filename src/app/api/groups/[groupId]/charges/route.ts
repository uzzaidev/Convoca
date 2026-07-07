import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { createChargeSchema } from "@/lib/validations-charges";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string }>;

// GET /api/groups/:groupId/charges - List all charges for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { groupId } = await params;

  try {
    const user = await requireAuth();

    const groupAccess = await requireGroupAccess(groupId, user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    // Membros comuns só podem consultar suas próprias cobranças
    if (userId && userId !== user.id && groupAccess.userRole !== "admin" && !groupAccess.isSystemAdmin) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    let charges;

    if (userId) {
      if (status && ["pending", "paid", "canceled"].includes(status)) {
        charges = await sql`
          SELECT
            c.id,
            c.group_id,
            c.type,
            c.amount_cents,
            c.due_date,
            c.status,
            c.event_id,
            c.created_at,
            c.updated_at,
            u.id as user_id,
            u.name as user_name,
            u.image as user_image,
            g.name as event_name,
            e.starts_at as event_date
          FROM charges c
          INNER JOIN users u ON c.user_id = u.id
          LEFT JOIN events e ON c.event_id = e.id
          LEFT JOIN groups g ON e.group_id = g.id
          WHERE c.group_id = ${groupId} AND c.status = ${status} AND c.user_id = ${userId}
          ORDER BY
            CASE WHEN c.due_date IS NULL THEN 1 ELSE 0 END,
            c.due_date DESC,
            c.created_at DESC
        `;
      } else {
        charges = await sql`
          SELECT
            c.id,
            c.group_id,
            c.type,
            c.amount_cents,
            c.due_date,
            c.status,
            c.event_id,
            c.created_at,
            c.updated_at,
            u.id as user_id,
            u.name as user_name,
            u.image as user_image,
            g.name as event_name,
            e.starts_at as event_date
          FROM charges c
          INNER JOIN users u ON c.user_id = u.id
          LEFT JOIN events e ON c.event_id = e.id
          LEFT JOIN groups g ON e.group_id = g.id
          WHERE c.group_id = ${groupId} AND c.user_id = ${userId}
          ORDER BY
            CASE WHEN c.due_date IS NULL THEN 1 ELSE 0 END,
            c.due_date DESC,
            c.created_at DESC
        `;
      }
    } else if (status && ["pending", "paid", "canceled"].includes(status)) {
      charges = await sql`
        SELECT
          c.id,
          c.group_id,
          c.type,
          c.amount_cents,
          c.due_date,
          c.status,
          c.event_id,
          c.created_at,
          c.updated_at,
          u.id as user_id,
          u.name as user_name,
          u.image as user_image,
          g.name as event_name,
          e.starts_at as event_date
        FROM charges c
        INNER JOIN users u ON c.user_id = u.id
        LEFT JOIN events e ON c.event_id = e.id
        LEFT JOIN groups g ON e.group_id = g.id
        WHERE c.group_id = ${groupId} AND c.status = ${status}
        ORDER BY
          CASE WHEN c.due_date IS NULL THEN 1 ELSE 0 END,
          c.due_date DESC,
          c.created_at DESC
      `;
    } else {
      charges = await sql`
        SELECT
          c.id,
          c.group_id,
          c.type,
          c.amount_cents,
          c.due_date,
          c.status,
          c.event_id,
          c.created_at,
          c.updated_at,
          u.id as user_id,
          u.name as user_name,
          u.image as user_image,
          g.name as event_name,
          e.starts_at as event_date
        FROM charges c
        INNER JOIN users u ON c.user_id = u.id
        LEFT JOIN events e ON c.event_id = e.id
        LEFT JOIN groups g ON e.group_id = g.id
        WHERE c.group_id = ${groupId}
        ORDER BY
          CASE WHEN c.due_date IS NULL THEN 1 ELSE 0 END,
          c.due_date DESC,
          c.created_at DESC
      `;
    }

    return NextResponse.json({ charges });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: `Error fetching charges for group ${groupId}`,
      fallbackMessage: "Erro ao buscar cobranÃ§as",
    });
  }
}

// POST /api/groups/:groupId/charges - Create a new charge (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar cobranÃ§as",
    });

    const body = await request.json();
    const validation = createChargeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, type, amountCents, dueDate, eventId } = validation.data;

    const [targetMember] = await sql`
      SELECT user_id FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `;

    if (!targetMember) {
      return NextResponse.json(
        { error: "UsuÃ¡rio nÃ£o Ã© membro deste grupo" },
        { status: 400 }
      );
    }

    const [charge] = await sql`
      INSERT INTO charges (group_id, user_id, type, amount_cents, due_date, status, event_id)
      VALUES (${groupId}, ${userId}, ${type}, ${amountCents}, ${dueDate || null}, 'pending', ${eventId || null})
      RETURNING *
    `;

    logger.info(
      { groupId, chargeId: charge.id, userId, createdBy: user.id },
      "Charge created"
    );

    const [userInfo] = await sql`
      SELECT id, name, image FROM users WHERE id = ${userId}
    `;

    return NextResponse.json({
      message: "CobranÃ§a criada com sucesso",
      charge: {
        ...charge,
        user_id: userInfo.id,
        user_name: userInfo.name,
        user_image: userInfo.image,
      },
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error creating charge",
      fallbackMessage: "Erro ao criar cobranÃ§a",
    });
  }
}
