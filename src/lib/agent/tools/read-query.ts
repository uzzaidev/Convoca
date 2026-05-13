import { z } from "zod";
import { sql } from "@/db/client";
import { registerTool, type ToolContext } from "@/lib/agent/tools-catalog";

const BLOCKED_KEYWORDS = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|execute|call|copy|vacuum|reindex|cluster|refresh)\b/i;

registerTool({
  name: "query_data",
  description: `Executa uma query SELECT SQL personalizada contra o banco de dados do grupo atual.
Use quando precisar de informações não disponíveis no contexto pré-carregado (dados_do_grupo).
OBRIGATÓRIO: a query deve filtrar pelo group_id do grupo atual (disponível como valor literal no system prompt).
Somente SELECT é permitido. Máximo 100 linhas.
Exemplo: SELECT u.name, ea.status FROM event_attendance ea JOIN users u ON u.id = ea.user_id WHERE ea.event_id = '<id>' AND EXISTS (SELECT 1 FROM events e WHERE e.id = ea.event_id AND e.group_id = '<groupId>')`,
  inputSchema: z.object({
    query: z.string().min(10).describe(
      "Query SQL SELECT completa. Deve conter o group_id do grupo atual nos filtros."
    ),
    explanation: z.string().describe(
      "Explique em uma frase o que esta query busca (para logs)."
    ),
  }),
  kind: "write", // exposto via MCP (só write tools passam no filtro atual)
  minRole: "member",
  handler: async (ctx: ToolContext, args: { query: string; explanation: string }) => {
    const q = args.query.trim();

    // Segurança: somente SELECT
    if (!/^select\s/i.test(q)) {
      throw new Error("Apenas queries SELECT são permitidas.");
    }

    // Bloquear keywords de escrita/DDL
    if (BLOCKED_KEYWORDS.test(q)) {
      throw new Error("Apenas queries SELECT são permitidas.");
    }

    // Bloquear múltiplos statements
    if (/;\s*\S/.test(q)) {
      throw new Error("Múltiplos statements não são permitidos.");
    }

    // Isolamento: query deve referenciar o groupId da sessão
    if (!q.includes(ctx.groupId)) {
      throw new Error(
        `A query deve filtrar pelo group_id do grupo atual (${ctx.groupId}).`
      );
    }

    // Adicionar LIMIT se não houver
    const withLimit = /\blimit\s+\d+/i.test(q) ? q : `${q} LIMIT 100`;

    const rows = await sql.unsafe(withLimit);
    return rows;
  },
});
