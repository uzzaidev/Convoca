"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Target, Goal, Hand, ArrowUpDown, ArrowUp, ArrowDown, BarChart3, MoreVertical, Maximize2, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type GoalkeeperStat = {
  id: string;
  name: string;
  goals_conceded: string;
  games?: string;
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
  { key: 'score', label: 'Pontos', defaultVisible: true },
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
];

// Constants for sticky column positioning
const STICKY_RANK_WIDTH = 60;
const STICKY_NAME_LEFT = STICKY_RANK_WIDTH;

type SortField = ColumnKey;
type SortDirection = 'asc' | 'desc';

type TiebreakerKey =
  | "wins"
  | "goal_difference"
  | "goals"
  | "games_played"
  | "games_played_asc"
  | "assists"
  | "mvp_count";

type ScoringConfig = {
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  pointsGoal: number;
  pointsAssist: number;
  pointsMvp: number;
  pointsPresence: number;
  rankingMode: "standard" | "complete";
  tiebreakers?: TiebreakerKey[];
};

const DEFAULT_TIEBREAKERS: TiebreakerKey[] = [
  "wins",
  "goal_difference",
  "goals",
  "games_played",
];

const DEFAULT_SCORING: ScoringConfig = {
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  pointsGoal: 0,
  pointsAssist: 0,
  pointsMvp: 0,
  pointsPresence: 0,
  rankingMode: "standard",
  tiebreakers: DEFAULT_TIEBREAKERS,
};

const TIEBREAKER_FIELD: Record<TiebreakerKey, { field: keyof GeneralRanking; dir: "asc" | "desc" }> = {
  wins: { field: "wins", dir: "desc" },
  goal_difference: { field: "goal_difference", dir: "desc" },
  goals: { field: "goals", dir: "desc" },
  games_played: { field: "games", dir: "desc" },
  games_played_asc: { field: "games", dir: "asc" },
  assists: { field: "assists", dir: "desc" },
  mvp_count: { field: "mvps", dir: "desc" },
};

type RankingsCardProps = {
  topScorers: Array<{ id: string; name: string; goals: string; games?: string }>;
  topAssisters: Array<{ id: string; name: string; assists: string; games?: string }>;
  topGoalkeepers: GoalkeeperStat[];
  generalRanking: GeneralRanking[];
  playerFrequency: PlayerFrequency[];
  currentUserId: string;
  scoringConfig?: ScoringConfig;
  seasons?: Array<{ id: string; name: string; status: string; starts_at: string; ends_at: string }>;
  currentSeasonId?: string;
  currentSeasonName?: string;
  groupId?: string;
};

// Generate dynamic scoring description
function getScoringDescription(config: ScoringConfig): string {
  const parts: string[] = [];

  if (config.pointsWin > 0) parts.push(`vitória (${config.pointsWin} pts)`);
  if (config.pointsDraw > 0) parts.push(`empate (${config.pointsDraw} pt${config.pointsDraw > 1 ? 's' : ''})`);
  if (config.pointsLoss > 0) parts.push(`derrota (${config.pointsLoss} pt${config.pointsLoss > 1 ? 's' : ''})`);
  if (config.pointsGoal > 0) parts.push(`gol (${config.pointsGoal} pt${config.pointsGoal > 1 ? 's' : ''})`);
  if (config.pointsAssist > 0) parts.push(`assistência (${config.pointsAssist} pt${config.pointsAssist > 1 ? 's' : ''})`);
  if (config.pointsMvp > 0) parts.push(`MVP (${config.pointsMvp} pt${config.pointsMvp > 1 ? 's' : ''})`);
  if (config.pointsPresence > 0) parts.push(`presença (${config.pointsPresence} pt${config.pointsPresence > 1 ? 's' : ''})`);

  if (parts.length === 0) return "Sem pontuação configurada";
  return `Pontuação: ${parts.join(', ')}`;
}

const TIEBREAKER_LABEL_SHORT: Record<TiebreakerKey, string> = {
  wins: "vitórias",
  goal_difference: "saldo",
  goals: "gols",
  games_played: "mais jogos",
  games_played_asc: "menos jogos",
  assists: "assistências",
  mvp_count: "MVPs",
};

function getTiebreakerDescription(keys: TiebreakerKey[] | undefined): string {
  const list = keys && keys.length > 0 ? keys : DEFAULT_TIEBREAKERS;
  return `Desempate: ${list
    .map((k) => TIEBREAKER_LABEL_SHORT[k])
    .filter(Boolean)
    .join(' → ')}`;
}

export function RankingsCard({
  topScorers,
  topAssisters,
  topGoalkeepers,
  generalRanking,
  playerFrequency,
  currentUserId,
  scoringConfig = DEFAULT_SCORING,
  seasons = [],
  currentSeasonId,
  currentSeasonName,
  groupId,
}: RankingsCardProps) {
  const router = useRouter();

  const handleSeasonChange = (value: string) => {
    if (!groupId) return;
    router.push(`/groups/${groupId}?seasonId=${value}`);
  };

  const scoringDescription = getScoringDescription(scoringConfig);
  const tiebreakerDescription = getTiebreakerDescription(scoringConfig.tiebreakers);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [rankingSearch, setRankingSearch] = useState('');
  const [rankingPage, setRankingPage] = useState(0);
  const [frequencySearch, setFrequencySearch] = useState('');
  const [frequencyPage, setFrequencyPage] = useState(0);
  const PAGE_SIZE = 20;
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

  // Filtrar e ordenar ranking geral
  const filteredGeneralRanking = generalRanking.filter(p =>
    rankingSearch === '' || p.name.toLowerCase().includes(rankingSearch.toLowerCase())
  );

  const tiebreakers: TiebreakerKey[] =
    scoringConfig.tiebreakers && scoringConfig.tiebreakers.length > 0
      ? scoringConfig.tiebreakers
      : DEFAULT_TIEBREAKERS;

  const sortedGeneralRanking = [...filteredGeneralRanking].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const primary = sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    if (primary !== 0) return primary;

    // Apply configured tiebreakers only when sorting by score (default view).
    if (sortField === 'score') {
      for (const key of tiebreakers) {
        const entry = TIEBREAKER_FIELD[key];
        if (!entry) continue;
        const av = a[entry.field] as number;
        const bv = b[entry.field] as number;
        const delta = entry.dir === 'asc' ? av - bv : bv - av;
        if (delta !== 0) return delta;
      }
    }
    return 0;
  });

  const rankingTotalPages = Math.ceil(sortedGeneralRanking.length / PAGE_SIZE);
  const paginatedGeneralRanking = sortedGeneralRanking.slice(
    rankingPage * PAGE_SIZE,
    (rankingPage + 1) * PAGE_SIZE
  );

  // Filtrar e paginar frequência
  const filteredFrequency = playerFrequency.filter(p =>
    frequencySearch === '' || p.name.toLowerCase().includes(frequencySearch.toLowerCase())
  );
  const frequencyTotalPages = Math.ceil(filteredFrequency.length / PAGE_SIZE);
  const paginatedFrequency = filteredFrequency.slice(
    frequencyPage * PAGE_SIZE,
    (frequencyPage + 1) * PAGE_SIZE
  );

  // Função para exportar para PDF
  const exportToPDF = async (tabName: string, data?: PlayerStat[]) => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

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

      autoTable(doc, {
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
    const concededCount = parseInt(p.goals_conceded);
    return {
      id: p.id,
      name: p.name,
      value: concededCount,
      label: `${p.goals_conceded} gol${concededCount !== 1 ? "s" : ""} sofrido${concededCount !== 1 ? "s" : ""}`,
      games: p.games ? parseInt(p.games) : undefined,
    };
  }).sort((a, b) => a.value - b.value || (b.games ?? 0) - (a.games ?? 0) || a.name.localeCompare(b.name));

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

    const displayData = rankingSearch ? sortedGeneralRanking : paginatedGeneralRanking;
    const displayTotalPages = rankingSearch ? 1 : rankingTotalPages;

    return (
      <div className="space-y-2">
        {/* Busca e menu de colunas */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar jogador..."
              value={rankingSearch}
              onChange={(e) => {
                setRankingSearch(e.target.value);
                setRankingPage(0);
              }}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
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
                      {scoringDescription}
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
                {displayData.map((player, index) => {
                  const isCurrentUser = player.id === currentUserId;
                  const globalIndex = rankingSearch ? index : rankingPage * PAGE_SIZE + index;
                  return (
                    <TableRow
                      key={player.id}
                      className={isCurrentUser ? "bg-primary/10 font-semibold" : ""}
                    >
                      <TableCell className="text-center sticky left-0 bg-background z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            globalIndex === 0
                              ? "bg-yellow-500 text-yellow-950"
                              : globalIndex === 1
                              ? "bg-slate-300 text-slate-900"
                              : globalIndex === 2
                              ? "bg-orange-600 text-orange-50"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {globalIndex + 1}
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

        {/* Paginação */}
        {displayTotalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {rankingPage * PAGE_SIZE + 1}-{Math.min((rankingPage + 1) * PAGE_SIZE, sortedGeneralRanking.length)} de {sortedGeneralRanking.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setRankingPage(p => p - 1)}
                disabled={rankingPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {rankingPage + 1} / {displayTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setRankingPage(p => p + 1)}
                disabled={rankingPage >= displayTotalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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

    const freqDisplayData = frequencySearch ? filteredFrequency : paginatedFrequency;
    const freqDisplayTotalPages = frequencySearch ? 1 : frequencyTotalPages;

    return (
      <div className="space-y-2">
        {/* Busca */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jogador..."
            value={frequencySearch}
            onChange={(e) => {
              setFrequencySearch(e.target.value);
              setFrequencyPage(0);
            }}
            className="pl-9 h-9"
          />
        </div>

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
              {freqDisplayData.map((player, index) => {
                const isCurrentUser = player.id === currentUserId;
                const globalIndex = frequencySearch ? index : frequencyPage * PAGE_SIZE + index;
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
                        {globalIndex + 1}
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

        {/* Paginação */}
        {freqDisplayTotalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {frequencyPage * PAGE_SIZE + 1}-{Math.min((frequencyPage + 1) * PAGE_SIZE, filteredFrequency.length)} de {filteredFrequency.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setFrequencyPage(p => p - 1)}
                disabled={frequencyPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {frequencyPage + 1} / {freqDisplayTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setFrequencyPage(p => p + 1)}
                disabled={frequencyPage >= freqDisplayTotalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="col-span-full bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Rankings
              {currentSeasonName && (
                <Badge variant="outline" className="ml-2 text-xs">{currentSeasonName}</Badge>
              )}
            </CardTitle>
            <CardDescription>Melhores jogadores do grupo</CardDescription>
          </div>
          {seasons.length > 0 && groupId && (
            <Select value={currentSeasonId || ""} onValueChange={handleSeasonChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Temporada ativa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📊 Geral (todas)</SelectItem>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.status === "active" ? "⚽" : s.status === "finished" ? "✅" : "📅"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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
            <div className="text-xs md:text-sm text-muted-foreground mb-2 px-2 md:px-0 space-y-0.5">
              <div>{scoringDescription}</div>
              <div>{tiebreakerDescription}</div>
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
                  Top 10 menos vazados
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
                    <DialogDescription>Top 10 menos vazados do grupo</DialogDescription>
                  </DialogHeader>
                  {renderRankingList(goalkeepersData, "Nenhum goleiro com jogos registrados ainda", true)}
                </DialogContent>
              </Dialog>
              </div>
            </div>
            {renderRankingList(goalkeepersData, "Nenhum goleiro com jogos registrados ainda")}
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
