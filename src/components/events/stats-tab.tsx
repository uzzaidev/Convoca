"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CircleDot,
  Target,
  Square,
  SquareX,
  Trophy,
  TrendingUp,
  Activity
} from "lucide-react";

type Team = {
  id: string;
  name: string;
  seed: number;
  is_winner: boolean | null;
  members: Array<{
    userId: string;
    userName: string;
  }> | null;
};

type MatchAction = {
  id: string;
  action_type: string;
  subject_user_id: string | null;
  actor_name: string;
  team_id: string;
  team_name: string | null;
  minute: number | null;
  created_at: string;
};

type StatsTabProps = {
  eventId: string;
  teams: Team[];
};

type PlayerStats = {
  userId: string;
  userName: string;
  teamName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

export function StatsTab({ eventId, teams }: StatsTabProps) {
  const [actions, setActions] = useState<MatchAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActions();
  }, [eventId]);

  const fetchActions = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/actions`);
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error("Error fetching actions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate team stats
  const teamStats = teams.map((team) => {
    const teamActions = actions.filter((action) => action.team_id === team.id);
    return {
      id: team.id,
      name: team.name,
      goals: teamActions.filter((a) => a.action_type === "goal").length,
      assists: teamActions.filter((a) => a.action_type === "assist").length,
      yellowCards: teamActions.filter((a) => a.action_type === "yellow_card").length,
      redCards: teamActions.filter((a) => a.action_type === "red_card").length,
      is_winner: team.is_winner,
    };
  });

  // Calculate player stats
  const playerStatsMap = new Map<string, PlayerStats>();

  actions.forEach((action) => {
    const userId = action.subject_user_id;
    if (!userId) return;

    const userName = action.actor_name;
    const teamName = action.team_name || "Sem time";

    if (!playerStatsMap.has(userId)) {
      playerStatsMap.set(userId, {
        userId,
        userName,
        teamName,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
      });
    }

    const stats = playerStatsMap.get(userId)!;

    if (action.action_type === "goal") stats.goals++;
    if (action.action_type === "assist") stats.assists++;
    if (action.action_type === "yellow_card") stats.yellowCards++;
    if (action.action_type === "red_card") stats.redCards++;
  });

  const playerStats = Array.from(playerStatsMap.values());

  // Top scorers
  const topScorers = playerStats
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  // Top assists
  const topAssisters = playerStats
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma estatística registrada ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas por Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            Estatísticas por Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamStats.map((team) => (
              <div
                key={team.id}
                className={`p-4 rounded-lg ${
                  team.is_winner
                    ? "bg-green-500/10 border-2 border-green-500/30"
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    {team.is_winner && (
                      <Badge variant="default" className="text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        Vencedor
                      </Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold">{team.goals}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Gols:</span>
                    <span className="font-semibold">{team.goals}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-muted-foreground">Assistências:</span>
                    <span className="font-semibold">{team.assists}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Amarelos:</span>
                    <span className="font-semibold">{team.yellowCards}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SquareX className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">Vermelhos:</span>
                    <span className="font-semibold">{team.redCards}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Artilheiros */}
      {topScorers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-blue-500" />
              Artilheiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topScorers.map((player, index) => (
                <div
                  key={player.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-600"
                          : index === 1
                          ? "bg-gray-400/20 text-gray-600"
                          : index === 2
                          ? "bg-orange-500/20 text-orange-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}º
                    </div>
                    <div>
                      <div className="font-medium">{player.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.teamName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-bold">{player.goals}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assistências */}
      {topAssisters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Maiores Assistentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topAssisters.map((player, index) => (
                <div
                  key={player.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-semibold text-sm">
                      {index + 1}º
                    </div>
                    <div>
                      <div className="font-medium">{player.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.teamName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-2xl font-bold">{player.assists}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-500/10">
              <CircleDot className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold">
                {actions.filter((a) => a.action_type === "goal").length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Gols</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-purple-500/10">
              <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-3xl font-bold">
                {actions.filter((a) => a.action_type === "assist").length}
              </div>
              <div className="text-sm text-muted-foreground">Assistências</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-yellow-500/10">
              <Square className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-3xl font-bold">
                {actions.filter((a) => a.action_type === "yellow_card").length}
              </div>
              <div className="text-sm text-muted-foreground">Amarelos</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-red-500/10">
              <SquareX className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-3xl font-bold">
                {actions.filter((a) => a.action_type === "red_card").length}
              </div>
              <div className="text-sm text-muted-foreground">Vermelhos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
