import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { formatDate } from "@/lib/utils";

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={user.name || user.email} />
      <div className="container mx-auto px-4 py-8">
        {/* Header do Grupo */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{group.name}</h1>
              {group.description && (
                <p className="text-muted-foreground mt-2">{group.description}</p>
              )}
            </div>
            <Badge variant={group.user_role === "admin" ? "default" : "secondary"}>
              {group.user_role === "admin" ? "Admin" : "Membro"}
            </Badge>
          </div>
        </div>

        {/* Minhas Estatísticas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Minhas Estatísticas</CardTitle>
            <CardDescription>Seu desempenho neste grupo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{myStats.gamesPlayed}</div>
                <div className="text-xs text-muted-foreground">Jogos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{myStats.goals}</div>
                <div className="text-xs text-muted-foreground">Gols</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{myStats.assists}</div>
                <div className="text-xs text-muted-foreground">Assistências</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{myStats.wins}</div>
                <div className="text-xs text-muted-foreground">Vitórias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{myStats.averageRating || "—"}</div>
                <div className="text-xs text-muted-foreground">Nota Média</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{myStats.mvpCount}</div>
                <div className="text-xs text-muted-foreground">MVPs</div>
              </div>
            </div>
            {Object.keys(myStats.tags).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(myStats.tags).map(([tag, count]) => (
                  <Badge key={tag} variant="outline">
                    {tag} ({count})
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Artilheiros */}
          <Card>
            <CardHeader>
              <CardTitle>⚽ Artilheiros</CardTitle>
              <CardDescription>Top 10 goleadores</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topScorers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum gol registrado ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.topScorers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <span>{player.name}</span>
                      </div>
                      <Badge>{player.goals} gols</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Garçons */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Garçons</CardTitle>
              <CardDescription>Top 10 assistências</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topAssisters.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma assistência registrada ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.topAssisters.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <span>{player.name}</span>
                      </div>
                      <Badge>{player.assists} assistências</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goleiros */}
          <Card>
            <CardHeader>
              <CardTitle>🧤 Goleiros</CardTitle>
              <CardDescription>Top 10 defesas</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topGoalkeepers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma defesa registrada ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.topGoalkeepers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <span>{player.name}</span>
                      </div>
                      <Badge>{player.saves} defesas</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Frequência */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Frequência</CardTitle>
              <CardDescription>Últimos 10 jogos</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.playerFrequency.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum dado de frequência disponível
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.playerFrequency.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent"
                    >
                      <span>{player.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {player.games_played} jogos
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {player.frequency_percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Jogos Recentes */}
        {stats.recentMatches.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>🏆 Jogos Recentes</CardTitle>
              <CardDescription>Últimos 5 jogos finalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(match.starts_at)}
                      </span>
                      {match.venue_name && (
                        <span className="text-xs text-muted-foreground">
                          📍 {match.venue_name}
                        </span>
                      )}
                    </div>
                    {match.teams && match.teams.length > 0 ? (
                      <div className="flex items-center justify-center gap-4">
                        {match.teams.map((team, index) => (
                          <>
                            {index > 0 && (
                              <span className="text-2xl font-bold text-muted-foreground">
                                ×
                              </span>
                            )}
                            <div
                              key={team.id}
                              className={`flex-1 text-center p-2 rounded ${
                                team.is_winner ? "bg-green-500/10 border border-green-500/20" : ""
                              }`}
                            >
                              <div className="font-semibold">{team.name}</div>
                              <div className="text-3xl font-bold">{team.goals}</div>
                              {team.is_winner && (
                                <Badge className="mt-1" variant="default">
                                  Vencedor
                                </Badge>
                              )}
                            </div>
                          </>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">
                        Times não disponíveis
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
