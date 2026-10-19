import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { getStripe } from "@/lib/stripe";

type Params = Promise<{ groupId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();
    const context = await requireGroupAccess(groupId, user, { requireActiveGroup: false });

    const [group] = await sql`
      SELECT * FROM groups WHERE id = ${groupId} AND deleted_at IS NULL
    `;

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

    const events = context.status === "active" || context.isSystemAdmin
      ? await sql`
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
        `
      : [];

    return NextResponse.json({
      group: {
        ...group,
        userRole: context.userRole,
        status: context.status,
        statusReason: context.statusReason,
        isSystemAdmin: context.isSystemAdmin,
        members,
        upcomingEvents: events,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error(error, "Error fetching group details");
    return NextResponse.json({ error: "Erro ao buscar detalhes do grupo" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem excluir o grupo",
      requireActiveGroup: false,
    });

    const [group] = await sql`
      SELECT id, name FROM groups WHERE id = ${groupId} AND deleted_at IS NULL
    `;
    if (!group) {
      return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    }

    // Cancelar quaisquer assinaturas ativas deste grupo no Stripe antes de excluir
    const activeSubs = await sql`
      SELECT id, stripe_subscription_id
      FROM group_subscriptions
      WHERE group_id = ${groupId}
        AND status NOT IN ('canceled', 'incomplete_expired')
    `;

    for (const sub of activeSubs) {
      if (sub.stripe_subscription_id) {
        try {
          await getStripe().subscriptions.cancel(sub.stripe_subscription_id as string);
        } catch (stripeErr) {
          logger.warn(
            { stripeErr, groupId, stripeSubscriptionId: sub.stripe_subscription_id },
            "Failed to cancel Stripe subscription during group deletion"
          );
        }
      }
      await sql`
        UPDATE group_subscriptions
        SET status = 'canceled',
            canceled_at = NOW(),
            grace_until = NULL,
            updated_at = NOW()
        WHERE id = ${sub.id}
      `;
    }

    await sql`
      UPDATE groups
      SET deleted_at = NOW(),
          status = 'inactive',
          status_reason = 'Grupo excluído pelo administrador',
          status_updated_at = NOW(),
          updated_at = NOW()
      WHERE id = ${groupId} AND deleted_at IS NULL
    `;

    logger.info({ groupId, userId: user.id, canceledSubscriptions: activeSubs.length }, "Group soft-deleted and subscriptions canceled");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error(error, "Error deleting group");
    return NextResponse.json({ error: "Erro ao excluir grupo" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem atualizar o grupo",
    });

    const body = await request.json();
    const { name, description, privacy, appMode } = body;

    if (appMode !== undefined && !["ranking", "control"].includes(appMode)) {
      return NextResponse.json({ error: "Modo do grupo invalido" }, { status: 400 });
    }

    const [updated] = await sql`
      UPDATE groups
      SET
        name = COALESCE(${name ?? null}, name),
        description = COALESCE(${description ?? null}, description),
        privacy = COALESCE(${privacy ?? null}, privacy),
        app_mode = COALESCE(${appMode ?? null}, app_mode),
        updated_at = NOW()
      WHERE id = ${groupId}
      RETURNING *
    `;

    logger.info({ groupId, userId: user.id }, "Group updated");

    return NextResponse.json({ group: updated });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error(error, "Error updating group");
    return NextResponse.json({ error: "Erro ao atualizar grupo" }, { status: 500 });
  }
}
