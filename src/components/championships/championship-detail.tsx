"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Plus, Play, AlertCircle, Users, ChevronRight, Crown, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ─── Shared Types ──────────────────────────────────────────────────────────────

export type ChampionshipData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  format: string;
  teamFormation: string;
  startsAt: string | null;
  endsAt: string | null;
  matchDurationMinutes: number;
  matchWinGoalDiff: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
};

export type MemberOption = { id: string; name: string };

export type TeamPlayer = {
  id: string;
  userId: string;
  userName: string;
  isCaptain: boolean;
};

export type TeamData = {
  id: string;
  name: string;
  color: string;
  seed: number | null;
  players: TeamPlayer[];
};

type MatchData = {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeamColor: string | null;
  awayTeamColor: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  eventId: string | null;
  matchPosition: number | null;
};

type RoundData = {
  id: string;
  round_number: number;
  round_name: string | null;
  scheduled_at: string | null;
  matches: MatchData[];
};

type StandingData = {
  championship_id: string;
  team_id: string;
  team_name: string;
  team_color: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
};

type Props = {
  groupId: string;
  championship: ChampionshipData;
  teams: TeamData[];
  members: MemberOption[];
  initialRounds: RoundData[];
  initialStandings: StandingData[];
  isAdmin: boolean;
  currentUserId: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  active: "Em andamento",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  active: "default",
  finished: "outline",
  cancelled: "destructive",
};

const TEAM_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#0f172a",
];

function formatDateShort(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function TeamColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

// ─── Team Card (draft mode) ────────────────────────────────────────────────────

function TeamCard({
  team,
  isAdmin,
  groupId,
  championshipId,
  onDeleted,
}: {
  team: TeamData;
  isAdmin?: boolean;
  groupId?: string;
  championshipId?: string;
  onDeleted?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!groupId || !championshipId || !onDeleted) return;
    if (!confirm(`Remover o time "${team.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/championships/${championshipId}/teams/${team.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Erro ao remover time"); return; }
      onDeleted();
    } catch {
      alert("Erro de conexão");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: team.color }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TeamColorDot color={team.color} />
          <span className="font-semibold">{team.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {team.players.length} jogador{team.players.length !== 1 ? "es" : ""}
          </span>
          {isAdmin && onDeleted && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 ml-1"
              title="Remover time"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="space-y-1">
          {team.players.map(p => (
            <div key={p.id} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {p.isCaptain && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
              <span>{p.userName}</span>
            </div>
          ))}
          {team.players.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Sem jogadores</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Add Team Modal ────────────────────────────────────────────────────────────

function AddTeamModal({
  open,
  onClose,
  groupId,
  championshipId,
  members,
  assignedUserIds,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  championshipId: string;
  members: MemberOption[];
  assignedUserIds: Set<string>;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName(""); setColor(TEAM_COLORS[0]); setCaptainId(null);
    setSelectedIds(new Set()); setError("");
  }

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (captainId === id) setCaptainId(null); }
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) { setError("Selecione ao menos 1 jogador"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/groups/${groupId}/championships/${championshipId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color,
          playerIds: Array.from(selectedIds),
          captainId: captainId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar time"); return; }
      reset();
      onCreated();
      onClose();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  const availableMembers = members.filter(m => !assignedUserIds.has(m.id));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Time</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Nome do Time *</Label>
            <Input
              id="t-name"
              placeholder="Ex: Los Galácticos"
              value={name}
              onChange={e => setName(e.target.value)}
              required minLength={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "hsl(var(--foreground))" : "transparent",
                    boxShadow: color === c ? "0 0 0 2px hsl(var(--background))" : "none",
                    outline: color === c ? "2px solid " + c : "none",
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Jogadores {availableMembers.length === 0 && members.length > 0 ? "(todos já alocados)" : ""}</Label>
            <div className="rounded-lg border divide-y max-h-52 overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">Nenhum membro no grupo</p>
              ) : (
                members.map(m => {
                  const isAssigned = assignedUserIds.has(m.id);
                  const isSelected = selectedIds.has(m.id);
                  const isCaptain = captainId === m.id;
                  return (
                    <div key={m.id} className={`flex items-center justify-between px-3 py-2 ${isAssigned ? "opacity-40" : ""}`}>
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => !isAssigned && toggle(m.id)}
                          disabled={isAssigned}
                          className="rounded"
                        />
                        <span className="text-sm">{m.name}</span>
                        {isAssigned && <span className="text-xs text-muted-foreground">(em outro time)</span>}
                      </label>
                      {isSelected && !isAssigned && (
                        <button
                          type="button"
                          onClick={() => setCaptainId(isCaptain ? null : m.id)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            isCaptain
                              ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400"
                              : "border-muted text-muted-foreground hover:border-amber-300"
                          }`}
                        >
                          <Star className={`h-3 w-3 inline ${isCaptain ? "fill-amber-500 text-amber-500" : ""}`} />
                          {isCaptain ? " Cap" : " Cap?"}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {selectedIds.size > 0 && (
              <p className="text-xs text-muted-foreground">{selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Criando..." : "Criar Time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Match Result Modal ────────────────────────────────────────────────────────

function MatchResultModal({
  match,
  groupId,
  championshipId,
  onClose,
  onSaved,
}: {
  match: MatchData | null;
  groupId: string;
  championshipId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (match) {
      setHomeScore(match.homeScore ?? 0);
      setAwayScore(match.awayScore ?? 0);
      setError("");
    }
  }, [match]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!match) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/groups/${groupId}/championships/${championshipId}/matches/${match.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ homeScore, awayScore }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao salvar resultado"); return; }
      onSaved();
      onClose();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!match} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Resultado</DialogTitle>
          <DialogDescription>
            {match?.homeTeamName} × {match?.awayTeamName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <TeamColorDot color={match?.homeTeamColor ?? "#666"} />
                <Label className="font-medium">{match?.homeTeamName}</Label>
              </div>
              <Input
                type="number"
                min={0}
                max={99}
                value={homeScore}
                onChange={e => setHomeScore(Number(e.target.value))}
                className="text-center text-2xl font-bold h-14"
              />
            </div>
            <span className="text-2xl font-bold text-muted-foreground">×</span>
            <div className="flex-1 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <TeamColorDot color={match?.awayTeamColor ?? "#666"} />
                <Label className="font-medium">{match?.awayTeamName}</Label>
              </div>
              <Input
                type="number"
                min={0}
                max={99}
                value={awayScore}
                onChange={e => setAwayScore(Number(e.target.value))}
                className="text-center text-2xl font-bold h-14"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar Resultado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Standings Table ───────────────────────────────────────────────────────────

function StandingsTable({ standings }: { standings: StandingData[] }) {
  if (standings.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Classificação será atualizada após o primeiro resultado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 text-center">#</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-center font-bold">PTS</TableHead>
            <TableHead className="text-center">J</TableHead>
            <TableHead className="text-center">V</TableHead>
            <TableHead className="text-center">E</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">GP</TableHead>
            <TableHead className="text-center">GC</TableHead>
            <TableHead className="text-center">SG</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((s, i) => (
            <TableRow key={s.team_id} className={i === 0 ? "bg-primary/5" : ""}>
              <TableCell className="text-center font-medium text-muted-foreground">
                {i === 0 ? <Crown className="h-4 w-4 text-amber-500 mx-auto" /> : i + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <TeamColorDot color={s.team_color} />
                  <span className="font-medium">{s.team_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-bold tabular-nums">{s.points}</TableCell>
              <TableCell className="text-center tabular-nums text-muted-foreground">{s.played}</TableCell>
              <TableCell className="text-center tabular-nums text-green-600 dark:text-green-400">{s.wins}</TableCell>
              <TableCell className="text-center tabular-nums text-muted-foreground">{s.draws}</TableCell>
              <TableCell className="text-center tabular-nums text-destructive">{s.losses}</TableCell>
              <TableCell className="text-center tabular-nums">{s.goals_for}</TableCell>
              <TableCell className="text-center tabular-nums">{s.goals_against}</TableCell>
              <TableCell className="text-center tabular-nums font-medium">
                {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Bracket View (single elimination) ────────────────────────────────────────

function EliminationMatchCard({
  match: m,
  isAdmin,
  onClick,
}: {
  match: MatchData;
  isAdmin: boolean;
  onClick: () => void;
}) {
  const isFinished = m.status === "finished";
  const isTBD = !m.homeTeamId || !m.awayTeamId;
  const canEdit = isAdmin && !isFinished && !isTBD;

  const homeWon = isFinished && m.homeScore != null && m.awayScore != null && m.homeScore > m.awayScore;
  const awayWon = isFinished && m.homeScore != null && m.awayScore != null && m.awayScore > m.homeScore;

  return (
    <Card
      className={`w-44 shrink-0 ${canEdit ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
        ${isFinished ? "border-primary/30" : ""}`}
      onClick={canEdit ? onClick : undefined}
    >
      <CardContent className="p-0">
        {/* Home team row */}
        <div
          className={`flex items-center justify-between gap-1 px-3 py-2 border-b
            ${homeWon ? "bg-green-50 dark:bg-green-950/30" : ""}
            ${!m.homeTeamId ? "opacity-50" : ""}`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {m.homeTeamColor && <TeamColorDot color={m.homeTeamColor} />}
            <span className={`text-xs truncate ${homeWon ? "font-bold" : ""}`}>
              {m.homeTeamName ?? "A definir"}
            </span>
          </div>
          {isFinished && (
            <span className={`tabular-nums text-sm font-bold shrink-0 ${homeWon ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
              {m.homeScore}
            </span>
          )}
        </div>

        {/* Away team row */}
        <div
          className={`flex items-center justify-between gap-1 px-3 py-2
            ${awayWon ? "bg-green-50 dark:bg-green-950/30" : ""}
            ${!m.awayTeamId ? "opacity-50" : ""}`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {m.awayTeamColor && <TeamColorDot color={m.awayTeamColor} />}
            <span className={`text-xs truncate ${awayWon ? "font-bold" : ""}`}>
              {m.awayTeamName ?? "A definir"}
            </span>
          </div>
          {isFinished && (
            <span className={`tabular-nums text-sm font-bold shrink-0 ${awayWon ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
              {m.awayScore}
            </span>
          )}
        </div>

        {/* Footer */}
        {(isFinished || canEdit) && (
          <div className="px-3 py-1 border-t flex items-center justify-center">
            {isFinished
              ? <span className="text-[10px] text-muted-foreground">Finalizado</span>
              : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BracketView({
  rounds,
  isAdmin,
  onMatchClick,
}: {
  rounds: RoundData[];
  isAdmin: boolean;
  onMatchClick: (m: MatchData) => void;
}) {
  if (rounds.length === 0) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma rodada gerada.</div>;
  }

  // Max matches in round 1 determines bracket height
  const maxMatches = rounds[0]?.matches.length ?? 1;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max items-start">
        {rounds.map((r) => {
          const matchCount = r.matches.length;
          // Vertical gap between matches grows with each round to center them
          const gapFactor = maxMatches / matchCount;
          const cardHeight = 88; // approx px per card
          const baseGap = 12;
          const gap = Math.round((gapFactor - 1) * (cardHeight + baseGap) + baseGap);

          return (
            <div key={r.id} className="flex flex-col items-center" style={{ minWidth: 176 }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 text-center">
                {r.round_name ?? `Rodada ${r.round_number}`}
              </p>
              <div className="flex flex-col" style={{ gap }}>
                {r.matches.map((m) => (
                  <EliminationMatchCard
                    key={m.id}
                    match={m}
                    isAdmin={isAdmin}
                    onClick={() => onMatchClick(m)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Rounds Tab ────────────────────────────────────────────────────────────────

function RoundsTab({
  rounds,
  isAdmin,
  onMatchClick,
}: {
  rounds: RoundData[];
  isAdmin: boolean;
  onMatchClick: (m: MatchData) => void;
}) {
  if (rounds.length === 0) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma rodada gerada ainda.</div>;
  }

  return (
    <div className="space-y-6">
      {rounds.map(r => (
        <div key={r.id}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {r.round_name ?? `Rodada ${r.round_number}`}
            </h3>
            {r.scheduled_at && (
              <span className="text-xs text-muted-foreground">{formatDateShort(r.scheduled_at)}</span>
            )}
          </div>
          <div className="space-y-2">
            {r.matches.map(m => (
              <MatchCard key={m.id} match={m} isAdmin={isAdmin} onClick={() => onMatchClick(m)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchCard({ match: m, isAdmin, onClick }: { match: MatchData; isAdmin: boolean; onClick: () => void }) {
  const isFinished = m.status === "finished";
  const isTBD = !m.homeTeamId || !m.awayTeamId;
  const canEdit = isAdmin && !isFinished && !isTBD;

  return (
    <Card
      className={`${canEdit ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={canEdit ? onClick : undefined}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {/* Home team */}
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <span className={`font-medium text-sm truncate ${!m.homeTeamId ? "text-muted-foreground italic" : ""}`}>
              {m.homeTeamName ?? "A definir"}
            </span>
            {m.homeTeamColor && <TeamColorDot color={m.homeTeamColor} />}
          </div>

          {/* Score / vs */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isFinished ? (
              <>
                <span className="font-bold tabular-nums w-5 text-center">{m.homeScore}</span>
                <span className="text-muted-foreground text-xs">×</span>
                <span className="font-bold tabular-nums w-5 text-center">{m.awayScore}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs px-2">vs</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {m.awayTeamColor && <TeamColorDot color={m.awayTeamColor} />}
            <span className={`font-medium text-sm truncate ${!m.awayTeamId ? "text-muted-foreground italic" : ""}`}>
              {m.awayTeamName ?? "A definir"}
            </span>
          </div>

          {/* Status / action */}
          {isFinished ? (
            <Badge variant="outline" className="text-[10px] shrink-0">Fim</Badge>
          ) : canEdit ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Teams Tab ─────────────────────────────────────────────────────────────────

function TeamsTab({ teams }: { teams: TeamData[] }) {
  if (teams.length === 0) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Nenhum time cadastrado.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {teams.map(t => (
        <TeamCard key={t.id} team={t} />
      ))}
    </div>
  );
}

// ─── Draft Panel ───────────────────────────────────────────────────────────────

function DraftPanel({
  championship,
  groupId,
  teams,
  members,
  isAdmin,
  onTeamAdded,
  onGenerated,
}: {
  championship: ChampionshipData;
  groupId: string;
  teams: TeamData[];
  members: MemberOption[];
  isAdmin: boolean;
  onTeamAdded: () => void;
  onGenerated: () => void;
}) {
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const router = useRouter();

  const assignedUserIds = new Set(teams.flatMap(t => t.players.map(p => p.userId)));

  async function handleGenerateRounds() {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch(
        `/api/groups/${groupId}/championships/${championship.id}/generate-rounds`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
      );
      const data = await res.json();
      if (!res.ok) { setGenError(data.error ?? "Erro ao gerar rodadas"); setGenerating(false); return; }
      setShowConfirm(false);
      router.refresh();
      onGenerated();
    } catch {
      setGenError("Erro de conexão");
      setGenerating(false);
    }
  }

  return (
    <div>
      {/* Draft notice */}
      <div className="rounded-lg border border-dashed p-4 mb-6 bg-muted/40">
        <div className="flex items-start gap-3">
          <Trophy className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">Campeonato em Rascunho</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicione os times e jogadores, depois clique em <strong>Iniciar Campeonato</strong> para gerar as rodadas automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Teams header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Times ({teams.length})
        </h2>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setShowAddTeam(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Time
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-10 rounded-lg border border-dashed text-muted-foreground text-sm mb-6">
          Nenhum time cadastrado. Adicione times para iniciar o campeonato.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {teams.map(t => (
            <TeamCard
              key={t.id}
              team={t}
              isAdmin={isAdmin}
              groupId={groupId}
              championshipId={championship.id}
              onDeleted={() => { router.refresh(); onTeamAdded(); }}
            />
          ))}
        </div>
      )}

      {/* Generate rounds button */}
      {isAdmin && (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            disabled={teams.length < 2}
            onClick={() => setShowConfirm(true)}
            className="w-full max-w-sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Campeonato
          </Button>
          {teams.length < 2 && (
            <p className="text-xs text-muted-foreground">
              Mínimo de 2 times necessários (atual: {teams.length})
            </p>
          )}
        </div>
      )}

      {/* Add team modal */}
      <AddTeamModal
        open={showAddTeam}
        onClose={() => setShowAddTeam(false)}
        groupId={groupId}
        championshipId={championship.id}
        members={members}
        assignedUserIds={assignedUserIds}
        onCreated={() => { router.refresh(); onTeamAdded(); }}
      />

      {/* Confirm generate rounds */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Iniciar Campeonato?</DialogTitle>
            <DialogDescription>
              {championship.format === "single_elimination"
                ? `Bracket de eliminatórias com ${teams.length} times. ${Math.ceil(Math.log2(teams.length))} rodadas até a final.`
                : `Serão geradas ${teams.length % 2 === 0 ? teams.length - 1 : teams.length} rodadas com ${Math.floor(teams.length / 2)} partidas cada. Os eventos serão criados automaticamente no calendário do grupo.`}
            </DialogDescription>
          </DialogHeader>

          {championship.startsAt && (
            <p className="text-sm text-muted-foreground">
              Início: {new Date(championship.startsAt).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric"
              })}.
            </p>
          )}

          {genError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {genError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancelar</Button>
            <Button onClick={handleGenerateRounds} disabled={generating}>
              {generating ? "Gerando..." : "Confirmar e Iniciar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Championship Detail Component ────────────────────────────────────────

export function ChampionshipDetail({
  groupId,
  championship,
  teams,
  members,
  initialRounds,
  initialStandings,
  isAdmin,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [rounds, setRounds] = useState<RoundData[]>(initialRounds);
  const [standings, setStandings] = useState<StandingData[]>(initialStandings);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const defaultTab = championship.format === "single_elimination" ? "bracket" : "standings";
  const [tab, setTab] = useState(defaultTab);

  // Poll standings every 15s when active
  const fetchStandings = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/championships/${championship.id}/standings`);
      if (!res.ok) return;
      const data = await res.json();
      setStandings(data.standings ?? []);
    } catch { /* ignore */ }
  }, [groupId, championship.id]);

  useEffect(() => {
    if (championship.status !== "active") return;
    const id = setInterval(fetchStandings, 15000);
    return () => clearInterval(id);
  }, [championship.status, fetchStandings]);

  // Refresh rounds after result saved
  async function refreshRounds() {
    try {
      const res = await fetch(`/api/groups/${groupId}/championships/${championship.id}/rounds`);
      if (!res.ok) return;
      const data = await res.json();
      setRounds(data.rounds ?? []);
    } catch { /* ignore */ }
    fetchStandings();
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold truncate">{championship.name}</h1>
            <Badge variant={STATUS_VARIANT[championship.status] ?? "outline"}>
              {STATUS_LABEL[championship.status] ?? championship.status}
            </Badge>
          </div>
          {championship.description && (
            <p className="text-sm text-muted-foreground mt-1">{championship.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{championship.matchDurationMinutes} min por partida</span>
            <span>·</span>
            <span>{championship.matchWinGoalDiff} gols encerram a partida</span>
            <span>·</span>
            <span>{teams.length} time{teams.length !== 1 ? "s" : ""}</span>
            {championship.startsAt && (
              <>
                <span>·</span>
                <span>Início: {formatDateShort(championship.startsAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Finished banner */}
      {championship.status === "finished" && (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800 p-4 mb-6 flex items-center gap-3">
          <Trophy className="h-6 w-6 text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Campeonato Encerrado!</p>
            {standings[0] && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Campeão: <strong>{standings[0].team_name}</strong> com {standings[0].points} pontos
              </p>
            )}
          </div>
        </div>
      )}

      {/* Draft mode */}
      {championship.status === "draft" && (
        <DraftPanel
          championship={championship}
          groupId={groupId}
          teams={teams}
          members={members}
          isAdmin={isAdmin}
          onTeamAdded={() => {}}
          onGenerated={() => {}}
        />
      )}

      {/* Active / Finished mode — single elimination */}
      {(championship.status === "active" || championship.status === "finished") &&
        championship.format === "single_elimination" && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="bracket">Chaveamento</TabsTrigger>
            <TabsTrigger value="teams">Times</TabsTrigger>
          </TabsList>

          <TabsContent value="bracket">
            <BracketView
              rounds={rounds}
              isAdmin={isAdmin}
              onMatchClick={m => setSelectedMatch(m)}
            />
          </TabsContent>

          <TabsContent value="teams">
            <TeamsTab teams={teams} />
          </TabsContent>
        </Tabs>
      )}

      {/* Active / Finished mode — round robin */}
      {(championship.status === "active" || championship.status === "finished") &&
        championship.format !== "single_elimination" && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="standings">Classificação</TabsTrigger>
            <TabsTrigger value="rounds">Rodadas</TabsTrigger>
            <TabsTrigger value="teams">Times</TabsTrigger>
          </TabsList>

          <TabsContent value="standings">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Classificação
                  {championship.status === "active" && (
                    <span className="text-xs text-muted-foreground font-normal ml-auto">
                      Atualiza automaticamente
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <StandingsTable standings={standings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rounds">
            <RoundsTab
              rounds={rounds}
              isAdmin={isAdmin}
              onMatchClick={m => setSelectedMatch(m)}
            />
          </TabsContent>

          <TabsContent value="teams">
            <TeamsTab teams={teams} />
          </TabsContent>
        </Tabs>
      )}

      {/* Match result modal */}
      <MatchResultModal
        match={selectedMatch}
        groupId={groupId}
        championshipId={championship.id}
        onClose={() => setSelectedMatch(null)}
        onSaved={refreshRounds}
      />
    </div>
  );
}
