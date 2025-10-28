import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { RankingsCard } from "@/components/group/rankings-card";
import { MyStatsCard } from "@/components/group/my-stats-card";
import { RecentMatchesCard } from "@/components/group/recent-matches-card";
import { FrequencyCard } from "@/components/group/frequency-card";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

type Stats = {
  topScorers: Array<{ id: string; name: string; goals: string }>;
  topAssisters: Array<{ id: string; name: string; assists: string }>;
  topGoalkeepers: Array<{ id: string; name: string; saves: string }>;
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
        SELECT u.id, u.name, COUNT(*) as goals
        FROM event_actions ea
        INNER JOIN users u ON ea.actor_user_id = u.id
        WHERE ea.event_id = ANY(${eventIds}) AND ea.action_type = 'goal'
        GROUP BY u.id, u.name
        ORDER BY goals DESC LIMIT 10
      `;
      stats.topScorers = topScorers as Array<{ id: string; name: string; goals: string }>;

      // Garçons
      const topAssisters = await sql`
        SELECT u.id, u.name, COUNT(*) as assists
        FROM event_actions ea
        INNER JOIN users u ON ea.actor_user_id = u.id
        WHERE ea.event_id = ANY(${eventIds}) AND ea.action_type = 'assist'
        GROUP BY u.id, u.name
        ORDER BY assists DESC LIMIT 10
      `;
      stats.topAssisters = topAssisters as Array<{ id: string; name: string; assists: string }>;

      // Goleiros
      const topGoalkeepers = await sql`
        SELECT u.id, u.name, COUNT(*) as saves
        FROM event_actions ea
        INNER JOIN users u ON ea.actor_user_id = u.id
        WHERE ea.event_id = ANY(${eventIds}) AND ea.action_type = 'save'
        GROUP BY u.id, u.name
        ORDER BY saves DESC LIMIT 10
      `;
      stats.topGoalkeepers = topGoalkeepers as Array<{ id: string; name: string; saves: string }>;

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
        )
        SELECT u.id, u.name, COUNT(*) as games_played,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM recent_events), 1) as frequency_percentage
        FROM event_attendance ea
        INNER JOIN users u ON ea.user_id = u.id
        WHERE ea.event_id IN (SELECT id FROM recent_events)
          AND ea.status = 'yes' AND ea.checked_in_at IS NOT NULL
        GROUP BY u.id, u.name
        ORDER BY games_played DESC LIMIT 15
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
        WITH player_stats AS (
          SELECT 
            u.id,
            u.name,
            COUNT(DISTINCT ea.event_id) as games_played,
            COUNT(CASE WHEN ea2.action_type = 'goal' THEN 1 END) as goals,
            COUNT(CASE WHEN ea2.action_type = 'assist' THEN 1 END) as assists,
            COUNT(CASE WHEN pr.tags @> ARRAY['mvp'] THEN 1 END) as mvps,
            COUNT(CASE WHEN t.is_winner = true THEN 1 END) as wins
          FROM users u
          INNER JOIN event_attendance ea ON u.id = ea.user_id
          LEFT JOIN event_actions ea2 ON ea2.event_id = ea.event_id AND ea2.actor_user_id = u.id
          LEFT JOIN team_members tm ON tm.user_id = u.id
          LEFT JOIN teams t ON t.id = tm.team_id AND t.event_id = ea.event_id
          LEFT JOIN player_ratings pr ON pr.event_id = ea.event_id AND pr.rated_user_id = u.id
          WHERE ea.event_id = ANY(${eventIds})
            AND ea.status = 'yes'
            AND ea.checked_in_at IS NOT NULL
          GROUP BY u.id, u.name
          HAVING COUNT(DISTINCT ea.event_id) > 0
        )
        SELECT 
          id,
          name,
          games_played::int,
          goals::int,
          assists::int,
          mvps::int,
          wins::int,
          (
            (games_played * 2) +    -- 2 pontos por presença
            (goals * 3) +           -- 3 pontos por gol
            (assists * 2) +         -- 2 pontos por assistência
            (mvps * 5) +            -- 5 pontos por MVP
            (wins * 1)              -- 1 ponto por vitória
          )::int as score
        FROM player_stats
        ORDER BY score DESC, games_played DESC, goals DESC
        LIMIT 15
      `;

      generalRanking = rankingData as GeneralRanking[];
    } catch (error) {
      console.error("Error calculating general ranking:", error);
    }
  }

  return (
    <div className="min-h-screen bg-background">
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
            <Badge variant={group.user_role === "admin" ? "default" : "secondary"} className="w-fit">
              {group.user_role === "admin" ? "Admin" : "Membro"}
            </Badge>
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
            currentUserId={user.id}
          />
        </div>

        {/* Frequência e Jogos Recentes */}
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <FrequencyCard playerFrequency={stats.playerFrequency} />
          <div className="md:col-span-2">
            <RecentMatchesCard matches={stats.recentMatches} />
          </div>
        </div>
      </div>
    </div>
  );
}
