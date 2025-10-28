"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const winRate = gamesPlayed > 0 
    ? ((wins / (wins + losses)) * 100).toFixed(0) 
    : "0";

  const stats = [
    { label: "Jogos", value: gamesPlayed, icon: "⚽" },
    { label: "Gols", value: goals, icon: "🎯" },
    { label: "Assistências", value: assists, icon: "🎁" },
    { label: "Vitórias", value: wins, icon: "🏆" },
    { label: "Nota Média", value: averageRating || "—", icon: "⭐" },
    { label: "MVPs", value: mvpCount, icon: "👑" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas Estatísticas</CardTitle>
        <CardDescription>Seu desempenho neste grupo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-center">{stat.value}</div>
              <div className="text-xs text-muted-foreground text-center mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Taxa de vitória */}
        {(wins + losses) > 0 && (
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
