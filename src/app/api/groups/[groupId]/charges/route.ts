import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { createChargeSchema } from "@/lib/validations-charges";

type Params = Promise<{ groupId: string }>;

// GET /api/groups/:groupId/charges - List all charges for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Check if user is member of the group
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

    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, paid, canceled
    const userId = searchParams.get("userId"); // filter by user

    // Build query with filters
    let charges;
    
    if (userId) {
      // Filter by both status (if provided) and userId
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
      // Filter by status only
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
      // No filters, get all charges
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
    logger.error({ error, groupId: (await params).groupId }, "Error fetching charges");
    
    // Check if error is due to missing event_id column
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('event_id') || errorMessage.includes('column')) {
      logger.warn("Possible missing event_id column, trying query without it");
      
      // Fallback query without event_id
      try {
        const { groupId } = await params;
        const charges = await sql`
          SELECT
            c.id,
            c.group_id,
            c.type,
            c.amount_cents,
            c.due_date,
            c.status,
            c.created_at,
            c.updated_at,
            u.id as user_id,
            u.name as user_name,
            u.image as user_image,
            NULL as event_name,
            NULL as event_date
          FROM charges c
          INNER JOIN users u ON c.user_id = u.id
          WHERE c.group_id = ${groupId}
          ORDER BY
            CASE WHEN c.due_date IS NULL THEN 1 ELSE 0 END,
            c.due_date DESC,
            c.created_at DESC
        `;

        return NextResponse.json({ charges });
      } catch (fallbackError) {
        logger.error({ fallbackError }, "Fallback query also failed");
      }
    }
    
    return NextResponse.json(
      { error: "Erro ao buscar cobranças" },
      { status: 500 }
    );
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

    // Check if current user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem criar cobranças" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createChargeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, type, amountCents, dueDate, eventId } = validation.data;

    // Check if target user is a member of the group
    const [targetMember] = await sql`
      SELECT user_id FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `;

    if (!targetMember) {
      return NextResponse.json(
        { error: "Usuário não é membro deste grupo" },
        { status: 400 }
      );
    }

    // Create charge
    const [charge] = await sql`
      INSERT INTO charges (group_id, user_id, type, amount_cents, due_date, status, event_id)
      VALUES (${groupId}, ${userId}, ${type}, ${amountCents}, ${dueDate || null}, 'pending', ${eventId || null})
      RETURNING *
    `;

    logger.info(
      { groupId, chargeId: charge.id, userId, createdBy: user.id },
      "Charge created"
    );

    // Get user info
    const [userInfo] = await sql`
      SELECT id, name, image FROM users WHERE id = ${userId}
    `;

    return NextResponse.json({
      message: "Cobrança criada com sucesso",
      charge: {
        ...charge,
        user_id: userInfo.id,
        user_name: userInfo.name,
        user_image: userInfo.image,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error creating charge");
    return NextResponse.json(
      { error: "Erro ao criar cobrança" },
      { status: 500 }
    );
  }
}
