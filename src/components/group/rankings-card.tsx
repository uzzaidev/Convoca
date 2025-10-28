"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Goal, Hand } from "lucide-react";

type PlayerStat = {
  id: string;
  name: string;
  value: number;
  label: string;
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

type RankingsCardProps = {
  topScorers: Array<{ id: string; name: string; goals: string }>;
  topAssisters: Array<{ id: string; name: string; assists: string }>;
  topGoalkeepers: Array<{ id: string; name: string; saves: string }>;
  generalRanking: GeneralRanking[];
};

export function RankingsCard({
  topScorers,
  topAssisters,
  topGoalkeepers,
  generalRanking,
}: RankingsCardProps) {
  // Transformar dados para formato consistente
  const scorersData: PlayerStat[] = topScorers.map((p) => {
    const goalsCount = parseInt(p.goals);
    return {
      id: p.id,
      name: p.name,
      value: goalsCount,
      label: `${p.goals} gol${goalsCount !== 1 ? "s" : ""}`,
    };
  });

  const assistersData: PlayerStat[] = topAssisters.map((p) => {
    const assistsCount = parseInt(p.assists);
    return {
      id: p.id,
      name: p.name,
      value: assistsCount,
      label: `${p.assists} assistência${assistsCount !== 1 ? "s" : ""}`,
    };
  });

  const goalkeepersData: PlayerStat[] = topGoalkeepers.map((p) => {
    const savesCount = parseInt(p.saves);
    return {
      id: p.id,
      name: p.name,
      value: savesCount,
      label: `${p.saves} defesa${savesCount !== 1 ? "s" : ""}`,
    };
  });

  const renderRankingList = (data: PlayerStat[], emptyMessage: string) => {
    if (data.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
      );
    }

    return (
      <div className="rounded-lg border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 px-3 py-3 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
          <div className="w-8 text-center">#</div>
          <div>Jogador</div>
          <div className="text-right">Estatística</div>
        </div>
        {/* Table Body */}
        <div>
          {data.map((player, index) => (
            <div
              key={player.id}
              className="grid grid-cols-[auto_1fr_auto] gap-3 px-3 py-3 hover:bg-accent transition-colors border-b last:border-b-0 items-center"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0 ${
                  index === 0
                    ? "bg-yellow-500 text-yellow-950"
                    : index === 1
                    ? "bg-slate-300 text-slate-900"
                    : index === 2
                    ? "bg-orange-600 text-orange-50"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <span className="font-medium truncate">{player.name}</span>
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                {player.label}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGeneralRanking = () => {
    if (generalRanking.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          Ainda não há dados suficientes para o ranking geral
        </p>
      );
    }

    return (
      <div className="rounded-lg border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-3 px-3 py-3 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
          <div className="w-8 text-center">#</div>
          <div>Jogador</div>
          <div className="text-center">Jogos</div>
          <div className="text-center">Gols</div>
          <div className="text-center">Assist.</div>
          <div className="text-center">MVPs</div>
          <div className="text-center">Vitórias</div>
          <div className="text-right">Pontos</div>
        </div>
        {/* Table Body */}
        <div>
          {generalRanking.map((player, index) => (
            <div
              key={player.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-3 px-3 py-3 hover:bg-accent transition-colors border-b last:border-b-0 items-center"
            >
              {/* Position */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0 ${
                  index === 0
                    ? "bg-yellow-500 text-yellow-950"
                    : index === 1
                    ? "bg-slate-300 text-slate-900"
                    : index === 2
                    ? "bg-orange-600 text-orange-50"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              {/* Player Name */}
              <div className="font-medium truncate min-w-0">{player.name}</div>
              {/* Games */}
              <div className="text-center text-sm tabular-nums">{player.games}</div>
              {/* Goals */}
              <div className="text-center text-sm tabular-nums">{player.goals}</div>
              {/* Assists */}
              <div className="text-center text-sm tabular-nums">{player.assists}</div>
              {/* MVPs */}
              <div className="text-center text-sm tabular-nums">
                {player.mvps > 0 ? (
                  <span className="text-yellow-600 dark:text-yellow-500 font-medium">
                    {player.mvps}
                  </span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </div>
              {/* Wins */}
              <div className="text-center text-sm tabular-nums">{player.wins}</div>
              {/* Score */}
              <div className="text-right">
                <div className="text-lg font-bold tabular-nums">{player.score}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Rankings
        </CardTitle>
        <CardDescription>Melhores jogadores do grupo</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="artilheiros">Artilheiros</TabsTrigger>
            <TabsTrigger value="garcons">Garçons</TabsTrigger>
            <TabsTrigger value="goleiros">Goleiros</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Ranking baseado em: presença (2 pts), gols (3 pts), assistências (2 pts),
              MVPs (5 pts) e vitórias (1 pt)
            </div>
            {renderGeneralRanking()}
          </TabsContent>

          <TabsContent value="artilheiros" className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Goal className="h-5 w-5 text-green-600 dark:text-green-500" />
              <span className="text-sm text-muted-foreground">
                Top 10 goleadores
              </span>
            </div>
            {renderRankingList(scorersData, "Nenhum gol registrado ainda")}
          </TabsContent>

          <TabsContent value="garcons" className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Top 10 assistências
              </span>
            </div>
            {renderRankingList(assistersData, "Nenhuma assistência registrada ainda")}
          </TabsContent>

          <TabsContent value="goleiros" className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Hand className="h-5 w-5 text-purple-600 dark:text-purple-500" />
              <span className="text-sm text-muted-foreground">
                Top 10 defesas
              </span>
            </div>
            {renderRankingList(goalkeepersData, "Nenhuma defesa registrada ainda")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
