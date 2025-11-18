"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Goal, Target, Trophy, Star, Crown } from "lucide-react";

type MyStatsCardProps = {
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

export function MyStatsCard({
  gamesPlayed,
  goals,
  assists,
  averageRating,
  wins,
  losses,
  mvpCount,
  tags,
}: MyStatsCardProps) {
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 
    ? ((wins / totalMatches) * 100).toFixed(0) 
    : "0";

  const stats = [
    { label: "Jogos", value: gamesPlayed, icon: <Goal className="h-6 w-6" /> },
    { label: "Gols", value: goals, icon: <Target className="h-6 w-6 text-green-600" /> },
    { label: "Assistências", value: assists, icon: <TrendingUp className="h-6 w-6 text-blue-600" /> },
    { label: "Vitórias", value: wins, icon: <Trophy className="h-6 w-6 text-yellow-600" /> },
    { label: "MVPs", value: mvpCount, icon: <Crown className="h-6 w-6 text-orange-600" /> },
  ];

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Minhas Estatísticas</CardTitle>
        <CardDescription>Seu desempenho neste grupo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-center">{stat.value}</div>
              <div className="text-xs text-muted-foreground text-center mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Taxa de vitória */}
        {totalMatches > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taxa de Vitória</span>
              <Badge variant="default" className="text-sm">
                {winRate}%
              </Badge>
            </div>
            <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {Object.keys(tags).length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Tags Recebidas</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tags)
                .sort((a, b) => b[1] - a[1])
                .map(([tag, count]) => (
                  <Badge key={tag} variant="outline">
                    {tag} ({count})
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
