import { z } from "zod";
import { sql } from "@/db/client";
import { registerTool, type ToolContext } from "@/lib/agent/tools-catalog";

registerTool({
  name: "create_event",
  description:
    "Cria um novo evento/pelada no grupo. Requer confirmação do usuário antes de executar.",
  inputSchema: z.object({
    starts_at: z
      .string()
      .describe("Data e hora do evento (ISO 8601, ex: 2026-05-15T19:00:00)"),
    max_players: z
      .number()
      .describe("Número máximo de jogadores de linha"),
    max_goalkeepers: z
      .number()
      .optional()
      .describe("Número máximo de goleiros (padrão: 2)"),
    venue_name: z
      .string()
      .optional()
      .describe("Nome do local (opcional)"),
  }),
  kind: "write",
  minRole: "admin",
  handler: async (
    ctx: ToolContext,
    args: {
      starts_at: string;
      max_players: number;
      max_goalkeepers?: number;
      venue_name?: string;
    }
  ) => {
    let venueId: string | null = null;

    if (args.venue_name) {
      const existing = await sql<{ id: string }[]>`
        SELECT id FROM venues WHERE group_id = ${ctx.groupId} AND name ILIKE ${args.venue_name} LIMIT 1
      `;
      if (existing[0]) {
        venueId = existing[0].id;
      } else {
        const created = await sql<{ id: string }[]>`
          INSERT INTO venues (group_id, name, created_by)
          VALUES (${ctx.groupId}, ${args.venue_name}, ${ctx.userId})
          RETURNING id
        `;
        venueId = created[0].id;
      }
    }

    const rows = await sql<{ id: string }[]>`
      INSERT INTO events (group_id, starts_at, max_players, max_goalkeepers, venue_id, status, created_by)
      VALUES (
        ${ctx.groupId},
        ${args.starts_at},
        ${args.max_players},
        ${args.max_goalkeepers ?? 2},
        ${venueId},
        'scheduled',
        ${ctx.userId}
      )
      RETURNING id, starts_at, max_players, max_goalkeepers, status
    `;
    return rows[0];
  },
});

registerTool({
  name: "update_event",
  description:
    "Atualiza dados de um evento existente. Requer confirmação do usuário antes de executar.",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento"),
    starts_at: z
      .string()
      .optional()
      .describe("Nova data/hora (ISO 8601)"),
    max_players: z.number().optional().describe("Novo máximo de jogadores"),
    max_goalkeepers: z.number().optional().describe("Novo máximo de goleiros"),
    status: z
      .enum(["scheduled", "live", "finished", "canceled"])
      .optional()
      .describe("Novo status"),
  }),
  kind: "write",
  minRole: "admin",
  handler: async (
    ctx: ToolContext,
    args: {
      event_id: string;
      starts_at?: string;
      max_players?: number;
      max_goalkeepers?: number;
      status?: "scheduled" | "live" | "finished" | "canceled";
    }
  ) => {
    const rows = await sql`
      UPDATE events SET
        starts_at = COALESCE(${args.starts_at ?? null}::timestamptz, starts_at),
        max_players = COALESCE(${args.max_players ?? null}::int, max_players),
        max_goalkeepers = COALESCE(${args.max_goalkeepers ?? null}::int, max_goalkeepers),
        status = COALESCE(${args.status ?? null}, status)
      WHERE id = ${args.event_id}
        AND group_id = ${ctx.groupId}
      RETURNING id, starts_at, max_players, max_goalkeepers, status
    `;
    return rows[0] ?? null;
  },
});

registerTool({
  name: "cancel_event",
  description:
    "Cancela um evento do grupo. Requer confirmação do usuário antes de executar.",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento a cancelar"),
  }),
  kind: "write",
  minRole: "admin",
  handler: async (ctx: ToolContext, args: { event_id: string }) => {
    const rows = await sql`
      UPDATE events SET status = 'canceled'
      WHERE id = ${args.event_id} AND group_id = ${ctx.groupId}
      RETURNING id, starts_at, status
    `;
    return rows[0] ?? null;
  },
});
