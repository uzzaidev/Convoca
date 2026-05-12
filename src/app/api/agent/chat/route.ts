import { NextRequest } from "next/server";
import { z } from "zod";
import type { ResponseCreateParamsStreaming } from "openai/resources/responses/responses";
import { requireAuth } from "@/lib/auth-helpers";
import { requireGroupAccess } from "@/lib/group-access";
import { checkAndReserveQuota, recordUsage } from "@/lib/agent/quota";
import { signAgentSessionToken } from "@/lib/agent/session-token";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { getOpenAIClient, getAgentModel, getMcpPublicUrl } from "@/lib/agent/openai-client";
import { sql } from "@/db/client";
import logger from "@/lib/logger";

const bodySchema = z.object({
  groupId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  previousResponseId: z.string().optional(),
  confirmed: z.boolean().optional(),
});

function sseEvent(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(type, data)));
      };

      try {
        // 1. Autenticação
        const user = await requireAuth();

        // 2. Parse body
        let body: z.infer<typeof bodySchema>;
        try {
          body = bodySchema.parse(await req.json());
        } catch {
          send("error", { message: "Requisição inválida" });
          controller.close();
          return;
        }

        const { groupId, message, conversationId, previousResponseId, confirmed } = body;

        // 3. Verificar acesso ao grupo
        const ctx = await requireGroupAccess(groupId, user);
        const role = ctx.userRole === "admin" ? "admin" : "member";

        // 4. Verificar quota
        await checkAndReserveQuota(user.id);

        // 5. Criar ou recuperar conversa
        let convId = conversationId;
        if (!convId) {
          const rows = await sql<{ id: string }[]>`
            INSERT INTO agent_conversations (user_id, group_id, title)
            VALUES (${user.id}, ${groupId}, ${message.slice(0, 100)})
            RETURNING id
          `;
          convId = rows[0].id;
          send("conversation_created", { conversationId: convId });
        }

        // 6. Salvar mensagem do usuário
        await sql`
          INSERT INTO agent_messages (conversation_id, role, content)
          VALUES (${convId}, 'user', ${message})
        `;

        // 7. Gerar session token para MCP
        const sessionToken = await signAgentSessionToken({
          userId: user.id,
          groupId,
          role,
        });

        // 8. Construir system prompt
        const systemPrompt = buildSystemPrompt({
          groupName: ctx.name,
          userName: user.name,
          role,
          today: new Date().toISOString().slice(0, 10),
        });

        // 9. Configurar tools de escrita que requerem aprovação
        const writeToolNames = [
          "create_event",
          "update_event",
          "cancel_event",
          "set_member_rsvp",
          "check_in_player",
          "create_charge",
          "mark_charge_paid",
          "draw_teams",
          "swap_players",
        ];

        const mcpUrl = getMcpPublicUrl();
        const openai = getOpenAIClient();
        const model = getAgentModel();

        send("thinking", { status: "iniciando" });

        // 10. Chamar OpenAI Responses API com streaming
        const responseParams: ResponseCreateParamsStreaming = {
          model,
          instructions: systemPrompt,
          input: confirmed ? `${message}\n\n[Usuario confirmou a acao]` : message,
          previous_response_id: previousResponseId ?? null,
          tools: [
            {
              type: "mcp" as const,
              server_label: "convoca",
              server_url: mcpUrl,
              headers: {
                Authorization: `Bearer ${sessionToken}`,
              },
              require_approval:
                role === "admin"
                  ? {
                      always: {
                        tool_names: writeToolNames,
                      },
                    }
                  : "never",
            },
          ],
          stream: true,
        };

        const response = await openai.responses.create(responseParams);

        let fullText = "";
        let lastResponseId: string | undefined;
        let approvalRequired = false;
        let pendingToolCall: unknown = null;
        let inputTokens = 0;
        let outputTokens = 0;
        let reasoningTokens = 0;

        for await (const event of response) {
          const evType = (event as { type?: string }).type;

          if (!evType) continue;

          if (evType === "response.created" || evType === "response.in_progress") {
            const id = (event as { response?: { id?: string } }).response?.id;
            if (id) lastResponseId = id;
            continue;
          }

          if (evType === "response.output_text.delta") {
            const delta = (event as { delta?: string }).delta ?? "";
            fullText += delta;
            send("token", { delta });
            continue;
          }

          if (evType === "response.mcp_call.in_progress") {
            const name = (event as { name?: string }).name ?? "unknown";
            send("tool_call", { tool: name, status: "running" });
            continue;
          }

          if (evType === "response.mcp_call.completed") {
            const name = (event as { name?: string }).name ?? "unknown";
            const output = (event as { output?: unknown }).output;
            send("tool_result", { tool: name, result: output });
            continue;
          }

          if (evType === "response.mcp_call_approval_request") {
            approvalRequired = true;
            pendingToolCall = event;
            send("confirmation_required", {
              tool: (event as { name?: string }).name,
              arguments: (event as { arguments?: unknown }).arguments,
              responseId: lastResponseId,
            });
            continue;
          }

          if (evType === "response.completed") {
            const resp = (event as { response?: Record<string, unknown> }).response;
            if (resp?.id) lastResponseId = resp.id as string;
            const usage = resp?.usage as Record<string, number> | undefined;
            if (usage) {
              inputTokens = usage.input_tokens ?? 0;
              outputTokens = usage.output_tokens ?? 0;
              reasoningTokens = usage.reasoning_tokens ?? 0;
            }
          }
        }

        // 11. Salvar resposta do assistente (se não bloqueada por aprovação)
        if (!approvalRequired && fullText) {
          const [msgRow] = await sql<{ id: string }[]>`
            INSERT INTO agent_messages (conversation_id, role, content, response_id)
            VALUES (${convId}, 'assistant', ${fullText}, ${lastResponseId ?? null})
            RETURNING id
          `;

          await recordUsage(user.id, {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            reasoning_tokens: reasoningTokens,
          });

          send("usage", {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
          });

          send("done", {
            conversationId: convId,
            messageId: msgRow?.id,
            responseId: lastResponseId,
          });
        }

        if (approvalRequired) {
          logger.info(
            { userId: user.id, groupId, pendingToolCall },
            "agent: aprovação necessária"
          );
        }
      } catch (err) {
        logger.error(err, "agent/chat: erro ao processar mensagem");

        let message = "Erro interno ao processar mensagem";
        let status = "error";

        if (err instanceof Error) {
          if (err.message.includes("autenticado")) {
            message = "Não autenticado";
            status = "unauthorized";
          } else if ((err as { code?: string }).code === "QUOTA_EXCEEDED") {
            message = "Cota mensal esgotada. Tente novamente no próximo mês.";
            status = "quota_exceeded";
          } else {
            message = err.message;
          }
        }

        controller.enqueue(
          encoder.encode(sseEvent("error", { message, status }))
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
