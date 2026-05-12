import { z } from "zod";
import { sql } from "@/db/client";
import { registerTool, type ToolContext } from "@/lib/agent/tools-catalog";

registerTool({
  name: "list_upcoming_events",
  description:
    "Lista os próximos eventos agendados ou ao vivo do grupo, com data, horário, local e total de confirmados.",
  inputSchema: z.object({
    limit: z
      .number()
      .optional()
      .describe("Máximo de eventos a retornar (padrão: 5)"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, args: { limit?: number }) => {
    const limit = Math.min(args.limit ?? 5, 20);
    const rows = await sql`
      SELECT
        e.id, e.starts_at, e.status, e.max_players,
        v.name AS venue_name,
        COUNT(ea.user_id) FILTER (WHERE ea.status = 'yes') AS confirmed_count
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_attendance ea ON ea.event_id = e.id
      WHERE e.group_id = ${ctx.groupId}
        AND e.status IN ('scheduled', 'live')
        AND e.starts_at >= NOW()
      GROUP BY e.id, v.name
      ORDER BY e.starts_at ASC
      LIMIT ${limit}
    `;
    return rows;
  },
});

registerTool({
  name: "get_next_event",
  description: "Retorna detalhes do próximo evento do grupo.",
  inputSchema: z.object({}),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, _args: Record<string, never>) => {
    const rows = await sql`
      SELECT
        e.id, e.starts_at, e.status, e.max_players, e.max_goalkeepers,
        v.name AS venue_name, v.address AS venue_address,
        COUNT(ea.user_id) FILTER (WHERE ea.status = 'yes') AS confirmed_count,
        COUNT(ea.user_id) FILTER (WHERE ea.status = 'waitlist') AS waitlist_count
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_attendance ea ON ea.event_id = e.id
      WHERE e.group_id = ${ctx.groupId}
        AND e.status IN ('scheduled', 'live')
        AND e.starts_at >= NOW()
      GROUP BY e.id, v.name, v.address
      ORDER BY e.starts_at ASC
      LIMIT 1
    `;
    return rows[0] ?? null;
  },
});

registerTool({
  name: "list_past_events",
  description: "Lista os últimos eventos finalizados do grupo.",
  inputSchema: z.object({
    limit: z
      .number()
      .optional()
      .describe("Máximo de eventos a retornar (padrão: 5)"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, args: { limit?: number }) => {
    const limit = Math.min(args.limit ?? 5, 20);
    const rows = await sql`
      SELECT
        e.id, e.starts_at, e.status,
        v.name AS venue_name
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE e.group_id = ${ctx.groupId}
        AND e.status = 'finished'
      ORDER BY e.starts_at DESC
      LIMIT ${limit}
    `;
    return rows;
  },
});

registerTool({
  name: "get_event_details",
  description:
    "Retorna detalhes completos de um evento específico, incluindo lista de confirmados.",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, args: { event_id: string }) => {
    const rows = await sql`
      SELECT
        e.id, e.starts_at, e.status, e.max_players, e.max_goalkeepers,
        v.name AS venue_name, v.address AS venue_address,
        json_agg(json_build_object(
          'user_id', u.id,
          'name', u.name,
          'status', ea.status,
          'role', ea.role,
          'checked_in', ea.checked_in_at IS NOT NULL
        ) ORDER BY ea.order_of_arrival) AS attendees
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_attendance ea ON ea.event_id = e.id
      LEFT JOIN users u ON ea.user_id = u.id
      WHERE e.id = ${args.event_id}
        AND e.group_id = ${ctx.groupId}
      GROUP BY e.id, v.name, v.address
    `;
    return rows[0] ?? null;
  },
});

registerTool({
  name: "get_event_teams",
  description: "Retorna os times sorteados de um evento.",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, args: { event_id: string }) => {
    const rows = await sql`
      SELECT
        t.id AS team_id, t.name AS team_name, t.is_winner,
        json_agg(json_build_object(
          'user_id', u.id,
          'name', u.name,
          'position', tm.position,
          'starter', tm.starter
        )) AS players
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      JOIN users u ON tm.user_id = u.id
      WHERE t.event_id = ${args.event_id}
        AND EXISTS (
          SELECT 1 FROM events e
          WHERE e.id = ${args.event_id} AND e.group_id = ${ctx.groupId}
        )
      GROUP BY t.id, t.name, t.is_winner
      ORDER BY t.name
    `;
    return rows;
  },
});

registerTool({
  name: "get_event_scoreboard",
  description: "Retorna o placar atual de um evento (gols por time).",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, args: { event_id: string }) => {
    const rows = await sql`
      SELECT s.team_id, s.team_name, s.goals, s.assists, s.own_goals
      FROM mv_event_scoreboard s
      WHERE s.event_id = ${args.event_id}
        AND EXISTS (
          SELECT 1 FROM events e
          WHERE e.id = ${args.event_id} AND e.group_id = ${ctx.groupId}
        )
      ORDER BY s.goals DESC
    `;
    return rows;
  },
});
