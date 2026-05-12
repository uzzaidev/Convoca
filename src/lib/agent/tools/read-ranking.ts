import { z } from "zod";
import { sql } from "@/db/client";
import { registerTool, type ToolContext } from "@/lib/agent/tools-catalog";

registerTool({
  name: "get_group_rankings",
  description:
    "Retorna o ranking geral do grupo com pontos, gols, assistências e jogos disputados.",
  inputSchema: z.object({
    limit: z.number().optional().describe("Top N jogadores (padrão: 10)"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, args: { limit?: number }) => {
    const limit = Math.min(args.limit ?? 10, 50);
    const rows = await sql`
      WITH scoring AS (
        SELECT
          COALESCE(sc.points_win, 3) AS pts_win,
          COALESCE(sc.points_draw, 1) AS pts_draw,
          COALESCE(sc.points_loss, 0) AS pts_loss,
          COALESCE(sc.points_goal, 0) AS pts_goal,
          COALESCE(sc.points_assist, 0) AS pts_assist,
          COALESCE(sc.points_mvp, 0) AS pts_mvp,
          COALESCE(sc.points_presence, 0) AS pts_presence
        FROM scoring_configs sc
        WHERE sc.group_id = ${ctx.groupId}
        LIMIT 1
      ),
      player_events AS (
        SELECT
          gm.user_id,
          u.name,
          COUNT(DISTINCT ea_presence.event_id) AS games_played,
          COUNT(ea_goal.id) AS goals,
          COUNT(ea_assist.id) AS assists
        FROM group_members gm
        JOIN users u ON u.id = gm.user_id
        LEFT JOIN event_attendance ea_presence ON ea_presence.user_id = gm.user_id
          AND ea_presence.status = 'yes'
          AND EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = ea_presence.event_id
              AND e.group_id = ${ctx.groupId}
              AND e.status = 'finished'
          )
        LEFT JOIN event_actions ea_goal ON ea_goal.actor_user_id = gm.user_id
          AND ea_goal.action_type = 'goal'
          AND EXISTS (SELECT 1 FROM events e WHERE e.id = ea_goal.event_id AND e.group_id = ${ctx.groupId})
        LEFT JOIN event_actions ea_assist ON ea_assist.actor_user_id = gm.user_id
          AND ea_assist.action_type = 'assist'
          AND EXISTS (SELECT 1 FROM events e WHERE e.id = ea_assist.event_id AND e.group_id = ${ctx.groupId})
        WHERE gm.group_id = ${ctx.groupId}
        GROUP BY gm.user_id, u.name
      )
      SELECT
        pe.name,
        pe.games_played,
        pe.goals,
        pe.assists,
        (
          pe.games_played * (SELECT pts_presence FROM scoring) +
          pe.goals * (SELECT pts_goal FROM scoring) +
          pe.assists * (SELECT pts_assist FROM scoring)
        ) AS points
      FROM player_events pe
      ORDER BY points DESC, pe.goals DESC
      LIMIT ${limit}
    `;
    return rows;
  },
});

registerTool({
  name: "get_my_stats",
  description: "Retorna as estatísticas do usuário atual no grupo.",
  inputSchema: z.object({}),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, _args: Record<string, never>) => {
    const rows = await sql`
      SELECT
        COUNT(DISTINCT ea_presence.event_id) AS games_played,
        COUNT(ea_goal.id) AS goals,
        COUNT(ea_assist.id) AS assists,
        COUNT(ea_save.id) AS saves,
        COUNT(ea_yellow.id) AS yellow_cards,
        COUNT(ea_red.id) AS red_cards
      FROM group_members gm
      LEFT JOIN event_attendance ea_presence ON ea_presence.user_id = ${ctx.userId}
        AND ea_presence.status = 'yes'
        AND EXISTS (
          SELECT 1 FROM events e
          WHERE e.id = ea_presence.event_id
            AND e.group_id = ${ctx.groupId}
            AND e.status = 'finished'
        )
      LEFT JOIN event_actions ea_goal ON ea_goal.actor_user_id = ${ctx.userId}
        AND ea_goal.action_type = 'goal'
        AND EXISTS (SELECT 1 FROM events e WHERE e.id = ea_goal.event_id AND e.group_id = ${ctx.groupId})
      LEFT JOIN event_actions ea_assist ON ea_assist.actor_user_id = ${ctx.userId}
        AND ea_assist.action_type = 'assist'
        AND EXISTS (SELECT 1 FROM events e WHERE e.id = ea_assist.event_id AND e.group_id = ${ctx.groupId})
      LEFT JOIN event_actions ea_save ON ea_save.actor_user_id = ${ctx.userId}
        AND ea_save.action_type = 'save'
        AND EXISTS (SELECT 1 FROM events e WHERE e.id = ea_save.event_id AND e.group_id = ${ctx.groupId})
      LEFT JOIN event_actions ea_yellow ON ea_yellow.actor_user_id = ${ctx.userId}
        AND ea_yellow.action_type = 'yellow_card'
        AND EXISTS (SELECT 1 FROM events e WHERE e.id = ea_yellow.event_id AND e.group_id = ${ctx.groupId})
      LEFT JOIN event_actions ea_red ON ea_red.actor_user_id = ${ctx.userId}
        AND ea_red.action_type = 'red_card'
        AND EXISTS (SELECT 1 FROM events e WHERE e.id = ea_red.event_id AND e.group_id = ${ctx.groupId})
      WHERE gm.group_id = ${ctx.groupId} AND gm.user_id = ${ctx.userId}
    `;
    return rows[0] ?? null;
  },
});

registerTool({
  name: "get_top_scorers",
  description: "Lista os maiores goleadores do grupo.",
  inputSchema: z.object({
    limit: z.number().optional().describe("Top N jogadores (padrão: 5)"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, args: { limit?: number }) => {
    const limit = Math.min(args.limit ?? 5, 20);
    const rows = await sql`
      SELECT u.name, COUNT(ea.id) AS goals
      FROM event_actions ea
      JOIN users u ON ea.actor_user_id = u.id
      JOIN events e ON ea.event_id = e.id
      WHERE e.group_id = ${ctx.groupId}
        AND ea.action_type = 'goal'
      GROUP BY u.id, u.name
      ORDER BY goals DESC
      LIMIT ${limit}
    `;
    return rows;
  },
});

registerTool({
  name: "get_frequency_ranking",
  description:
    "Retorna o ranking de frequência dos jogadores (% de presença nos últimos eventos).",
  inputSchema: z.object({
    last_n_events: z
      .number()
      .optional()
      .describe("Considerar últimos N eventos (padrão: 10)"),
  }),
  kind: "read",
  minRole: "member",
  handler: async (ctx: ToolContext, args: { last_n_events?: number }) => {
    const lastN = Math.min(args.last_n_events ?? 10, 30);
    const rows = await sql`
      WITH recent_events AS (
        SELECT id FROM events
        WHERE group_id = ${ctx.groupId} AND status = 'finished'
        ORDER BY starts_at DESC
        LIMIT ${lastN}
      )
      SELECT
        u.name,
        COUNT(ea.event_id) AS attended,
        ${lastN} AS total_events,
        ROUND(COUNT(ea.event_id)::numeric / ${lastN} * 100) AS frequency_pct
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      LEFT JOIN event_attendance ea ON ea.user_id = gm.user_id
        AND ea.status = 'yes'
        AND ea.event_id IN (SELECT id FROM recent_events)
      WHERE gm.group_id = ${ctx.groupId}
      GROUP BY u.id, u.name
      ORDER BY frequency_pct DESC, u.name
    `;
    return rows;
  },
});
