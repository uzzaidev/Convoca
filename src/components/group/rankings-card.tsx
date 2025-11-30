"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Target, Goal, Hand, ArrowUpDown, ArrowUp, ArrowDown, BarChart3, MoreVertical, Maximize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PlayerStat = {
  id: string;
  name: string;
  value: number;
  label: string;
  games?: number;
};

type PlayerFrequency = {
  id: string;
  name: string;
  games_played: string;
  games_dm: string;
  games_absent: string;
  total_games: string;
  frequency_percentage: string;
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

type ColumnKey = 'games' | 'goals' | 'assists' | 'mvps' | 'wins' | 'draws' | 'losses' | 'team_goals' | 'team_goals_conceded' | 'goal_difference' | 'available_matches' | 'dm_games' | 'score';

type ColumnConfig = {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
};

const COLUMNS: ColumnConfig[] = [
  { key: 'games', label: 'Jogos', defaultVisible: true },
  { key: 'goals', label: 'Gols', defaultVisible: true },
  { key: 'assists', label: 'Assist.', defaultVisible: true },
  { key: 'wins', label: 'Vitórias', defaultVisible: true },
  { key: 'draws', label: 'Empates', defaultVisible: false },
  { key: 'losses', label: 'Derrotas', defaultVisible: false },
  { key: 'team_goals', label: 'Gols da Equipe', defaultVisible: false },
  { key: 'team_goals_conceded', label: 'Gols Sofridos', defaultVisible: false },
  { key: 'goal_difference', label: 'Saldo de Gols', defaultVisible: false },
  { key: 'available_matches', label: 'Partidas Disp.', defaultVisible: false },
  { key: 'dm_games', label: 'Jogos no DM', defaultVisible: false },
  { key: 'mvps', label: 'MVPs', defaultVisible: true },
  { key: 'score', label: 'Pontos', defaultVisible: true },
];

// Constants for sticky column positioning
const STICKY_RANK_WIDTH = 60;
const STICKY_NAME_LEFT = STICKY_RANK_WIDTH;

type SortField = ColumnKey;
type SortDirection = 'asc' | 'desc';

type RankingsCardProps = {
  topScorers: Array<{ id: string; name: string; goals: string; games?: string }>;
  topAssisters: Array<{ id: string; name: string; assists: string; games?: string }>;
  topGoalkeepers: Array<{ id: string; name: string; saves: string; games?: string }>;
  generalRanking: GeneralRanking[];
  playerFrequency: PlayerFrequency[];
  currentUserId: string;
};

export function RankingsCard({
  topScorers,
  topAssisters,
  topGoalkeepers,
  generalRanking,
  playerFrequency,
  currentUserId,
}: RankingsCardProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    // Tentar carregar do localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rankings-visible-columns');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Se falhar ao parsear, usar valores padrão
        }
      }
    }
    // Valores padrão
    return COLUMNS.reduce((acc, col) => {
      acc[col.key] = col.defaultVisible;
      return acc;
    }, {} as Record<ColumnKey, boolean>);
  });

  // Salvar preferências quando mudarem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rankings-visible-columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Função para exportar para PDF
  const exportToPDF = async (tabName: string, data?: PlayerStat[]) => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text(`Rankings - ${tabName}`, pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth / 2, 22, { align: 'center' });

      let tableData: any[] = [];
      let headers: string[] = [];

      if (tabName === 'Geral') {
        headers = ['#', 'Jogador', 'Jogos', 'Gols', 'Assist.', 'MVPs', 'Vitórias', 'Pontos'];
        tableData = sortedGeneralRanking.map((player, index) => [
          index + 1,
          player.name,
          player.games,
          player.goals,
          player.assists,
          player.mvps,
          player.wins,
          player.score
        ]);
      } else if (data) {
        headers = ['#', 'Jogador', 'Jogos', 'Estatística'];
        tableData = data.map((player, index) => [
          index + 1,
          player.name,
          player.games ?? '-',
          player.value
        ]);
      } else if (tabName === 'Frequência') {
        headers = ['#', 'Jogador', 'Presentes', 'DM', 'Ausentes', 'Total', '%'];
        tableData = playerFrequency.map((player, index) => [
          index + 1,
          player.name,
          player.games_played,
          player.games_dm,
          player.games_absent,
          player.total_games,
          `${parseFloat(player.frequency_percentage || '0').toFixed(1)}%`
        ]);
      }

      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      doc.save(`ranking-${tabName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Transformar dados para formato consistente
  const scorersData: PlayerStat[] = topScorers.map((p) => {
    const goalsCount = parseInt(p.goals);
    return {
      id: p.id,
      name: p.name,
      value: goalsCount,
      label: `${p.goals} gol${goalsCount !== 1 ? "s" : ""}`,
      games: p.games ? parseInt(p.games) : undefined,
    };
  });

  const assistersData: PlayerStat[] = topAssisters.map((p) => {
    const assistsCount = parseInt(p.assists);
    return {
      id: p.id,
      name: p.name,
      value: assistsCount,
      label: `${p.assists} assistência${assistsCount !== 1 ? "s" : ""}`,
      games: p.games ? parseInt(p.games) : undefined,
    };
  });

  const goalkeepersData: PlayerStat[] = topGoalkeepers.map((p) => {
    const savesCount = parseInt(p.saves);
    return {
      id: p.id,
      name: p.name,
      value: savesCount,
      label: `${p.saves} defesa${savesCount !== 1 ? "s" : ""}`,
      games: p.games ? parseInt(p.games) : undefined,
    };
  });

  const renderRankingList = (data: PlayerStat[], emptyMessage: string, fullscreen = false) => {
    if (data.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
      );
    }

    return (
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead className="text-center">Jogos</TableHead>
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
                  <TableCell className="text-center tabular-nums">
                    {player.games ?? '-'}
                  </TableCell>
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

  // Helper function to format cell values
  const formatCellValue = (col: ColumnConfig, value: number) => {
    if (col.key === 'mvps' && value > 0) {
      return (
        <span className="text-yellow-600 dark:text-yellow-500 font-medium">
          {value}
        </span>
      );
    }

    if (col.key === 'goal_difference') {
      return (
        <span className={value > 0 ? "text-green-600 dark:text-green-500" : value < 0 ? "text-red-600 dark:text-red-500" : ""}>
          {value > 0 ? '+' : ''}{value}
        </span>
      );
    }

    if (col.key === 'score') {
      return <span className="text-lg font-bold tabular-nums">{value}</span>;
    }

    if (value === 0) {
      return <span className="text-muted-foreground">0</span>;
    }

    return value;
  };

  const renderGeneralRanking = (fullscreen = false) => {
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

    const visibleColumnsList = COLUMNS.filter(col => visibleColumns[col.key]);

    return (
      <div className="space-y-2">
        {/* Menu de seleção de colunas */}
        <div className="flex justify-between items-center gap-2">
          <div className="text-xs text-muted-foreground hidden md:block">
            Dica: Arraste horizontalmente para ver mais colunas
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => exportToPDF('Geral')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Exportar PDF</span>
            </Button>
            {!fullscreen && (
              <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Maximize2 className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Expandir</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Ranking Geral
                    </DialogTitle>
                    <DialogDescription>
                      Ranking baseado em: presença (2 pts), gols (3 pts), assistências (2 pts),
                      MVPs (5 pts) e vitórias (1 pt)
                    </DialogDescription>
                  </DialogHeader>
                  {renderGeneralRanking(true)}
                </DialogContent>
              </Dialog>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Colunas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COLUMNS.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleColumns[col.key]}
                    onCheckedChange={() => toggleColumn(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center sticky left-0 bg-background z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">#</TableHead>
                  <TableHead className="min-w-[140px] sticky bg-background z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ left: `${STICKY_NAME_LEFT}px` }}>Jogador</TableHead>
                  {visibleColumnsList.map((col) => (
                    <TableHead key={col.key} className={col.key === 'score' ? "text-right min-w-[100px]" : "text-center min-w-[80px]"}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort(col.key)}
                        className="h-8 w-full text-xs"
                      >
                        {col.label}
                        {getSortIcon(col.key)}
                      </Button>
                    </TableHead>
                  ))}
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
                      <TableCell className="text-center sticky left-0 bg-background z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
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
                      <TableCell className="font-medium sticky bg-background z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[140px]" style={{ left: `${STICKY_NAME_LEFT}px` }}>
                        <span className="block truncate" title={player.name}>{player.name}</span>
                      </TableCell>
                      {visibleColumnsList.map((col) => {
                        const value = player[col.key];
                        const isScore = col.key === 'score';

                        return (
                          <TableCell
                            key={col.key}
                            className={isScore ? "text-right" : "text-center tabular-nums"}
                          >
                            {formatCellValue(col, value)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  const renderFrequency = (fullscreen = false) => {
    if (playerFrequency.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          Nenhum dado de frequência disponível
        </p>
      );
    }

    return (
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead className="text-center">Presentes</TableHead>
              <TableHead className="text-center">DM</TableHead>
              <TableHead className="text-center">Ausentes</TableHead>
              <TableHead className="text-center">Jogos Totais</TableHead>
              <TableHead className="text-right">% Participação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playerFrequency.map((player, index) => {
              const isCurrentUser = player.id === currentUserId;
              const percentage = parseFloat(player.frequency_percentage || '0');
              const percentageColor =
                percentage >= 80
                  ? "text-green-600 dark:text-green-500"
                  : percentage >= 50
                  ? "text-yellow-600 dark:text-yellow-500"
                  : "text-red-600 dark:text-red-500";

              return (
                <TableRow
                  key={player.id}
                  className={isCurrentUser ? "bg-primary/10 font-semibold" : ""}
                >
                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-center tabular-nums">
                    <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950">
                      {player.games_played}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    <Badge variant="outline" className="text-xs bg-yellow-50 dark:bg-yellow-950">
                      {player.games_dm}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950">
                      {player.games_absent}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center tabular-nums font-semibold">
                    {player.total_games}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex-1 max-w-[120px]">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              percentage >= 80
                                ? "bg-green-500"
                                : percentage >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-sm font-bold tabular-nums min-w-[50px] text-right ${percentageColor}`}>
                        {isNaN(percentage) ? '0.0' : percentage.toFixed(1)}%
                      </span>
                    </div>
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
    <Card className="col-span-full bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Rankings
        </CardTitle>
        <CardDescription>Melhores jogadores do grupo</CardDescription>
      </CardHeader>
      <CardContent className="px-0 md:px-6">
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4 h-auto">
            <TabsTrigger value="geral" className="flex flex-col sm:flex-row gap-1 py-2">
              <Trophy className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="artilheiros" className="flex flex-col sm:flex-row gap-1 py-2">
              <Goal className="h-4 w-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Artilheiros</span>
              <span className="text-xs sm:hidden">Art.</span>
            </TabsTrigger>
            <TabsTrigger value="garcons" className="flex flex-col sm:flex-row gap-1 py-2">
              <Target className="h-4 w-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Garçons</span>
              <span className="text-xs sm:hidden">Gar.</span>
            </TabsTrigger>
            <TabsTrigger value="goleiros" className="flex flex-col sm:flex-row gap-1 py-2">
              <Hand className="h-4 w-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Goleiros</span>
              <span className="text-xs sm:hidden">Gol.</span>
            </TabsTrigger>
            <TabsTrigger value="frequencia" className="flex flex-col sm:flex-row gap-1 py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Frequência</span>
              <span className="text-xs sm:hidden">Freq.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4 mt-0">
            <div className="text-xs md:text-sm text-muted-foreground mb-2 px-2 md:px-0">
              Ranking baseado em: presença (2 pts), gols (3 pts), assistências (2 pts),
              MVPs (5 pts) e vitórias (1 pt)
            </div>
            {renderGeneralRanking()}
          </TabsContent>

          <TabsContent value="artilheiros" className="space-y-4 mt-0">
            <div className="flex items-center justify-between gap-2 mb-2 px-2 md:px-0">
              <div className="flex items-center gap-2">
                <Goal className="h-5 w-5 text-green-600 dark:text-green-500" />
                <span className="text-xs md:text-sm text-muted-foreground">
                  Top 10 goleadores
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => exportToPDF('Artilheiros', scorersData)}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">PDF</span>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Maximize2 className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Expandir</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Goal className="h-5 w-5 text-green-600" />
                      Artilheiros
                    </DialogTitle>
                    <DialogDescription>Top 10 goleadores do grupo</DialogDescription>
                  </DialogHeader>
                  {renderRankingList(scorersData, "Nenhum gol registrado ainda", true)}
                </DialogContent>
              </Dialog>
              </div>
            </div>
            {renderRankingList(scorersData, "Nenhum gol registrado ainda")}
          </TabsContent>

          <TabsContent value="garcons" className="space-y-4 mt-0">
            <div className="flex items-center justify-between gap-2 mb-2 px-2 md:px-0">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                <span className="text-xs md:text-sm text-muted-foreground">
                  Top 10 assistências
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => exportToPDF('Garçons', assistersData)}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">PDF</span>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Maximize2 className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Expandir</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Garçons
                    </DialogTitle>
                    <DialogDescription>Top 10 assistências do grupo</DialogDescription>
                  </DialogHeader>
                  {renderRankingList(assistersData, "Nenhuma assistência registrada ainda", true)}
                </DialogContent>
              </Dialog>
              </div>
            </div>
            {renderRankingList(assistersData, "Nenhuma assistência registrada ainda")}
          </TabsContent>

          <TabsContent value="goleiros" className="space-y-4 mt-0">
            <div className="flex items-center justify-between gap-2 mb-2 px-2 md:px-0">
              <div className="flex items-center gap-2">
                <Hand className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                <span className="text-xs md:text-sm text-muted-foreground">
                  Top 10 defesas
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => exportToPDF('Goleiros', goalkeepersData)}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">PDF</span>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Maximize2 className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Expandir</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Hand className="h-5 w-5 text-purple-600" />
                      Goleiros
                    </DialogTitle>
                    <DialogDescription>Top 10 defesas do grupo</DialogDescription>
                  </DialogHeader>
                  {renderRankingList(goalkeepersData, "Nenhuma defesa registrada ainda", true)}
                </DialogContent>
              </Dialog>
              </div>
            </div>
            {renderRankingList(goalkeepersData, "Nenhuma defesa registrada ainda")}
          </TabsContent>

          <TabsContent value="frequencia" className="space-y-4 mt-0">
            <div className="flex items-center justify-between gap-2 mb-2 px-2 md:px-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                <span className="text-xs md:text-sm text-muted-foreground">
                  {playerFrequency.length > 0 && playerFrequency[0].total_games
                    ? `Últimos ${playerFrequency[0].total_games} jogos`
                    : 'Últimos 10 jogos'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => exportToPDF('Frequência')}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">PDF</span>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Maximize2 className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Expandir</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Frequência
                    </DialogTitle>
                    <DialogDescription>
                      {playerFrequency.length > 0 && playerFrequency[0].total_games
                        ? `Últimos ${playerFrequency[0].total_games} jogos - % de participação calculada sobre jogos disponíveis (total - DM)`
                        : 'Últimos 10 jogos - % de participação calculada sobre jogos disponíveis (total - DM)'}
                    </DialogDescription>
                  </DialogHeader>
                  {renderFrequency(true)}
                </DialogContent>
              </Dialog>
              </div>
            </div>
            {renderFrequency()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
