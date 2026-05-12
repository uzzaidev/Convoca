import { z } from "zod";
import { sql } from "@/db/client";
import { registerTool, type ToolContext } from "@/lib/agent/tools-catalog";

registerTool({
  name: "draw_teams",
  description:
    "Sorteia os times de um evento com os jogadores confirmados (admin only). Requer confirmação.",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento"),
    players_per_team: z
      .number()
      .optional()
      .describe("Jogadores por time (padrão: usa configuração do grupo)"),
    team_count: z
      .number()
      .optional()
      .describe("Número de times (padrão: 2)"),
  }),
  kind: "write",
  minRole: "admin",
  handler: async (
    ctx: ToolContext,
    args: {
      event_id: string;
      players_per_team?: number;
      team_count?: number;
    }
  ) => {
    // Verificar evento no grupo
    const eventCheck = await sql<{
      id: string;
      max_players: number;
    }[]>`
      SELECT id, max_players FROM events
      WHERE id = ${args.event_id} AND group_id = ${ctx.groupId}
    `;
    if (!eventCheck[0]) throw new Error("Evento não encontrado no grupo");

    // Buscar jogadores com check-in
    const players = await sql<{
      user_id: string;
      role: string;
    }[]>`
      SELECT user_id, role FROM event_attendance
      WHERE event_id = ${args.event_id}
        AND status = 'yes'
        AND checked_in_at IS NOT NULL
      ORDER BY RANDOM()
    `;

    if (players.length < 2) {
      throw new Error(
        "Número insuficiente de jogadores com check-in para sortear times"
      );
    }

    const teamCount = args.team_count ?? 2;
    const teamNames = ["Time A", "Time B", "Time C", "Time D"];

    // Excluir times anteriores
    await sql`DELETE FROM teams WHERE event_id = ${args.event_id}`;

    // Criar times
    const createdTeams: { id: string; name: string }[] = [];
    for (let i = 0; i < teamCount; i++) {
      const rows = await sql<{ id: string }[]>`
        INSERT INTO teams (event_id, name, seed)
        VALUES (${args.event_id}, ${teamNames[i] ?? `Time ${i + 1}`}, ${Math.random()})
        RETURNING id
      `;
      createdTeams.push({ id: rows[0].id, name: teamNames[i] ?? `Time ${i + 1}` });
    }

    // Separar goleiros e jogadores de linha
    const goalkeepers = players.filter((p) => p.role === "gk");
    const linePlayers = players.filter((p) => p.role !== "gk");

    // Distribuir jogadores nos times
    for (let i = 0; i < linePlayers.length; i++) {
      const teamIdx = i % teamCount;
      const team = createdTeams[teamIdx];
      await sql`
        INSERT INTO team_members (team_id, user_id, position, starter)
        VALUES (${team.id}, ${linePlayers[i].user_id}, 'line', true)
      `;
    }

    // Distribuir goleiros
    for (let i = 0; i < goalkeepers.length; i++) {
      const teamIdx = i % teamCount;
      const team = createdTeams[teamIdx];
      await sql`
        INSERT INTO team_members (team_id, user_id, position, starter)
        VALUES (${team.id}, ${goalkeepers[i].user_id}, 'gk', true)
      `;
    }

    return {
      teams: createdTeams,
      total_players: players.length,
      goalkeepers: goalkeepers.length,
      line_players: linePlayers.length,
    };
  },
});

registerTool({
  name: "swap_players",
  description:
    "Troca dois jogadores de time após o sorteio (admin only). Requer confirmação.",
  inputSchema: z.object({
    event_id: z.string().describe("UUID do evento"),
    user_id_a: z.string().describe("UUID do primeiro jogador"),
    user_id_b: z.string().describe("UUID do segundo jogador"),
  }),
  kind: "write",
  minRole: "admin",
  handler: async (
    ctx: ToolContext,
    args: { event_id: string; user_id_a: string; user_id_b: string }
  ) => {
    // Verificar evento no grupo
    const eventCheck = await sql<{ id: string }[]>`
      SELECT id FROM events WHERE id = ${args.event_id} AND group_id = ${ctx.groupId}
    `;
    if (!eventCheck[0]) throw new Error("Evento não encontrado no grupo");

    // Buscar team_id dos dois jogadores
    const memberA = await sql<{ team_id: string }[]>`
      SELECT tm.team_id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = ${args.user_id_a} AND t.event_id = ${args.event_id}
    `;
    const memberB = await sql<{ team_id: string }[]>`
      SELECT tm.team_id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = ${args.user_id_b} AND t.event_id = ${args.event_id}
    `;

    if (!memberA[0] || !memberB[0]) {
      throw new Error("Um ou ambos os jogadores não estão nos times");
    }

    const teamIdA = memberA[0].team_id;
    const teamIdB = memberB[0].team_id;

    if (teamIdA === teamIdB) {
      throw new Error("Os jogadores já estão no mesmo time");
    }

    // Troca
    await sql`
      UPDATE team_members SET team_id = ${teamIdB}
      WHERE user_id = ${args.user_id_a}
        AND team_id = ${teamIdA}
    `;
    await sql`
      UPDATE team_members SET team_id = ${teamIdA}
      WHERE user_id = ${args.user_id_b}
        AND team_id = ${teamIdB}
    `;

    return { swapped: true, user_id_a: args.user_id_a, user_id_b: args.user_id_b };
  },
});
