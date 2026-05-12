import { z } from "zod";
import { sql } from "@/db/client";
import { registerTool, type ToolContext } from "@/lib/agent/tools-catalog";

registerTool({
  name: "list_group_members",
  description:
    "Lista os membros do grupo com nome, papel (admin/membro) e se é goleiro.",
  inputSchema: z.object({
    role_filter: z
      .enum(["admin", "member", "all"])
      .optional()
      .describe("Filtrar por papel (padrão: all)"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (
    ctx: ToolContext,
    args: { role_filter?: "admin" | "member" | "all" }
  ) => {
    const filter = args.role_filter ?? "all";
    const rows = await sql`
      SELECT
        u.id, u.name, u.email,
        gm.role, gm.is_goalkeeper, gm.joined_at
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ${ctx.groupId}
        AND (${filter} = 'all' OR gm.role = ${filter})
      ORDER BY gm.role, u.name
    `;
    return rows;
  },
});

registerTool({
  name: "search_member_by_name",
  description: "Busca membros do grupo pelo nome.",
  inputSchema: z.object({
    name: z.string().describe("Nome (parcial) do membro"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, args: { name: string }) => {
    const search = `%${args.name}%`;
    const rows = await sql`
      SELECT u.id, u.name, u.email, gm.role, gm.is_goalkeeper
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ${ctx.groupId}
        AND u.name ILIKE ${search}
      ORDER BY u.name
      LIMIT 10
    `;
    return rows;
  },
});
