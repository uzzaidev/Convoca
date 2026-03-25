import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import logger from "@/lib/logger";
import { sql } from "@/db/client";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

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

    await requireGroupAccess(groupId, user);

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
    }

    return NextResponse.json({
      settings: {
        minPlayers: 4,
        maxPlayers: 22,
        maxWaitlist: 10,
      },
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error getting event settings",
      fallbackMessage: "Erro ao buscar configuraÃ§Ãµes",
    });
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

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "ConfiguraÃ§Ãµes invÃ¡lidas" }, { status: 400 });
    }

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem alterar configuraÃ§Ãµes",
    });

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
    return handleRouteError(error, {
      logMessage: "Error saving event settings",
      fallbackMessage: "Erro ao salvar configuraÃ§Ãµes",
    });
  }
}
