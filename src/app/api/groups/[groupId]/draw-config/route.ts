import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

type Params = Promise<{ groupId: string }>;

type DrawConfig = {
  playersPerTeam: number;
  reservesPerTeam: number;
  positions: {
    gk: number;
    defender: number;
    midfielder: number;
    forward: number;
  };
};

// GET /api/groups/:groupId/draw-config - Get draw configuration for group
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

    // Get draw config
    const [config] = await sql`
      SELECT
        players_per_team as "playersPerTeam",
        reserves_per_team as "reservesPerTeam",
        gk_count as "gk",
        defender_count as "defender",
        midfielder_count as "midfielder",
        forward_count as "forward"
      FROM draw_configs
      WHERE group_id = ${groupId}
    `;

    if (config) {
      return NextResponse.json({
        config: {
          playersPerTeam: config.playersPerTeam,
          reservesPerTeam: config.reservesPerTeam,
          positions: {
            gk: config.gk,
            defender: config.defender,
            midfielder: config.midfielder,
            forward: config.forward,
          },
        },
      });
    } else {
      // Return default config
      return NextResponse.json({
        config: {
          playersPerTeam: 7,
          reservesPerTeam: 2,
          positions: {
            gk: 1,
            defender: 2,
            midfielder: 2,
            forward: 2,
          },
        },
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error getting draw config");
    return NextResponse.json(
      { error: "Erro ao buscar configuração" },
      { status: 500 }
    );
  }
}

// POST /api/groups/:groupId/draw-config - Save draw configuration for group
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const { config }: { config: DrawConfig } = body;

    // Validate config
    if (!config || typeof config !== "object") {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 400 });
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

    // Upsert draw config
    await sql`
      INSERT INTO draw_configs (
        group_id,
        players_per_team,
        reserves_per_team,
        gk_count,
        defender_count,
        midfielder_count,
        forward_count,
        created_by,
        updated_at
      ) VALUES (
        ${groupId},
        ${config.playersPerTeam},
        ${config.reservesPerTeam},
        ${config.positions.gk},
        ${config.positions.defender},
        ${config.positions.midfielder},
        ${config.positions.forward},
        ${user.id},
        NOW()
      )
      ON CONFLICT (group_id)
      DO UPDATE SET
        players_per_team = EXCLUDED.players_per_team,
        reserves_per_team = EXCLUDED.reserves_per_team,
        gk_count = EXCLUDED.gk_count,
        defender_count = EXCLUDED.defender_count,
        midfielder_count = EXCLUDED.midfielder_count,
        forward_count = EXCLUDED.forward_count,
        updated_at = NOW()
    `;

    logger.info({ groupId, userId: user.id }, "Draw config updated");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error saving draw config");
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 }
    );
  }
}