import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { handleRouteError } from "@/lib/route-errors";

// GET /api/agent/conversations/[id]/messages?cursor=&limit=
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verificar que a conversa pertence ao usuário
    const [conv] = await sql<{ id: string }[]>`
      SELECT id FROM agent_conversations
      WHERE id = ${id} AND user_id = ${user.id} AND deleted_at IS NULL
    `;

    if (!conv) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10),
      100
    );

    let messages;
    if (cursor) {
      messages = await sql`
        SELECT id, role, content, metadata, response_id, created_at
        FROM agent_messages
        WHERE conversation_id = ${id}
          AND created_at < (SELECT created_at FROM agent_messages WHERE id = ${cursor})
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      messages = await sql`
        SELECT id, role, content, metadata, response_id, created_at
        FROM agent_messages
        WHERE conversation_id = ${id}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    const reversed = [...messages].reverse();
    const nextCursor =
      messages.length === limit ? reversed[0]?.id ?? null : null;

    return NextResponse.json({
      messages: reversed,
      nextCursor,
    });
  } catch (err) {
    return handleRouteError(err, {
      logMessage: "agent/conversations/[id]/messages GET: erro",
      fallbackMessage: "Erro ao buscar mensagens",
    });
  }
}
