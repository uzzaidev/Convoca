import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { handleRouteError } from "@/lib/route-errors";
import logger from "@/lib/logger";

const createSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().max(200).optional(),
});

// GET /api/agent/conversations?groupId=xxx
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const groupId = req.nextUrl.searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "groupId é obrigatório" }, { status: 400 });
    }

    const conversations = await sql`
      SELECT id, group_id, title, created_at, updated_at
      FROM agent_conversations
      WHERE user_id = ${user.id}
        AND group_id = ${groupId}
        AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ conversations });
  } catch (err) {
    return handleRouteError(err, {
      logMessage: "agent/conversations GET: erro",
      fallbackMessage: "Erro ao listar conversas",
    });
  }
}

// POST /api/agent/conversations
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = createSchema.parse(await req.json());

    const [row] = await sql<{ id: string }[]>`
      INSERT INTO agent_conversations (user_id, group_id, title)
      VALUES (${user.id}, ${body.groupId}, ${body.title ?? null})
      RETURNING id, group_id, title, created_at
    `;

    logger.info(
      { userId: user.id, groupId: body.groupId, conversationId: row.id },
      "Nova conversa com agente criada"
    );

    return NextResponse.json({ conversation: row }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, {
      logMessage: "agent/conversations POST: erro",
      fallbackMessage: "Erro ao criar conversa",
    });
  }
}

// DELETE /api/agent/conversations?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    await sql`
      UPDATE agent_conversations
      SET deleted_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err, {
      logMessage: "agent/conversations DELETE: erro",
      fallbackMessage: "Erro ao apagar conversa",
    });
  }
}
