"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

type PlayerFrequency = {
  id: string;
  name: string;
  games_played: string;
  games_dm: string;
  games_absent: string;
  total_games: string;
  frequency_percentage: string;
};

type FrequencyCardProps = {
  playerFrequency: PlayerFrequency[];
};

export function FrequencyCard({ playerFrequency }: FrequencyCardProps) {
  if (playerFrequency.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Frequência
          </CardTitle>
          <CardDescription>Últimos 10 jogos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado de frequência disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Frequência
        </CardTitle>
        <CardDescription>Presença nos últimos 10 jogos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {playerFrequency.map((player) => {
            const percentage = parseFloat(player.frequency_percentage);
            const percentageColor =
              percentage >= 80
                ? "text-green-600 dark:text-green-500"
                : percentage >= 50
                ? "text-yellow-600 dark:text-yellow-500"
                : "text-red-600 dark:text-red-500";

            return (
              <div
                key={player.id}
                className="p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium truncate flex-1">
                    {player.name}
                  </span>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {player.games_played} jogos
                    </Badge>
                    <span className={`text-sm font-bold ${percentageColor}`}>
                      {player.frequency_percentage}%
                    </span>
                  </div>
                </div>
                {/* Barra de progresso */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      percentage >= 80
                        ? "bg-green-500"
                        : percentage >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
