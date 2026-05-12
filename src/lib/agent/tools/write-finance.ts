import { z } from "zod";
import { sql } from "@/db/client";
import { registerTool, type ToolContext } from "@/lib/agent/tools-catalog";

registerTool({
  name: "create_charge",
  description:
    "Cria uma cobrança para um membro do grupo (admin only). Requer confirmação.",
  inputSchema: z.object({
    user_id: z.string().describe("UUID do membro a ser cobrado"),
    amount_cents: z
      .number()
      .describe("Valor em centavos (ex: 3000 = R$ 30,00)"),
    type: z
      .enum(["monthly", "daily", "fine", "other"])
      .describe("Tipo da cobrança"),
    due_date: z
      .string()
      .describe("Data de vencimento (YYYY-MM-DD)"),
    event_id: z
      .string()
      .optional()
      .describe("UUID do evento relacionado (opcional)"),
    description: z
      .string()
      .optional()
      .describe("Descrição da cobrança (opcional)"),
  }),
  kind: "write",
  minRole: "admin",
  handler: async (
    ctx: ToolContext,
    args: {
      user_id: string;
      amount_cents: number;
      type: "monthly" | "daily" | "fine" | "other";
      due_date: string;
      event_id?: string;
      description?: string;
    }
  ) => {
    // Verificar que o membro pertence ao grupo
    const memberCheck = await sql<{ user_id: string }[]>`
      SELECT user_id FROM group_members
      WHERE group_id = ${ctx.groupId} AND user_id = ${args.user_id}
    `;
    if (!memberCheck[0]) throw new Error("Membro não encontrado no grupo");

    const rows = await sql`
      INSERT INTO charges (group_id, user_id, event_id, type, amount_cents, due_date, status, description)
      VALUES (
        ${ctx.groupId},
        ${args.user_id},
        ${args.event_id ?? null},
        ${args.type},
        ${args.amount_cents},
        ${args.due_date},
        'pending',
        ${args.description ?? null}
      )
      RETURNING id, type, amount_cents, due_date, status
    `;
    return rows[0];
  },
});

registerTool({
  name: "mark_charge_paid",
  description:
    "Marca uma cobrança como paga (admin only). Requer confirmação.",
  inputSchema: z.object({
    charge_id: z.string().describe("UUID da cobrança"),
  }),
  kind: "write",
  minRole: "admin",
  handler: async (ctx: ToolContext, args: { charge_id: string }) => {
    const rows = await sql`
      UPDATE charges SET status = 'paid'
      WHERE id = ${args.charge_id}
        AND group_id = ${ctx.groupId}
        AND status = 'pending'
      RETURNING id, type, amount_cents, status
    `;
    return rows[0] ?? null;
  },
});
