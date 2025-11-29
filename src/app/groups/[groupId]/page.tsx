import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { RankingsCard } from "@/components/group/rankings-card";
import { MyStatsCard } from "@/components/group/my-stats-card";
import { RecentMatchesCard } from "@/components/group/recent-matches-card";
import { UpcomingEventsCard } from "@/components/group/upcoming-events-card";
import { Settings, Plus, ChevronLeft, DollarSign } from "lucide-react";

type RouteParams = {
  params: Promise<{ groupId: string }>;
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
  topGoalkeepers: Array<{ id: string; name: string; saves: string; games: string }>;
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

export default async function GroupPage({ params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { groupId } = await params;

  // Buscar informações do grupo
  const groupResult = await sql`
    SELECT
      g.id,
      g.name,
      g.description,
      g.photo_url,
      gm.role as user_role
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE g.id = ${groupId} AND gm.user_id = ${user.id}
  `;

  if (groupResult.length === 0) {
    redirect("/dashboard");
  }

  const group = groupResult[0];

  // Buscar próximos eventos do grupo
  const upcomingEvents = await sql`
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
  ` as unknown as UpcomingEvent[];

  // Buscar eventos finalizados do grupo
  const events = await sql`
    SELECT id FROM events
    WHERE group_id = ${groupId} AND status = 'finished'
  `;

  const eventIds = (events as unknown as Array<{ id: string }>).map(e => e.id);

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

  // Se houver eventos, buscar estatísticas
  if (eventIds.length > 0) {
    try {
      // Artilheiros
      const topScorers = await sql`
        SELECT u.id, u.name, COUNT(*) as goals,
          COUNT(DISTINCT ea.event_id) as games
        FROM event_actions ea
        INNER JOIN users u ON ea.subject_user_id = u.id
        WHERE ea.event_id = ANY(${eventIds}) AND ea.action_type = 'goal'
        GROUP BY u.id, u.name
        ORDER BY goals DESC LIMIT 10
      `;
      stats.topScorers = topScorers as Array<{ id: string; name: string; goals: string; games: string }>;

      // Garçons
      const topAssisters = await sql`
        SELECT u.id, u.name, COUNT(*) as assists,
          COUNT(DISTINCT ea.event_id) as games
        FROM event_actions ea
        INNER JOIN users u ON ea.subject_user_id = u.id
        WHERE ea.event_id = ANY(${eventIds}) AND ea.action_type = 'assist'
        GROUP BY u.id, u.name
        ORDER BY assists DESC LIMIT 10
      `;
      stats.topAssisters = topAssisters as Array<{ id: string; name: string; assists: string; games: string }>;

      // Goleiros
      const topGoalkeepers = await sql`
        SELECT u.id, u.name, COUNT(*) as saves,
          COUNT(DISTINCT ea.event_id) as games
        FROM event_actions ea
        INNER JOIN users u ON ea.subject_user_id = u.id
        WHERE ea.event_id = ANY(${eventIds}) AND ea.action_type = 'save'
        GROUP BY u.id, u.name
        ORDER BY saves DESC LIMIT 10
      `;
      stats.topGoalkeepers = topGoalkeepers as Array<{ id: string; name: string; saves: string; games: string }>;

      // Jogos recentes
      const recentMatches = await sql`
        SELECT
          e.id, e.starts_at, v.name as venue_name,
          (
            SELECT json_agg(json_build_object(
              'id', t.id, 'name', t.name, 'is_winner', t.is_winner,
              'goals', (SELECT COUNT(*) FROM event_actions ea2 WHERE ea2.team_id = t.id AND ea2.action_type = 'goal')
            ))
            FROM teams t WHERE t.event_id = e.id
          ) as teams
        FROM events e
        LEFT JOIN venues v ON e.venue_id = v.id
        WHERE e.group_id = ${groupId} AND e.status = 'finished'
        ORDER BY e.starts_at DESC LIMIT 5
      `;
      stats.recentMatches = recentMatches as typeof stats.recentMatches;

      // Frequência
      const playerFrequency = await sql`
        WITH recent_events AS (
          SELECT id FROM events
          WHERE group_id = ${groupId} AND status = 'finished'
          ORDER BY starts_at DESC LIMIT 10
        ),
        total_count AS (
          SELECT COUNT(*) as total FROM recent_events
        )
        SELECT 
          u.id, 
          u.name,
          COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'yes' AND ea.checked_in_at IS NOT NULL) as games_played,
          COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'dm') as games_dm,
          COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'no') as games_absent,
          (SELECT total FROM total_count) as total_games,
          ROUND(
            COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'yes' AND ea.checked_in_at IS NOT NULL) * 100.0 / 
            NULLIF((SELECT total FROM total_count) - COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'dm'), 0), 
            1
          ) as frequency_percentage
        FROM users u
        INNER JOIN group_members gm ON u.id = gm.user_id
        LEFT JOIN event_attendance ea ON ea.user_id = u.id AND ea.event_id IN (SELECT id FROM recent_events)
        WHERE gm.group_id = ${groupId}
        GROUP BY u.id, u.name
        HAVING COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'yes' AND ea.checked_in_at IS NOT NULL) > 0
           OR COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'dm') > 0
           OR COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'no') > 0
        ORDER BY games_played DESC, frequency_percentage DESC
        LIMIT 15
      `;
      stats.playerFrequency = playerFrequency as typeof stats.playerFrequency;

      // Minhas estatísticas
      const myEvents = await sql`
        SELECT e.id FROM events e
        INNER JOIN event_attendance ea ON e.id = ea.event_id
        WHERE e.group_id = ${groupId} AND e.status = 'finished'
          AND ea.user_id = ${user.id} AND ea.checked_in_at IS NOT NULL
      `;
      const myEventIds = (myEvents as unknown as Array<{ id: string }>).map(e => e.id);

      if (myEventIds.length > 0) {
        myStats.gamesPlayed = myEventIds.length;

        const actions = await sql`
          SELECT action_type, COUNT(*) as count
          FROM event_actions
          WHERE event_id = ANY(${myEventIds}) AND subject_user_id = ${user.id}
          GROUP BY action_type
        `;
        (actions as unknown as Array<{ action_type: string; count: string }>).forEach((a) => {
          if (a.action_type === 'goal') myStats.goals = parseInt(a.count);
          if (a.action_type === 'assist') myStats.assists = parseInt(a.count);
          if (a.action_type === 'save') myStats.saves = parseInt(a.count);
          if (a.action_type === 'yellow_card') myStats.yellowCards = parseInt(a.count);
          if (a.action_type === 'red_card') myStats.redCards = parseInt(a.count);
        });

        const winLoss = await sql`
          SELECT t.is_winner, COUNT(*) as count
          FROM team_members tm
          INNER JOIN teams t ON tm.team_id = t.id
          WHERE t.event_id = ANY(${myEventIds}) AND tm.user_id = ${user.id} AND t.is_winner IS NOT NULL
          GROUP BY t.is_winner
        `;
        (winLoss as unknown as Array<{ is_winner: boolean; count: string }>).forEach((wl) => {
          if (wl.is_winner === true) myStats.wins = parseInt(wl.count);
          if (wl.is_winner === false) myStats.losses = parseInt(wl.count);
        });

        const tagsResult = await sql`
          SELECT UNNEST(tags) as tag, COUNT(*) as count
          FROM player_ratings
          WHERE event_id = ANY(${myEventIds}) AND rated_user_id = ${user.id} AND tags IS NOT NULL
          GROUP BY tag ORDER BY count DESC
        `;
        (tagsResult as unknown as Array<{ tag: string; count: string }>).forEach((t) => {
          myStats.tags[t.tag] = parseInt(t.count);
          if (t.tag === 'mvp') myStats.mvpCount = parseInt(t.count);
        });
      }

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  // Calcular ranking geral
  let generalRanking: GeneralRanking[] = [];

  if (eventIds.length > 0) {
    try {
      const rankingData = await sql`
        WITH player_games AS (
          -- Eventos que cada jogador jogou (está em um time do evento finalizado)
          SELECT DISTINCT
            tm.user_id,
            t.event_id
          FROM team_members tm
          INNER JOIN teams t ON tm.team_id = t.id
          WHERE t.event_id = ANY(${eventIds})
        ),
        game_results AS (
          -- Resultado de cada jogo para cada jogador
          SELECT
            pg.user_id,
            pg.event_id,
            t_player.id as player_team_id,

            -- Gols do time do jogador neste evento
            (SELECT COUNT(*)
             FROM event_actions ea
             WHERE ea.team_id = t_player.id
               AND ea.event_id = pg.event_id
               AND ea.action_type = 'goal'
            ) as team_goals,

            -- Gols de todos os outros times neste evento (assumindo 2 times por evento)
            (SELECT COUNT(*)
             FROM event_actions ea
             INNER JOIN teams t ON ea.team_id = t.id
             WHERE t.event_id = pg.event_id
               AND t.id != t_player.id
               AND ea.action_type = 'goal'
            ) as opponent_goals

          FROM player_games pg
          INNER JOIN team_members tm ON tm.user_id = pg.user_id
          INNER JOIN teams t_player ON t_player.id = tm.team_id AND t_player.event_id = pg.event_id
        )
        SELECT
          u.id,
          u.name,

          -- Jogos jogados
          (SELECT COUNT(*) FROM player_games WHERE user_id = u.id)::int as games,

          -- Gols do jogador
          (SELECT COUNT(*)
           FROM event_actions ea
           WHERE ea.subject_user_id = u.id
             AND ea.event_id = ANY(${eventIds})
             AND ea.action_type = 'goal'
          )::int as goals,

          -- Assistências
          (SELECT COUNT(*)
           FROM event_actions ea
           WHERE ea.subject_user_id = u.id
             AND ea.event_id = ANY(${eventIds})
             AND ea.action_type = 'assist'
          )::int as assists,

          -- MVPs
          (SELECT COUNT(*)
           FROM player_ratings pr
           WHERE pr.rated_user_id = u.id
             AND pr.event_id = ANY(${eventIds})
             AND 'mvp' = ANY(pr.tags)
          )::int as mvps,

          -- Vitórias (calculado por gols)
          (SELECT COUNT(*)
           FROM game_results gr
           WHERE gr.user_id = u.id
             AND gr.team_goals > gr.opponent_goals
          )::int as wins,

          -- Derrotas (calculado por gols)
          (SELECT COUNT(*)
           FROM game_results gr
           WHERE gr.user_id = u.id
             AND gr.team_goals < gr.opponent_goals
          )::int as losses,

          -- Empates (calculado por gols)
          (SELECT COUNT(*)
           FROM game_results gr
           WHERE gr.user_id = u.id
             AND gr.team_goals = gr.opponent_goals
          )::int as draws,

          -- Total de gols do time
          (SELECT COALESCE(SUM(gr.team_goals), 0)
           FROM game_results gr
           WHERE gr.user_id = u.id
          )::int as team_goals,

          -- Total de gols sofridos
          (SELECT COALESCE(SUM(gr.opponent_goals), 0)
           FROM game_results gr
           WHERE gr.user_id = u.id
          )::int as team_goals_conceded,

          -- DM games
          (SELECT COUNT(DISTINCT ea.event_id)
           FROM event_attendance ea
           WHERE ea.user_id = u.id
             AND ea.event_id = ANY(${eventIds})
             AND ea.status = 'dm'
          )::int as dm_games

        FROM users u
        INNER JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = ${groupId}
          AND EXISTS (
            SELECT 1 FROM player_games WHERE user_id = u.id
          )
      `;

      // Calcular campos derivados e ordenar
      generalRanking = (rankingData as any[]).map((player) => ({
        ...player,
        goal_difference: player.team_goals - player.team_goals_conceded,
        available_matches: eventIds.length - player.dm_games,
        score:
          player.games * 2 +
          player.goals * 3 +
          player.assists * 2 +
          player.mvps * 5 +
          player.wins * 1,
      }))
      .sort((a, b) => {
        // Ordenar por score, depois games, depois goals
        if (b.score !== a.score) return b.score - a.score;
        if (b.games !== a.games) return b.games - a.games;
        return b.goals - a.goals;
      })
      .slice(0, 15) as GeneralRanking[];

    } catch (error) {
      console.error("Error calculating general ranking:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user.name || user.email} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar para o dashboard
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{group.name}</h1>
              {group.description && (
                <p className="text-gray-200 text-lg">{group.description}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={group.user_role === "admin" ? "default" : "secondary"} className="bg-white/20 border-white/30 text-white">
                {group.user_role === "admin" ? "Admin" : "Membro"}
              </Badge>
              {group.user_role === "admin" && (
                <>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Link href={`/groups/${groupId}/events/new`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Evento
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                    <Link href={`/groups/${groupId}/payments`}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pagamentos
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                    <Link href={`/groups/${groupId}/settings`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Próximas Partidas */}
        <div className="mb-8">
          <UpcomingEventsCard
            events={upcomingEvents}
            groupId={groupId}
            userRole={group.user_role}
          />
        </div>

        {/* Minhas Estatísticas */}
        <div className="mb-8">
          <MyStatsCard {...myStats} />
        </div>

        {/* Rankings com Tabs */}
        <div className="mb-8">
          <RankingsCard
            topScorers={stats.topScorers}
            topAssisters={stats.topAssisters}
            topGoalkeepers={stats.topGoalkeepers}
            generalRanking={generalRanking}
            playerFrequency={stats.playerFrequency}
            currentUserId={user.id}
          />
        </div>

        {/* Jogos Recentes */}
        <div className="mb-8">
          <RecentMatchesCard matches={stats.recentMatches} groupId={groupId} />
        </div>
      </div>
    </div>
  );
}
