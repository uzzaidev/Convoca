import { z } from "zod";
import { sql } from "@/db/client";
import { registerTool, type ToolContext } from "@/lib/agent/tools-catalog";

registerTool({
  name: "list_my_charges",
  description: "Lista as cobranças do usuário atual neste grupo.",
  inputSchema: z.object({
    status_filter: z
      .enum(["pending", "paid", "canceled", "all"])
      .optional()
      .describe("Filtrar por status (padrão: all)"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (
    ctx: ToolContext,
    args: { status_filter?: "pending" | "paid" | "canceled" | "all" }
  ) => {
    const filter = args.status_filter ?? "all";
    const rows = await sql`
      SELECT
        c.id, c.type, c.amount_cents, c.due_date, c.status,
        e.starts_at AS event_date
      FROM charges c
      LEFT JOIN events e ON c.event_id = e.id
      WHERE c.group_id = ${ctx.groupId}
        AND c.user_id = ${ctx.userId}
        AND (${filter} = 'all' OR c.status = ${filter})
      ORDER BY c.due_date DESC
      LIMIT 20
    `;
    return rows;
  },
});

registerTool({
  name: "list_group_charges",
  description:
    "Lista todas as cobranças do grupo (admin only). Pode filtrar por membro ou status.",
  inputSchema: z.object({
    user_id: z
      .string()
      .optional()
      .describe("UUID do membro (opcional: filtra por membro específico)"),
    status_filter: z
      .enum(["pending", "paid", "canceled", "all"])
      .optional()
      .describe("Filtrar por status (padrão: pending)"),
    limit: z.number().optional().describe("Máximo de resultados (padrão: 20)"),
  }),
  kind: "read",
  minRole: "admin",
  handler: async (
    ctx: ToolContext,
    args: {
      user_id?: string;
      status_filter?: "pending" | "paid" | "canceled" | "all";
      limit?: number;
    }
  ) => {
    const filter = args.status_filter ?? "pending";
    const limit = Math.min(args.limit ?? 20, 50);
    const rows = await sql`
      SELECT
        c.id, c.type, c.amount_cents, c.due_date, c.status,
        u.name AS member_name,
        e.starts_at AS event_date
      FROM charges c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN events e ON c.event_id = e.id
      WHERE c.group_id = ${ctx.groupId}
        AND (${args.user_id ?? null}::uuid IS NULL OR c.user_id = ${args.user_id ?? null}::uuid)
        AND (${filter} = 'all' OR c.status = ${filter})
      ORDER BY c.due_date DESC
      LIMIT ${limit}
    `;
    return rows;
  },
});

registerTool({
  name: "get_group_wallet",
  description:
    "Retorna o saldo da carteira do grupo (admin only).",
  inputSchema: z.object({}),
  kind: "read",
  minRole: "admin",
  handler: async (ctx: ToolContext, _args: Record<string, never>) => {
    const rows = await sql`
      SELECT balance_cents
      FROM wallets
      WHERE owner_type = 'group' AND owner_id = ${ctx.groupId}
    `;
    return rows[0] ?? { balance_cents: 0 };
  },
});

registerTool({
  name: "list_expenses",
  description: "Lista as despesas do grupo (admin only).",
  inputSchema: z.object({
    limit: z.number().optional().describe("Máximo de resultados (padrão: 10)"),
  }),
  kind: "read",
  minRole: "admin",
  handler: async (ctx: ToolContext, args: { limit?: number }) => {
    const limit = Math.min(args.limit ?? 10, 30);
    const rows = await sql`
      SELECT
        ex.id, ex.category, ex.amount_cents, ex.date, ex.description,
        u.name AS created_by_name
      FROM expenses ex
      LEFT JOIN users u ON ex.created_by = u.id
      WHERE ex.group_id = ${ctx.groupId}
      ORDER BY ex.date DESC
      LIMIT ${limit}
    `;
    return rows;
  },
});
