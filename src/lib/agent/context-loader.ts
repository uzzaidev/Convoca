import { sql } from "@/db/client";

export interface GroupContext {
  members: MemberRow[];
  upcomingEvents: UpcomingEventRow[];
  recentEvents: RecentEventRow[];
  rankings: RankingRow[];
  myCharges: ChargeRow[];
  // admin only
  groupPendingCharges?: AdminChargeRow[];
  groupWalletCents?: number | null;
}

interface MemberRow {
  name: string;
  role: string;
  is_goalkeeper: boolean;
}

interface UpcomingEventRow {
  id: string;
  starts_at: string;
  status: string;
  max_players: number | null;
  venue_name: string | null;
  confirmed_count: number;
  waitlist_count: number;
  my_status: string | null;
}

interface RecentEventRow {
  id: string;
  starts_at: string;
  venue_name: string | null;
  confirmed_count: number;
}

interface RankingRow {
  name: string;
  games_played: number;
  goals: number;
  assists: number;
  points: number;
}

interface ChargeRow {
  type: string;
  amount_cents: number;
  due_date: string | null;
  status: string;
  event_date: string | null;
}

interface AdminChargeRow {
  member_name: string;
  type: string;
  amount_cents: number;
  due_date: string | null;
  event_date: string | null;
}

export async function loadGroupContext(
  groupId: string,
  userId: string,
  role: "admin" | "member"
): Promise<GroupContext> {
  const [
    members,
    upcomingEvents,
    recentEvents,
    rankings,
    myCharges,
    adminData,
  ] = await Promise.all([
    // Membros do grupo
    sql<MemberRow[]>`
      SELECT u.name, gm.role, gm.is_goalkeeper
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ${groupId}
      ORDER BY gm.role, u.name
    `,

    // Próximos eventos (até 7)
    sql<UpcomingEventRow[]>`
      SELECT
        e.id,
        e.starts_at,
        e.status,
        e.max_players,
        v.name AS venue_name,
        COUNT(ea.user_id) FILTER (WHERE ea.status = 'yes') AS confirmed_count,
        COUNT(ea.user_id) FILTER (WHERE ea.status = 'waitlist') AS waitlist_count,
        (SELECT ea2.status FROM event_attendance ea2 WHERE ea2.event_id = e.id AND ea2.user_id = ${userId} LIMIT 1) AS my_status
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_attendance ea ON ea.event_id = e.id
      WHERE e.group_id = ${groupId}
        AND e.status IN ('scheduled', 'live')
        AND e.starts_at >= NOW()
        AND e.deleted_at IS NULL
      GROUP BY e.id, v.name
      ORDER BY e.starts_at ASC
      LIMIT 7
    `,

    // Últimos 3 eventos finalizados
    sql<RecentEventRow[]>`
      SELECT
        e.id,
        e.starts_at,
        v.name AS venue_name,
        COUNT(ea.user_id) FILTER (WHERE ea.status = 'yes') AS confirmed_count
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_attendance ea ON ea.event_id = e.id
      WHERE e.group_id = ${groupId}
        AND e.status = 'finished'
        AND e.deleted_at IS NULL
      GROUP BY e.id, v.name
      ORDER BY e.starts_at DESC
      LIMIT 3
    `,

    // Ranking top 10
    sql<RankingRow[]>`
      WITH scoring AS (
        SELECT
          COALESCE(sc.points_win, 3)      AS pts_win,
          COALESCE(sc.points_draw, 1)     AS pts_draw,
          COALESCE(sc.points_loss, 0)     AS pts_loss,
          COALESCE(sc.points_goal, 0)     AS pts_goal,
          COALESCE(sc.points_assist, 0)   AS pts_assist,
          COALESCE(sc.points_presence, 0) AS pts_presence
        FROM scoring_configs sc
        WHERE sc.group_id = ${groupId}
        LIMIT 1
      ),
      stats AS (
        SELECT
          u.name,
          COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'yes') AS games_played,
          COUNT(act.id) FILTER (WHERE act.action_type = 'goal') AS goals,
          COUNT(act.id) FILTER (WHERE act.action_type = 'assist') AS assists
        FROM group_members gm
        JOIN users u ON u.id = gm.user_id
        LEFT JOIN event_attendance ea ON ea.user_id = gm.user_id
          AND EXISTS (SELECT 1 FROM events e WHERE e.id = ea.event_id AND e.group_id = ${groupId} AND e.status = 'finished')
        LEFT JOIN event_actions act ON act.actor_user_id = gm.user_id
          AND EXISTS (SELECT 1 FROM events e WHERE e.id = act.event_id AND e.group_id = ${groupId})
        WHERE gm.group_id = ${groupId}
        GROUP BY u.name
      )
      SELECT
        s.name,
        s.games_played::int,
        s.goals::int,
        s.assists::int,
        (
          s.games_played * COALESCE((SELECT pts_presence FROM scoring), 0)
          + s.goals * COALESCE((SELECT pts_goal FROM scoring), 0)
          + s.assists * COALESCE((SELECT pts_assist FROM scoring), 0)
        )::int AS points
      FROM stats s
      ORDER BY points DESC, s.goals DESC, s.name
      LIMIT 10
    `,

    // Cobranças pendentes do usuário atual
    sql<ChargeRow[]>`
      SELECT c.type, c.amount_cents::int AS amount_cents, c.due_date, c.status,
             e.starts_at AS event_date
      FROM charges c
      LEFT JOIN events e ON c.event_id = e.id
      WHERE c.group_id = ${groupId}
        AND c.user_id = ${userId}
        AND c.status = 'pending'
      ORDER BY c.due_date ASC
      LIMIT 10
    `,

    // Dados admin (cobranças pendentes do grupo + saldo carteira)
    role === "admin"
      ? Promise.all([
          sql<AdminChargeRow[]>`
            SELECT u.name AS member_name, c.type, c.amount_cents::int AS amount_cents,
                   c.due_date, e.starts_at AS event_date
            FROM charges c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN events e ON c.event_id = e.id
            WHERE c.group_id = ${groupId}
              AND c.status = 'pending'
            ORDER BY c.due_date ASC
            LIMIT 30
          `,
          sql<{ balance_cents: string }[]>`
            SELECT balance_cents FROM wallets
            WHERE group_id = ${groupId}
            LIMIT 1
          `,
        ])
      : Promise.resolve(null),
  ]);

  let groupPendingCharges: AdminChargeRow[] | undefined;
  let groupWalletCents: number | null | undefined;

  if (adminData) {
    const [charges, wallet] = adminData as [AdminChargeRow[], { balance_cents: string }[]];
    groupPendingCharges = charges;
    groupWalletCents = wallet[0] ? Number(wallet[0].balance_cents) : null;
  }

  return {
    members,
    upcomingEvents,
    recentEvents,
    rankings,
    myCharges,
    groupPendingCharges,
    groupWalletCents,
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function fmtMoney(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function formatGroupContext(ctx: GroupContext): string {
  const parts: string[] = [];

  // Membros
  const admins = ctx.members.filter((m) => m.role === "admin");
  const members = ctx.members.filter((m) => m.role !== "admin");
  const gk = ctx.members.filter((m) => m.is_goalkeeper).map((m) => m.name);

  parts.push(
    `MEMBROS (${ctx.members.length} total)\n` +
      `Admins: ${admins.map((m) => m.name).join(", ") || "nenhum"}\n` +
      `Membros: ${members.map((m) => m.name).join(", ") || "nenhum"}\n` +
      `Goleiros cadastrados: ${gk.join(", ") || "nenhum"}`
  );

  // Próximos eventos
  if (ctx.upcomingEvents.length === 0) {
    parts.push("PRÓXIMOS EVENTOS: nenhum agendado");
  } else {
    const evLines = ctx.upcomingEvents.map((e) => {
      const vagas =
        e.max_players != null
          ? `${e.confirmed_count}/${e.max_players} confirmados`
          : `${e.confirmed_count} confirmados`;
      const lista = e.waitlist_count > 0 ? ` (${e.waitlist_count} na fila)` : "";
      const meu = e.my_status ? ` | meu status: ${e.my_status}` : " | meu status: sem resposta";
      const local = e.venue_name ? ` em ${e.venue_name}` : "";
      return `- ${fmtDate(e.starts_at)}${local}: ${vagas}${lista}${meu} [id:${e.id}]`;
    });
    parts.push(`PRÓXIMOS EVENTOS\n${evLines.join("\n")}`);
  }

  // Eventos recentes
  if (ctx.recentEvents.length > 0) {
    const lines = ctx.recentEvents.map(
      (e) =>
        `- ${fmtDate(e.starts_at)}${e.venue_name ? ` em ${e.venue_name}` : ""}: ${e.confirmed_count} jogadores`
    );
    parts.push(`ÚLTIMOS EVENTOS FINALIZADOS\n${lines.join("\n")}`);
  }

  // Ranking
  if (ctx.rankings.length === 0) {
    parts.push("RANKING: sem dados ainda");
  } else {
    const lines = ctx.rankings.map(
      (r, i) =>
        `${i + 1}. ${r.name} — ${r.points} pts | ${r.goals} gols | ${r.assists} assist | ${r.games_played} jogos`
    );
    parts.push(`RANKING TOP ${ctx.rankings.length}\n${lines.join("\n")}`);
  }

  // Cobranças do usuário
  if (ctx.myCharges.length === 0) {
    parts.push("MINHAS COBRANÇAS PENDENTES: nenhuma");
  } else {
    const lines = ctx.myCharges.map(
      (c) =>
        `- ${c.type} ${fmtMoney(c.amount_cents)} venc. ${c.due_date ? fmtDate(c.due_date) : "—"}${c.event_date ? ` (pelada ${fmtDate(c.event_date)})` : ""}`
    );
    parts.push(`MINHAS COBRANÇAS PENDENTES\n${lines.join("\n")}`);
  }

  // Admin: cobranças do grupo + saldo
  if (ctx.groupPendingCharges !== undefined) {
    if (ctx.groupPendingCharges.length === 0) {
      parts.push("COBRANÇAS PENDENTES DO GRUPO: nenhuma");
    } else {
      const total = ctx.groupPendingCharges.reduce((s, c) => s + c.amount_cents, 0);
      const lines = ctx.groupPendingCharges.map(
        (c) =>
          `- ${c.member_name}: ${c.type} ${fmtMoney(c.amount_cents)} venc. ${c.due_date ? fmtDate(c.due_date) : "—"}`
      );
      parts.push(
        `COBRANÇAS PENDENTES DO GRUPO (total: ${fmtMoney(total)})\n${lines.join("\n")}`
      );
    }

    if (ctx.groupWalletCents != null) {
      parts.push(`SALDO DA CARTEIRA DO GRUPO: ${fmtMoney(ctx.groupWalletCents)}`);
    }
  }

  return parts.join("\n\n");
}
