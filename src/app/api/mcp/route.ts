import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAgentSessionToken } from "@/lib/agent/session-token";
import {
  listTools,
  getTool,
  toolToMcpDefinition,
} from "@/lib/agent/tools/index";
import logger from "@/lib/logger";

// Garante que todas as tools estão registradas ao inicializar o módulo

const callSchema = z.object({
  method: z.string(),
  params: z
    .object({
      name: z.string().optional(),
      arguments: z.record(z.unknown()).optional(),
    })
    .optional(),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
});

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function mcpError(
  id: string | number | null | undefined,
  code: number,
  message: string
) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status: 200 } // MCP retorna 200 mesmo em erros de protocolo
  );
}

function mcpResult(
  id: string | number | null | undefined,
  result: unknown
) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

export async function POST(req: NextRequest) {
  // 1. Validar token de sessão
  const rawToken = extractToken(req);
  if (!rawToken) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Token de sessão ausente" } },
      { status: 401 }
    );
  }

  let sessionCtx;
  try {
    sessionCtx = await verifyAgentSessionToken(rawToken);
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Token de sessão inválido ou expirado" } },
      { status: 401 }
    );
  }

  // 2. Parsear body JSON-RPC
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return mcpError(null, -32700, "Parse error");
  }

  const parsed = callSchema.safeParse(body);
  if (!parsed.success) {
    return mcpError(null, -32600, "Invalid Request");
  }

  const { method, params, id } = parsed.data;

  // 3. Roteamento MCP
  if (method === "initialize") {
    return mcpResult(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "convoca-mcp", version: "1.0.0" },
    });
  }

  if (method === "tools/list") {
    const tools = listTools(sessionCtx.role);
    return mcpResult(id, {
      tools: tools.map(toolToMcpDefinition),
    });
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const toolArgs = (params?.arguments ?? {}) as Record<string, unknown>;

    if (!toolName) {
      return mcpError(id, -32602, "Nome da tool não informado");
    }

    const tool = getTool(toolName);

    if (!tool) {
      return mcpError(id, -32601, `Tool desconhecida: ${toolName}`);
    }

    // Verificar role mínima para a tool
    if (tool.minRole === "admin" && sessionCtx.role !== "admin") {
      logger.warn(
        { userId: sessionCtx.userId, toolName, role: sessionCtx.role },
        "Acesso negado: role insuficiente para tool"
      );
      return mcpError(id, -32603, "Permissão negada: esta tool requer papel de administrador");
    }

    // Validar input
    const inputResult = tool.inputSchema.safeParse(toolArgs);
    if (!inputResult.success) {
      return mcpError(id, -32602, `Argumentos inválidos: ${inputResult.error.message}`);
    }

    try {
      logger.info(
        {
          userId: sessionCtx.userId,
          groupId: sessionCtx.groupId,
          toolName,
        },
        "MCP: executando tool"
      );

      const result = await tool.handler(sessionCtx, inputResult.data);

      return mcpResult(id, {
        content: [{ type: "text", text: JSON.stringify(result) }],
      });
    } catch (err) {
      logger.error(
        { err, userId: sessionCtx.userId, toolName },
        "MCP: erro ao executar tool"
      );
      const message =
        err instanceof Error ? err.message : "Erro interno ao executar tool";
      return mcpError(id, -32603, message);
    }
  }

  return mcpError(id, -32601, `Método desconhecido: ${method}`);
}

// Health check
export async function GET() {
  return NextResponse.json({ status: "ok", server: "convoca-mcp" });
}
