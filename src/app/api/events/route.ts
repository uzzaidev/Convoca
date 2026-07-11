import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { createEventSchema } from "@/lib/validations";
import logger from "@/lib/logger";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { sendPushToUser } from "@/lib/mobile/fcm";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const groupId = searchParams.get("groupId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

    if (!groupId) {
      return NextResponse.json({ error: "groupId e obrigatorio" }, { status: 400 });
    }

    await requireGroupAccess(groupId, user);

    const events = status
      ? await sql`
          SELECT
            e.id,
            e.starts_at,
            e.status,
            e.max_players,
            v.name as venue_name
          FROM events e
          LEFT JOIN venues v ON e.venue_id = v.id
          WHERE e.group_id = ${groupId} AND e.status = ${status}
          ORDER BY e.starts_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT
            e.id,
            e.starts_at,
            e.status,
            e.max_players,
            v.name as venue_name
          FROM events e
          LEFT JOIN venues v ON e.venue_id = v.id
          WHERE e.group_id = ${groupId}
          ORDER BY e.starts_at DESC
          LIMIT ${limit}
        `;

    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error(error, "Error fetching events");
    return NextResponse.json({ error: "Erro ao buscar eventos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { groupId, startsAt, venueId, maxPlayers, maxGoalkeepers, waitlistEnabled, listOpensAt } =
      validation.data;

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar eventos",
    });

    const [event] = await sql`
      INSERT INTO events (
        group_id,
        starts_at,
        venue_id,
        max_players,
        max_goalkeepers,
        waitlist_enabled,
        list_opens_at,
        created_by
      )
      VALUES (
        ${groupId},
        ${startsAt},
        ${venueId || null},
        ${maxPlayers},
        ${maxGoalkeepers},
        ${waitlistEnabled},
        ${listOpensAt || null},
        ${user.id}
      )
      RETURNING *
    `;

    logger.info({ eventId: event.id, groupId, userId: user.id }, "Event created");

    // Notifica membros do grupo sobre novo evento (fire-and-forget)
    void (async () => {
      try {
        const [group] = await sql`SELECT name FROM groups WHERE id = ${groupId}`;
        const groupName = (group as { name: string } | undefined)?.name ?? "seu grupo";
        const dateStr = new Date(startsAt).toLocaleDateString("pt-BR", {
          weekday: "short", day: "2-digit", month: "short",
        });
        const members = await sql`SELECT user_id FROM group_members WHERE group_id = ${groupId}`;
        for (const m of members as unknown as { user_id: string }[]) {
          if (m.user_id === user.id) continue; // não notifica quem criou
          const alreadySent = await sql`
            SELECT 1 FROM notification_log
            WHERE type = 'event_created' AND ref_id = ${event.id} AND user_id = ${m.user_id}
          `;
          if ((alreadySent as unknown[]).length > 0) continue;
          await sendPushToUser(m.user_id, {
            title: "📅 Novo jogo criado!",
            body: `${groupName} — ${dateStr}`,
            data: { kind: "event", eventId: event.id },
          });
          await sql`
            INSERT INTO notification_log (type, ref_id, user_id)
            VALUES ('event_created', ${event.id}, ${m.user_id})
            ON CONFLICT (type, ref_id, user_id) DO NOTHING
          `;
        }
      } catch { /* ignora — não bloqueia a criação */ }
    })();

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error(error, "Error creating event");
    return NextResponse.json({ error: "Erro ao criar evento" }, { status: 500 });
  }
}
