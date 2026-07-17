import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RankingsCard } from "@/components/group/rankings-card";
import { MyStatsCard } from "@/components/group/my-stats-card";
import { RecentMatchesCard } from "@/components/group/recent-matches-card";
import { UpcomingEventsCard } from "@/components/group/upcoming-events-card";
import { Settings, Plus, ChevronLeft, DollarSign, MapPin, Clock, ArrowRight, Trophy } from "lucide-react";
import { getGroupAccessContext } from "@/lib/group-access";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { GroupStatusNotice } from "@/components/groups/group-status-notice";
import { GroupTour } from "@/components/tour/GroupTour";
import { PaymentButton } from "@/components/groups/payment-button";
import { PitchBackground } from "@/components/ui/pitch-background";
import {
  DEFAULT_TIEBREAKERS,
  type TiebreakerKey,
  normalizeTiebreakers,
} from "@/lib/scoring-tiebreakers";

const WEEKDAY_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function formatHeroDate(iso: string) {
  const d = new Date(iso);
  const weekday = WEEKDAY_PT[d.getDay()];
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { weekday, time };
}

function relativeDays(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return "passou";
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

type RouteParams = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ seasonId?: string }>;
};

type UpcomingEvent = {
  id: string;
  starts_at: string;
  venue_name: string | null;
  status: string;
  confirmed_count: number;
  max_players: number;
};

type Stats = {
  topScorers: Array<{ id: string; name: string; goals: string; games: string }>;
  topAssisters: Array<{ id: string; name: string; assists: string; games: string }>;
  topGoalkeepers: Array<{ id: string; name: string; goals_conceded: string; games: string }>;
  recentMatches: Array<{
    id: string;
    starts_at: string;
    venue_name: string;
    teams: Array<{ id: string; name: string; is_winner: boolean; goals: number }> | null;
  }>;
  playerFrequency: Array<{
    id: string;
    name: string;
    games_played: string;
    games_dm: string;
    games_absent: string;
    total_games: string;
    frequency_percentage: string;
  }>;
};

type GeneralRanking = {
  id: string;
  name: string;
  score: number;
  games: number;
  goals: number;
  assists: number;
  mvps: number;
  wins: number;
  draws: number;
  losses: number;
  team_goals: number;
  team_goals_conceded: number;
  goal_difference: number;
  available_matches: number;
  dm_games: number;
};

type MyStats = {
  gamesPlayed: number;
  goals: number;
  assists: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  averageRating: string | null;
  wins: number;
  losses: number;
  mvpCount: number;
  tags: Record<string, number>;
};

type ScoringConfig = {
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  pointsGoal: number;
  pointsAssist: number;
  pointsMvp: number;
  pointsPresence: number;
  rankingMode: "standard" | "complete";
  tiebreakers: TiebreakerKey[];
};

const TIEBREAKER_FIELD: Record<TiebreakerKey, { field: keyof GeneralRanking; dir: "asc" | "desc" }> = {
  wins: { field: "wins", dir: "desc" },
  goal_difference: { field: "goal_difference", dir: "desc" },
  goals: { field: "goals", dir: "desc" },
  games_played: { field: "games", dir: "desc" },
  games_played_asc: { field: "games", dir: "asc" },
  assists: { field: "assists", dir: "desc" },
  mvp_count: { field: "mvps", dir: "desc" },
};

function compareGeneralRankingTiebreakers(a: GeneralRanking, b: GeneralRanking, tiebreakers: TiebreakerKey[]) {
  for (const key of tiebreakers) {
    const entry = TIEBREAKER_FIELD[key];
    const av = a[entry.field] as number;
    const bv = b[entry.field] as number;
    const delta = entry.dir === "asc" ? av - bv : bv - av;
    if (delta !== 0) return delta;
  }

  return 0;
}

export default async function GroupPage({ params, searchParams }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { groupId } = await params;
  const { seasonId } = await searchParams;

  // Buscar informações do grupo
  const group = await getGroupAccessContext(groupId, user);

  if (!group || (!group.userRole && !group.isSystemAdmin)) {
    redirect("/dashboard");
  }

  if (group.status !== "active" && !group.isSystemAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar para o dashboard
                </Button>
              </Link>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h1 className="mb-2 text-4xl font-bold">{group.name}</h1>
                {group.description && <p className="text-lg text-gray-200">{group.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <GroupStatusBadge status={group.status} className="border-white/20 bg-white/10 text-white" />
                {group.userRole && (
                  <Badge
                    variant={group.userRole === "admin" ? "default" : "secondary"}
                    className="border-white/30 bg-white/20 text-white"
                  >
                    {group.userRole === "admin" ? "Admin" : "Membro"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-4 py-8">
          <GroupStatusNotice
            status={group.status}
            reason={group.statusReason}
            groupId={group.id}
            isAdmin={group.userRole === "admin"}
          />
          {group.status === "pending_payment" && group.userRole === "admin" && (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Para ativar o grupo, realize o pagamento da assinatura.
              </p>
              <PaymentButton groupId={group.id} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const isRankingMode = group.appMode === "ranking";

  // Batch 1: queries independentes rodando em paralelo
  const seasonLookup = seasonId === "all"
    ? Promise.resolve(null)
    : seasonId
      ? sql`SELECT starts_at, ends_at, name, status FROM seasons WHERE id = ${seasonId} AND group_id = ${groupId}`.then(r => r[0] ?? null)
      : sql`SELECT starts_at, ends_at, name, status FROM seasons WHERE group_id = ${groupId} AND status = 'active' LIMIT 1`.then(r => r[0] ?? null);

  const [upcomingEvents, allSeasons, scoringConfigResult, seasonRow] = await Promise.all([
    sql`
      SELECT
        e.id,
        e.starts_at,
        e.status,
        e.max_players,
        v.name as venue_name,
        (SELECT COUNT(*) FROM event_attendance WHERE event_id = e.id AND status = 'yes') as confirmed_count
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE e.group_id = ${groupId} AND e.status IN ('scheduled', 'live')
      ORDER BY e.starts_at ASC
      LIMIT 5
    ` as unknown as Promise<UpcomingEvent[]>,
    sql`
      SELECT id, name, status, starts_at, ends_at
      FROM seasons
      WHERE group_id = ${groupId}
      ORDER BY starts_at DESC
    `,
    sql`
      SELECT
        points_win as "pointsWin",
        points_draw as "pointsDraw",
        points_loss as "pointsLoss",
        points_goal as "pointsGoal",
        points_assist as "pointsAssist",
        points_mvp as "pointsMvp",
        points_presence as "pointsPresence",
        ranking_mode as "rankingMode",
        tiebreakers
      FROM scoring_configs
      WHERE group_id = ${groupId}
    `,
    seasonLookup,
  ]);

  const s = seasonRow as { starts_at: string; ends_at: string; name: string; status: string } | null;
  const seasonFilter = s ? { startsAt: s.starts_at, endsAt: s.ends_at, name: s.name, status: s.status } : null;

  const events = seasonFilter
    ? await sql`
        SELECT id FROM events
        WHERE group_id = ${groupId} AND status = 'finished'
          AND starts_at >= ${seasonFilter.startsAt}
          AND starts_at <= ${seasonFilter.endsAt}
      `
    : await sql`
        SELECT id FROM events
        WHERE group_id = ${groupId} AND status = 'finished'
      `;

  const eventIds = (events as unknown as Array<{ id: string }>).map(e => e.id);

  const [scoringConfigResult0] = scoringConfigResult;

  // Configuração padrão de futebol (V=3, E=1, D=0)
  const scoringConfig: ScoringConfig = (scoringConfigResult0 as ScoringConfig) || {
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    pointsGoal: 0,
    pointsAssist: 0,
    pointsMvp: 0,
    pointsPresence: 0,
    rankingMode: "standard" as const,
    tiebreakers: [...DEFAULT_TIEBREAKERS],
  };
  scoringConfig.tiebreakers = normalizeTiebreakers(
    (scoringConfigResult0 as { tiebreakers?: unknown } | undefined)?.tiebreakers
  );

  // Inicializar estruturas vazias
  const stats: Stats = {
    topScorers: [],
    topAssisters: [],
    topGoalkeepers: [],
    recentMatches: [],
    playerFrequency: [],
  };

  const myStats: MyStats = {
    gamesPlayed: 0,
    goals: 0,
    assists: 0,
    saves: 0,
    yellowCards: 0,
    redCards: 0,
    averageRating: null,
    wins: 0,
    losses: 0,
    mvpCount: 0,
    tags: {},
  };

  // Batch 2 + ranking: todas as queries dependem de eventIds — rodam em paralelo
  let generalRanking: GeneralRanking[] = [];

  if (eventIds.length > 0) {
    try {
      const [
        topScorers,
        topAssisters,
        topGoalkeepers,
        recentMatches,
        playerFrequency,
        myEvents,
        rankingData,
      ] = await Promise.all([
        sql`
          WITH player_games AS (
            SELECT tm.user_id, COUNT(DISTINCT t.event_id) as total_games
            FROM team_members tm
            INNER JOIN teams t ON tm.team_id = t.id
            WHERE t.event_id = ANY(${eventIds})
            GROUP BY tm.user_id
          )
          SELECT u.id, u.name, COUNT(*) as goals,
            COALESCE(pg.total_games, 0) as games
          FROM event_actions ea
          INNER JOIN users u ON ea.subject_user_id = u.id
          LEFT JOIN player_games pg ON pg.user_id = u.id
          WHERE ea.event_id = ANY(${eventIds}) AND ea.action_type = 'goal'
          GROUP BY u.id, u.name, pg.total_games
          ORDER BY goals DESC LIMIT 10
        `,
        sql`
          WITH player_games AS (
            SELECT tm.user_id, COUNT(DISTINCT t.event_id) as total_games
            FROM team_members tm
            INNER JOIN teams t ON tm.team_id = t.id
            WHERE t.event_id = ANY(${eventIds})
            GROUP BY tm.user_id
          )
          SELECT u.id, u.name, COUNT(*) as assists,
            COALESCE(pg.total_games, 0) as games
          FROM event_actions ea
          INNER JOIN users u ON ea.subject_user_id = u.id
          LEFT JOIN player_games pg ON pg.user_id = u.id
          WHERE ea.event_id = ANY(${eventIds}) AND ea.action_type = 'assist'
          GROUP BY u.id, u.name, pg.total_games
          ORDER BY assists DESC LIMIT 10
        `,
        sql`
          WITH goalkeeper_games AS (
            SELECT
              ea.user_id,
              t.id as team_id,
              t.event_id
            FROM event_attendance ea
            INNER JOIN team_members tm ON tm.user_id = ea.user_id
            INNER JOIN teams t ON t.id = tm.team_id AND t.event_id = ea.event_id
            WHERE ea.event_id = ANY(${eventIds})
              AND ea.status = 'yes'
              AND ea.role = 'gk'
          )
          SELECT
            u.id,
            u.name,
            COUNT(DISTINCT gg.event_id) as games,
            SUM(
              (
                SELECT COUNT(*)
                FROM event_actions ea_goal
                INNER JOIN teams t_opp ON t_opp.id = ea_goal.team_id
                WHERE ea_goal.event_id = gg.event_id
                  AND ea_goal.action_type = 'goal'
                  AND t_opp.id != gg.team_id
              ) + (
                SELECT COUNT(*)
                FROM event_actions ea_own_goal
                WHERE ea_own_goal.event_id = gg.event_id
                  AND ea_own_goal.action_type = 'own_goal'
                  AND ea_own_goal.team_id = gg.team_id
              )
            )::int as goals_conceded
          FROM goalkeeper_games gg
          INNER JOIN users u ON u.id = gg.user_id
          GROUP BY u.id, u.name
          ORDER BY goals_conceded ASC, games DESC, u.name ASC
          LIMIT 10
        `,
        sql`
          SELECT
            e.id, e.starts_at, v.name as venue_name,
            (
              SELECT json_agg(json_build_object(
                'id', t.id, 'name', t.name, 'is_winner', t.is_winner,
                'goals', (SELECT COUNT(*) FROM event_actions ea2 WHERE ea2.team_id = t.id AND ea2.action_type = 'goal' AND ea2.event_id = e.id)
                  + (SELECT COUNT(*) FROM event_actions ea3 INNER JOIN teams t_opp ON ea3.team_id = t_opp.id WHERE ea3.action_type = 'own_goal' AND t_opp.event_id = e.id AND ea3.team_id != t.id AND ea3.event_id = e.id)
              ))
              FROM teams t WHERE t.event_id = e.id
            ) as teams
          FROM events e
          LEFT JOIN venues v ON e.venue_id = v.id
          WHERE e.id = ANY(${eventIds})
          ORDER BY e.starts_at DESC LIMIT 5
        `,
        sql`
          WITH recent_events AS (
            SELECT id FROM events
            WHERE group_id = ${groupId} AND status = 'finished'
              AND id = ANY(${eventIds})
            ORDER BY starts_at DESC LIMIT 10
          ),
          total_count AS (
            SELECT COUNT(*) as total FROM recent_events
          )
          SELECT
            u.id,
            u.name,
            COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'yes') as games_played,
            COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'dm') as games_dm,
            COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'no') as games_absent,
            (SELECT total FROM total_count) as total_games,
            ROUND(
              COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'yes') * 100.0 /
              NULLIF((SELECT total FROM total_count) - COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'dm'), 0),
              1
            ) as frequency_percentage
          FROM users u
          INNER JOIN group_members gm ON u.id = gm.user_id
          LEFT JOIN event_attendance ea ON ea.user_id = u.id AND ea.event_id IN (SELECT id FROM recent_events)
          WHERE gm.group_id = ${groupId}
          GROUP BY u.id, u.name
          HAVING COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'yes') > 0
             OR COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'dm') > 0
             OR COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'no') > 0
          ORDER BY games_played DESC, frequency_percentage DESC
        `,
        sql`
          SELECT DISTINCT e.id FROM events e
          INNER JOIN teams t ON t.event_id = e.id
          INNER JOIN team_members tm ON tm.team_id = t.id
          WHERE e.group_id = ${groupId} AND e.status = 'finished'
            AND tm.user_id = ${user.id}
            AND e.id = ANY(${eventIds})
        `,
        sql`
          WITH player_games AS (
            SELECT DISTINCT
              tm.user_id,
              t.event_id
            FROM team_members tm
            INNER JOIN teams t ON tm.team_id = t.id
            WHERE t.event_id = ANY(${eventIds})
          ),
          game_results AS (
            SELECT
              pg.user_id,
              pg.event_id,
              t_player.id as player_team_id,
              (SELECT COUNT(*)
               FROM event_actions ea
               WHERE ea.team_id = t_player.id
                 AND ea.event_id = pg.event_id
                 AND ea.action_type = 'goal'
              ) + (SELECT COUNT(*)
               FROM event_actions ea
               INNER JOIN teams t_opp ON ea.team_id = t_opp.id
               WHERE ea.action_type = 'own_goal'
                 AND t_opp.event_id = pg.event_id
                 AND ea.team_id != t_player.id
                 AND ea.event_id = pg.event_id
              ) as team_goals,
              (SELECT COUNT(*)
               FROM event_actions ea
               INNER JOIN teams t ON ea.team_id = t.id
               WHERE t.event_id = pg.event_id
                 AND t.id != t_player.id
                 AND ea.action_type = 'goal'
                 AND ea.event_id = pg.event_id
              ) + (SELECT COUNT(*)
               FROM event_actions ea
               WHERE ea.team_id = t_player.id
                 AND ea.event_id = pg.event_id
                 AND ea.action_type = 'own_goal'
              ) as opponent_goals
            FROM player_games pg
            INNER JOIN team_members tm ON tm.user_id = pg.user_id
            INNER JOIN teams t_player ON t_player.id = tm.team_id AND t_player.event_id = pg.event_id
          )
          SELECT
            u.id,
            u.name,
            (SELECT COUNT(*) FROM player_games WHERE user_id = u.id)::int as games,
            (SELECT COUNT(*) FROM event_actions ea WHERE ea.subject_user_id = u.id AND ea.event_id = ANY(${eventIds}) AND ea.action_type = 'goal')::int as goals,
            (SELECT COUNT(*) FROM event_actions ea WHERE ea.subject_user_id = u.id AND ea.event_id = ANY(${eventIds}) AND ea.action_type = 'assist')::int as assists,
            (SELECT COUNT(*) FROM player_ratings pr WHERE pr.rated_user_id = u.id AND pr.event_id = ANY(${eventIds}) AND 'mvp' = ANY(pr.tags))::int as mvps,
            (SELECT COUNT(*) FROM game_results gr WHERE gr.user_id = u.id AND gr.team_goals > gr.opponent_goals)::int as wins,
            (SELECT COUNT(*) FROM game_results gr WHERE gr.user_id = u.id AND gr.team_goals < gr.opponent_goals)::int as losses,
            (SELECT COUNT(*) FROM game_results gr WHERE gr.user_id = u.id AND gr.team_goals = gr.opponent_goals)::int as draws,
            (SELECT COALESCE(SUM(gr.team_goals), 0) FROM game_results gr WHERE gr.user_id = u.id)::int as team_goals,
            (SELECT COALESCE(SUM(gr.opponent_goals), 0) FROM game_results gr WHERE gr.user_id = u.id)::int as team_goals_conceded,
            (SELECT COUNT(DISTINCT ea.event_id) FROM event_attendance ea WHERE ea.user_id = u.id AND ea.event_id = ANY(${eventIds}) AND ea.status = 'dm')::int as dm_games
          FROM users u
          INNER JOIN group_members gm ON u.id = gm.user_id
          WHERE gm.group_id = ${groupId}
            AND EXISTS (SELECT 1 FROM player_games WHERE user_id = u.id)
        `,
      ]);

      stats.topScorers = topScorers as unknown as typeof stats.topScorers;
      stats.topAssisters = topAssisters as unknown as typeof stats.topAssisters;
      stats.topGoalkeepers = topGoalkeepers as unknown as typeof stats.topGoalkeepers;
      stats.recentMatches = recentMatches as unknown as typeof stats.recentMatches;
      stats.playerFrequency = playerFrequency as unknown as typeof stats.playerFrequency;

      // Batch 3: minhas stats dependem de myEventIds
      const myEventIds = (myEvents as unknown as Array<{ id: string }>).map(e => e.id);

      if (myEventIds.length > 0) {
        myStats.gamesPlayed = myEventIds.length;

        const [actions, winLoss, tagsResult] = await Promise.all([
          sql`
            SELECT action_type, COUNT(*) as count
            FROM event_actions
            WHERE event_id = ANY(${myEventIds}) AND subject_user_id = ${user.id}
            GROUP BY action_type
          `,
          sql`
            WITH my_game_results AS (
              SELECT
                t_player.event_id,
                (SELECT COUNT(*) FROM event_actions ea WHERE ea.team_id = t_player.id AND ea.event_id = t_player.event_id AND ea.action_type = 'goal')
                + (SELECT COUNT(*) FROM event_actions ea INNER JOIN teams t_opp ON ea.team_id = t_opp.id WHERE ea.action_type = 'own_goal' AND t_opp.event_id = t_player.event_id AND ea.team_id != t_player.id AND ea.event_id = t_player.event_id) as team_goals,
                (SELECT COUNT(*) FROM event_actions ea INNER JOIN teams t2 ON ea.team_id = t2.id WHERE t2.event_id = t_player.event_id AND t2.id != t_player.id AND ea.action_type = 'goal' AND ea.event_id = t_player.event_id)
                + (SELECT COUNT(*) FROM event_actions ea WHERE ea.team_id = t_player.id AND ea.event_id = t_player.event_id AND ea.action_type = 'own_goal') as opponent_goals
              FROM team_members tm
              INNER JOIN teams t_player ON tm.team_id = t_player.id
              WHERE tm.user_id = ${user.id} AND t_player.event_id = ANY(${myEventIds})
            )
            SELECT
              COUNT(*) FILTER (WHERE team_goals > opponent_goals) as wins,
              COUNT(*) FILTER (WHERE team_goals < opponent_goals) as losses,
              COUNT(*) FILTER (WHERE team_goals = opponent_goals) as draws
            FROM my_game_results
          `,
          sql`
            SELECT UNNEST(tags) as tag, COUNT(*) as count
            FROM player_ratings
            WHERE event_id = ANY(${myEventIds}) AND rated_user_id = ${user.id} AND tags IS NOT NULL
            GROUP BY tag ORDER BY count DESC
          `,
        ]);

        (actions as unknown as Array<{ action_type: string; count: string }>).forEach((a) => {
          if (a.action_type === 'goal') myStats.goals = parseInt(a.count);
          if (a.action_type === 'assist') myStats.assists = parseInt(a.count);
          if (a.action_type === 'save') myStats.saves = parseInt(a.count);
          if (a.action_type === 'yellow_card') myStats.yellowCards = parseInt(a.count);
          if (a.action_type === 'red_card') myStats.redCards = parseInt(a.count);
        });
        if (winLoss.length > 0) {
          myStats.wins = parseInt((winLoss[0] as any).wins) || 0;
          myStats.losses = parseInt((winLoss[0] as any).losses) || 0;
        }
        (tagsResult as unknown as Array<{ tag: string; count: string }>).forEach((t) => {
          myStats.tags[t.tag] = parseInt(t.count);
          if (t.tag === 'mvp') myStats.mvpCount = parseInt(t.count);
        });
      }

      generalRanking = (rankingData as any[]).map((player) => ({
        ...player,
        goal_difference: player.team_goals - player.team_goals_conceded,
        available_matches: eventIds.length - player.dm_games,
        score:
          (player.wins * scoringConfig.pointsWin) +
          (player.draws * scoringConfig.pointsDraw) +
          (player.losses * scoringConfig.pointsLoss) +
          (player.goals * scoringConfig.pointsGoal) +
          (player.assists * scoringConfig.pointsAssist) +
          (player.mvps * scoringConfig.pointsMvp) +
          (player.games * scoringConfig.pointsPresence),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return compareGeneralRankingTiebreakers(a, b, scoringConfig.tiebreakers);
      }) as unknown as GeneralRanking[];

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  const nextEvent = upcomingEvents[0];
  const isAdmin = group.userRole === "admin" || group.isSystemAdmin;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Breadcrumb + back */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            Meus Grupos
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium truncate">{group.name}</span>
        </div>

        {/* Header — group name + actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-eyebrow text-muted-foreground mb-1">
              {isRankingMode ? "Grupo em modo ranking" : "Grupo em modo controle"}
            </div>
            <h1 className="font-display text-4xl tracking-display sm:text-5xl break-words">
              {group.name}
            </h1>
            {group.description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{group.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <GroupStatusBadge status={group.status} />
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {group.isSystemAdmin ? "Admin Sistema" : group.userRole === "admin" ? "Admin" : "Membro"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/groups/${groupId}/championships`}>
                <Trophy className="h-4 w-4 mr-2" />
                Campeonatos
              </Link>
            </Button>
            {isAdmin && (
              <>
                <Button asChild variant="outline" size="sm" data-tour="configuracoes">
                  <Link href={`/groups/${groupId}/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/groups/${groupId}/payments`}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pagamentos
                  </Link>
                </Button>
                <Button asChild size="sm" data-tour="criar-evento">
                  <Link href={`/groups/${groupId}/events/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Evento
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* HERO — next event on pitch (only if there is one) */}
        {nextEvent && (
          <Link
            href={`/events/${nextEvent.id}`}
            className="mb-8 block overflow-hidden rounded-2xl shadow-warm-lg transition-transform hover:scale-[1.005]"
          >
            <div className="relative">
              <PitchBackground height={220} />
              <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-7 text-primary-foreground">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-full bg-navy/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                      Próxima pelada
                    </span>
                    <h2
                      className="mt-3 font-display tracking-scoreboard"
                      style={{
                        fontSize: "clamp(32px, 6vw, 48px)",
                        lineHeight: 0.9,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(() => {
                        const { weekday, time } = formatHeroDate(nextEvent.starts_at);
                        return `${weekday} · ${time}`;
                      })()}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-90">
                      {nextEvent.venue_name && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {nextEvent.venue_name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {relativeDays(nextEvent.starts_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-eyebrow opacity-70">
                      Presença
                    </div>
                    <div className="font-display num" style={{ fontSize: 44, lineHeight: 1 }}>
                      {nextEvent.confirmed_count}
                      <span style={{ opacity: 0.5, fontSize: 22 }}>/{nextEvent.max_players}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-pitch-glow px-4 py-2 text-sm font-semibold text-navy shadow-glow">
                    Ver detalhes
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Próximas Partidas */}
        <div className="mb-8" data-tour="proximas-partidas">
          <UpcomingEventsCard
            events={upcomingEvents}
            groupId={groupId}
            userRole={group.isSystemAdmin ? "admin" : group.userRole || "member"}
          />
        </div>

        {isRankingMode ? (
          <>
            {/* Minhas Estatísticas */}
            <div className="mb-8">
              <MyStatsCard {...myStats} />
            </div>

            {/* Rankings com Tabs */}
            <div className="mb-8" data-tour="rankings">
              <RankingsCard
                topScorers={stats.topScorers}
                topAssisters={stats.topAssisters}
                topGoalkeepers={stats.topGoalkeepers}
                generalRanking={generalRanking}
                playerFrequency={stats.playerFrequency}
                currentUserId={user.id}
                scoringConfig={scoringConfig}
                seasons={allSeasons as unknown as Array<{ id: string; name: string; status: string; starts_at: string; ends_at: string }>}
                currentSeasonId={seasonId}
                currentSeasonName={seasonId === "all" ? "Geral" : seasonFilter?.name}
                groupId={groupId}
              />
            </div>
          </>
        ) : (
          <div className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="text-xl font-semibold">Controle de partidas</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Este grupo esta no modo somente controle. Rankings, pontuacao e estatisticas competitivas ficam ocultos, enquanto eventos, confirmacoes, times, jogo ao vivo, pagamentos e historico seguem disponiveis.
            </p>
          </div>
        )}

        {/* Jogos Recentes */}
        <div className="mb-8">
          <RecentMatchesCard matches={stats.recentMatches} groupId={groupId} />
        </div>
      </div>

      <GroupTour isAdmin={isAdmin} />
    </div>
  );
}
