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
import { Settings } from "lucide-react";

type RouteParams = {
  params: Promise<{ groupId: string }>;
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
        INNER JOIN users u ON ea.actor_user_id = u.id
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
        INNER JOIN users u ON ea.actor_user_id = u.id
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
        INNER JOIN users u ON ea.actor_user_id = u.id
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
          WHERE event_id = ANY(${myEventIds}) AND actor_user_id = ${user.id}
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

        const ratingResult = await sql`
          SELECT AVG(score) as avg_rating
          FROM player_ratings
          WHERE event_id = ANY(${myEventIds}) AND rated_user_id = ${user.id}
        `;
        if (ratingResult[0]?.avg_rating) {
          myStats.averageRating = parseFloat(ratingResult[0].avg_rating).toFixed(1);
        }

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
      // Buscar dados combinados de todos os jogadores
      const rankingData = await sql`
        WITH player_events AS (
          -- Get all events each player participated in
          SELECT 
            u.id as user_id,
            u.name,
            ea.event_id,
            t.id as team_id,
            t.is_winner
          FROM users u
          INNER JOIN event_attendance ea ON u.id = ea.user_id
          LEFT JOIN team_members tm ON tm.user_id = u.id AND tm.team_id IN (
            SELECT id FROM teams WHERE event_id = ea.event_id
          )
          LEFT JOIN teams t ON t.id = tm.team_id
          WHERE ea.event_id = ANY(${eventIds})
            AND ea.status = 'yes'
            AND ea.checked_in_at IS NOT NULL
        ),
        team_goals_per_event AS (
          -- Calculate goals scored for each team in each event
          SELECT 
            t.id as team_id,
            t.event_id,
            COUNT(ea.id) FILTER (WHERE ea.action_type = 'goal') as goals_scored
          FROM teams t
          LEFT JOIN event_actions ea ON ea.team_id = t.id AND ea.action_type = 'goal'
          WHERE t.event_id = ANY(${eventIds})
          GROUP BY t.id, t.event_id
        ),
        player_team_goals AS (
          -- Associate each player with their team's goals scored and conceded
          SELECT 
            pe.user_id,
            pe.event_id,
            COALESCE(tg_own.goals_scored, 0) as team_goals_scored,
            COALESCE(SUM(tg_opp.goals_scored), 0) as team_goals_conceded
          FROM player_events pe
          LEFT JOIN team_goals_per_event tg_own ON tg_own.team_id = pe.team_id
          LEFT JOIN teams t_opp ON t_opp.event_id = pe.event_id AND t_opp.id != pe.team_id
          LEFT JOIN team_goals_per_event tg_opp ON tg_opp.team_id = t_opp.id
          GROUP BY pe.user_id, pe.event_id, tg_own.goals_scored
        ),
        player_stats AS (
          SELECT 
            pe.user_id,
            pe.name,
            COUNT(DISTINCT pe.event_id) as games_played,
            -- Personal stats
            COUNT(ea_goals.id) as goals,
            COUNT(ea_assists.id) as assists,
            COUNT(pr.id) FILTER (WHERE pr.tags @> ARRAY['mvp']) as mvps,
            -- Match results
            COUNT(DISTINCT CASE WHEN pe.is_winner = true THEN pe.event_id END) as wins,
            COUNT(DISTINCT CASE WHEN pe.is_winner = false THEN pe.event_id END) as losses,
            COUNT(DISTINCT CASE WHEN pe.is_winner IS NULL AND pe.team_id IS NOT NULL THEN pe.event_id END) as draws,
            -- Team goals (sum across all events player participated in)
            COALESCE(SUM(ptg.team_goals_scored), 0) as team_goals,
            COALESCE(SUM(ptg.team_goals_conceded), 0) as team_goals_conceded,
            -- DM games (count from all events in the group)
            COUNT(ea_dm.id) FILTER (WHERE ea_dm.status = 'dm') as dm_games
          FROM player_events pe
          LEFT JOIN event_actions ea_goals ON ea_goals.event_id = pe.event_id 
            AND ea_goals.actor_user_id = pe.user_id 
            AND ea_goals.action_type = 'goal'
          LEFT JOIN event_actions ea_assists ON ea_assists.event_id = pe.event_id 
            AND ea_assists.actor_user_id = pe.user_id 
            AND ea_assists.action_type = 'assist'
          LEFT JOIN player_ratings pr ON pr.event_id = pe.event_id 
            AND pr.rated_user_id = pe.user_id
          LEFT JOIN player_team_goals ptg ON ptg.user_id = pe.user_id 
            AND ptg.event_id = pe.event_id
          LEFT JOIN event_attendance ea_dm ON ea_dm.user_id = pe.user_id 
            AND ea_dm.event_id = ANY(${eventIds})
          GROUP BY pe.user_id, pe.name
        )
        SELECT 
          user_id as id,
          name,
          games_played::int as games,
          goals::int,
          assists::int,
          mvps::int,
          wins::int,
          draws::int,
          losses::int,
          team_goals::int,
          team_goals_conceded::int,
          (team_goals::int - team_goals_conceded::int) as goal_difference,
          dm_games::int,
          ((SELECT COUNT(*) FROM events WHERE id = ANY(${eventIds}))::int - dm_games::int) as available_matches,
          (
            (games_played * 2) +    -- 2 pontos por presença
            (goals * 3) +           -- 3 pontos por gol
            (assists * 2) +         -- 2 pontos por assistência
            (mvps * 5) +            -- 5 pontos por MVP
            (wins * 1)              -- 1 ponto por vitória
          )::int as score
        FROM player_stats
        WHERE games_played > 0
        ORDER BY score DESC, games_played DESC, goals DESC
        LIMIT 15
      `;

      generalRanking = rankingData as GeneralRanking[];
    } catch (error) {
      console.error("Error calculating general ranking:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50/30 dark:from-green-950/20 dark:via-background dark:to-green-950/10">
      <DashboardHeader userName={user.name || user.email} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header do Grupo */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              {group.description && (
                <p className="text-muted-foreground mt-2">{group.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={group.user_role === "admin" ? "default" : "secondary"} className="w-fit">
                {group.user_role === "admin" ? "Admin" : "Membro"}
              </Badge>
              {group.user_role === "admin" && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/groups/${groupId}/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Link>
                </Button>
              )}
            </div>
          </div>
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
