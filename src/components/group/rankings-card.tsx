"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Target, Goal, Hand, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

type SortField = 'score' | 'games' | 'goals' | 'assists' | 'mvps' | 'wins';
type SortDirection = 'asc' | 'desc';

type RankingsCardProps = {
  topScorers: Array<{ id: string; name: string; goals: string }>;
  topAssisters: Array<{ id: string; name: string; assists: string }>;
  topGoalkeepers: Array<{ id: string; name: string; saves: string }>;
  generalRanking: GeneralRanking[];
  currentUserId: string;
};

export function RankingsCard({
  topScorers,
  topAssisters,
  topGoalkeepers,
  generalRanking,
  currentUserId,
}: RankingsCardProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Função para alternar ordenação
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Ordenar ranking geral
  const sortedGeneralRanking = [...generalRanking].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

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
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead className="text-right">Estatística</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((player, index) => {
              const isCurrentUser = player.id === currentUserId;
              return (
                <TableRow 
                  key={player.id}
                  className={isCurrentUser ? "bg-primary/10 font-semibold" : ""}
                >
                  <TableCell className="text-center">
                    <div
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
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
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{player.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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

    const getSortIcon = (field: SortField) => {
      if (sortField !== field) {
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
      }
      return sortDirection === 'asc' 
        ? <ArrowUp className="ml-2 h-4 w-4" />
        : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSort('games')}
                  className="h-8 w-full"
                >
                  Jogos
                  {getSortIcon('games')}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSort('goals')}
                  className="h-8 w-full"
                >
                  Gols
                  {getSortIcon('goals')}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSort('assists')}
                  className="h-8 w-full"
                >
                  Assist.
                  {getSortIcon('assists')}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSort('mvps')}
                  className="h-8 w-full"
                >
                  MVPs
                  {getSortIcon('mvps')}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSort('wins')}
                  className="h-8 w-full"
                >
                  Vitórias
                  {getSortIcon('wins')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSort('score')}
                  className="h-8 w-full justify-end"
                >
                  Pontos
                  {getSortIcon('score')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGeneralRanking.map((player, index) => {
              const isCurrentUser = player.id === currentUserId;
              return (
                <TableRow 
                  key={player.id}
                  className={isCurrentUser ? "bg-primary/10 font-semibold" : ""}
                >
                  <TableCell className="text-center">
                    <div
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
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
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-center tabular-nums">{player.games}</TableCell>
                  <TableCell className="text-center tabular-nums">{player.goals}</TableCell>
                  <TableCell className="text-center tabular-nums">{player.assists}</TableCell>
                  <TableCell className="text-center tabular-nums">
                    {player.mvps > 0 ? (
                      <span className="text-yellow-600 dark:text-yellow-500 font-medium">
                        {player.mvps}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{player.wins}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-lg font-bold tabular-nums">{player.score}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
