import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

const pushTokenSchema = z.object({
  token: z.string().min(16).max(4096),
  platform: z.enum(["android", "ios"]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validation = pushTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { token, platform } = validation.data;

    await sql`
      INSERT INTO push_tokens (user_id, token, platform)
      VALUES (${user.id}, ${token}, ${platform})
      ON CONFLICT (token)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    logger.error(error, "Error saving mobile push token");
    return NextResponse.json({ error: "Erro ao salvar token push" }, { status: 500 });
  }
}
