import { z } from "zod";
import { sql } from "@/db/client";
import { registerTool, type ToolContext } from "@/lib/agent/tools-catalog";

registerTool({
  name: "set_my_rsvp",
  description:
    "Define o RSVP (confirmação de presença) do usuário atual em um evento.",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento"),
    status: z
      .enum(["yes", "no", "waitlist"])
      .describe("Status de presença: yes, no ou waitlist"),
    role: z
      .enum(["gk", "line"])
      .optional()
      .describe("Posição: gk (goleiro) ou line (linha), padrão: line"),
  }),
  kind: "write",
  minRole: "member",
  handler: async (
    ctx: ToolContext,
    args: {
      event_id: string;
      status: "yes" | "no" | "waitlist";
      role?: "gk" | "line";
    }
  ) => {
    const role = args.role ?? "line";

    // Verificar se o evento pertence ao grupo
    const eventCheck = await sql<{ id: string }[]>`
      SELECT id FROM events WHERE id = ${args.event_id} AND group_id = ${ctx.groupId}
    `;
    if (!eventCheck[0]) {
      throw new Error("Evento não encontrado no grupo");
    }

    const rows = await sql`
      INSERT INTO event_attendance (event_id, user_id, status, role, order_of_arrival)
      VALUES (
        ${args.event_id},
        ${ctx.userId},
        ${args.status},
        ${role},
        EXTRACT(EPOCH FROM NOW())::bigint
      )
      ON CONFLICT (event_id, user_id) DO UPDATE SET
        status = ${args.status},
        role = ${role}
      RETURNING event_id, user_id, status, role
    `;
    return rows[0];
  },
});

registerTool({
  name: "set_member_rsvp",
  description:
    "Define o RSVP de outro membro em um evento (admin only). Requer confirmação.",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento"),
    user_id: z.string().describe("UUID do membro"),
    status: z
      .enum(["yes", "no", "waitlist"])
      .describe("Status de presença"),
    role: z
      .enum(["gk", "line"])
      .optional()
      .describe("Posição: gk ou line (padrão: line)"),
  }),
  kind: "write",
  minRole: "admin",
  handler: async (
    ctx: ToolContext,
    args: {
      event_id: string;
      user_id: string;
      status: "yes" | "no" | "waitlist";
      role?: "gk" | "line";
    }
  ) => {
    const role = args.role ?? "line";

    const eventCheck = await sql<{ id: string }[]>`
      SELECT id FROM events WHERE id = ${args.event_id} AND group_id = ${ctx.groupId}
    `;
    if (!eventCheck[0]) throw new Error("Evento não encontrado no grupo");

    const rows = await sql`
      INSERT INTO event_attendance (event_id, user_id, status, role, order_of_arrival)
      VALUES (
        ${args.event_id},
        ${args.user_id},
        ${args.status},
        ${role},
        EXTRACT(EPOCH FROM NOW())::bigint
      )
      ON CONFLICT (event_id, user_id) DO UPDATE SET
        status = ${args.status},
        role = ${role}
      RETURNING event_id, user_id, status, role
    `;
    return rows[0];
  },
});

registerTool({
  name: "check_in_player",
  description:
    "Registra o check-in de um jogador em um evento (admin only). Requer confirmação.",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento"),
    user_id: z.string().describe("UUID do jogador"),
  }),
  kind: "write",
  minRole: "admin",
  handler: async (
    ctx: ToolContext,
    args: { event_id: string; user_id: string }
  ) => {
    const eventCheck = await sql<{ id: string }[]>`
      SELECT id FROM events WHERE id = ${args.event_id} AND group_id = ${ctx.groupId}
    `;
    if (!eventCheck[0]) throw new Error("Evento não encontrado no grupo");

    const rows = await sql`
      UPDATE event_attendance
      SET checked_in_at = NOW()
      WHERE event_id = ${args.event_id}
        AND user_id = ${args.user_id}
        AND status = 'yes'
      RETURNING event_id, user_id, checked_in_at
    `;
    return rows[0] ?? null;
  },
});
