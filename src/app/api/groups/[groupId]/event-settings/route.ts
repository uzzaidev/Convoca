import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string }>;

type EventSettings = {
  minPlayers: number;
  maxPlayers: number;
  maxWaitlist: number;
};

// GET /api/groups/:groupId/event-settings - Get event settings for group
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
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Get event settings
    const [settings] = await sql`
      SELECT
        min_players as "minPlayers",
        max_players as "maxPlayers",
        max_waitlist as "maxWaitlist"
      FROM event_settings
      WHERE group_id = ${groupId}
    `;

    if (settings) {
      return NextResponse.json({
        settings: {
          minPlayers: settings.minPlayers,
          maxPlayers: settings.maxPlayers,
          maxWaitlist: settings.maxWaitlist,
        },
      });
    } else {
      // Return default settings
      return NextResponse.json({
        settings: {
          minPlayers: 4,
          maxPlayers: 22,
          maxWaitlist: 10,
        },
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error getting event settings");
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

// POST /api/groups/:groupId/event-settings - Save event settings for group
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const { settings }: { settings: EventSettings } = body;

    // Validate settings
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Configurações inválidas" }, { status: 400 });
    }

    // Check if user is admin of the group
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem alterar configurações" },
        { status: 403 }
      );
    }

    // Upsert event settings
    await sql`
      INSERT INTO event_settings (
        group_id,
        min_players,
        max_players,
        max_waitlist,
        created_by,
        updated_at
      ) VALUES (
        ${groupId},
        ${settings.minPlayers},
        ${settings.maxPlayers},
        ${settings.maxWaitlist},
        ${user.id},
        NOW()
      )
      ON CONFLICT (group_id)
      DO UPDATE SET
        min_players = EXCLUDED.min_players,
        max_players = EXCLUDED.max_players,
        max_waitlist = EXCLUDED.max_waitlist,
        updated_at = NOW()
    `;

    logger.info({ groupId, userId: user.id }, "Event settings updated");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error saving event settings");
    return NextResponse.json(
      { error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}