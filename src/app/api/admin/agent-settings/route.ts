import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { handleRouteError } from "@/lib/route-errors";
import logger from "@/lib/logger";

const upsertSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
});

// GET /api/admin/agent-settings
export async function GET() {
  try {
    await requireSystemAdmin();

    const rows = await sql`
      SELECT key, value FROM agent_settings ORDER BY key
    `;

    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      settings[row.key as string] = row.value;
    }

    return NextResponse.json({ settings });
  } catch (err) {
    return handleRouteError(err, {
      logMessage: "admin/agent-settings GET: erro",
      fallbackMessage: "Erro ao listar configurações",
    });
  }
}

// PATCH /api/admin/agent-settings
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireSystemAdmin();
    const body = upsertSchema.parse(await req.json());

    await sql`
      INSERT INTO agent_settings (key, value)
      VALUES (${body.key}, ${JSON.stringify(body.value)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(body.value)}::jsonb
    `;

    logger.info(
      { adminId: admin.id, key: body.key },
      "Configuração do agente atualizada"
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err, {
      logMessage: "admin/agent-settings PATCH: erro",
      fallbackMessage: "Erro ao atualizar configuração",
    });
  }
}
