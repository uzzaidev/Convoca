"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy, Plus, Play, AlertCircle, Users, ChevronRight,
  Crown, Star, Trash2, Radio, Pencil, Goal, X, UserPlus, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

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
  userId: string | null;
  guestName: string | null;
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
  teamId: string;
  teamName: string;
  teamColor: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  position?: number;
};

type TopScorer = {
  user_id: string;
  user_name: string;
  user_image: string | null;
  team_name: string;
  team_color: string;
  goals: number;
};

type Props = {
  groupId: string;
  championship: ChampionshipData;
  teams: TeamData[];
  members: MemberOption[];
  initialRounds: RoundData[];
  initialStandings: StandingData[];
  initialTopScorers: TopScorer[];
  isAdmin: boolean;
  currentUserId: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft:     "Rascunho",
  active:    "Em andamento",
  finished:  "Finalizado",
  cancelled: "Cancelado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft:     "secondary",
  active:    "default",
  finished:  "outline",
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

// ─── Live badge ────────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
      <Radio className="h-2.5 w-2.5 animate-pulse" />
      Ao vivo
    </span>
  );
}

// ─── Link Player Dialog ────────────────────────────────────────────────────────

function LinkPlayerDialog({
  open, onClose, groupId, championshipId, teamId, playerId, guestName, onLinked,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  championshipId: string;
  teamId: string;
  playerId: string;
  guestName: string;
  onLinked: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); setError(""); }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.users ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function handleLink(userId: string) {
    setLinking(true); setError("");
    try {
      const res = await fetch(
        `/api/groups/${groupId}/championships/${championshipId}/teams/${teamId}/players/${playerId}/link`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao vincular"); setLinking(false); return; }
      onLinked(); onClose();
    } catch {
      setError("Erro de conexão"); setLinking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Vincular "{guestName}"</DialogTitle>
          <DialogDescription>Busque o usuário cadastrado para vincular a este jogador.</DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Nome ou e-mail..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {searching && <p className="text-xs text-muted-foreground">Buscando...</p>}
        {results.length > 0 && (
          <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
            {results.map(u => (
              <button
                key={u.id}
                type="button"
                disabled={linking}
                onClick={() => handleLink(u.id)}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </button>
            ))}
          </div>
        )}
        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum usuário encontrado</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={linking}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Team Card (draft mode) ────────────────────────────────────────────────────

function TeamCard({
  team,
  isAdmin,
  groupId,
  championshipId,
  onDeleted,
  onLinked,
}: {
  team: TeamData;
  isAdmin?: boolean;
  groupId?: string;
  championshipId?: string;
  onDeleted?: () => void;
  onLinked?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [linkTarget, setLinkTarget] = useState<TeamPlayer | null>(null);

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
              {!p.userId && <Link2 className="h-3 w-3 text-muted-foreground/50" />}
              <span className={!p.userId ? "italic text-muted-foreground/70" : ""}>{p.userName}</span>
              {isAdmin && !p.userId && groupId && championshipId && onLinked && (
                <button
                  type="button"
                  onClick={() => setLinkTarget(p)}
                  className="ml-auto text-xs text-primary hover:underline flex items-center gap-0.5"
                  title="Vincular a usuário"
                >
                  <UserPlus className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {team.players.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Sem jogadores</p>
          )}
        </div>
      </CardContent>
      {groupId && championshipId && onLinked && linkTarget && !linkTarget.userId && (
        <LinkPlayerDialog
          open={!!linkTarget}
          onClose={() => setLinkTarget(null)}
          groupId={groupId}
          championshipId={championshipId}
          teamId={team.id}
          playerId={linkTarget.id}
          guestName={linkTarget.guestName ?? linkTarget.userName}
          onLinked={() => { setLinkTarget(null); onLinked(); }}
        />
      )}
    </Card>
  );
}

// ─── Add Team Modal ────────────────────────────────────────────────────────────

function AddTeamModal({
  open, onClose, groupId, championshipId, members, assignedUserIds, onCreated,
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
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName(""); setColor(TEAM_COLORS[0]); setCaptainId(null);
    setSelectedIds(new Set()); setGuestNames([]); setGuestInput(""); setError("");
  }

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (captainId === id) setCaptainId(null); }
      else next.add(id);
      return next;
    });
  }

  function addGuest() {
    const n = guestInput.trim();
    if (!n) return;
    setGuestNames(prev => [...prev, n]);
    setGuestInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0 && guestNames.length === 0) { setError("Adicione ao menos 1 jogador"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/groups/${groupId}/championships/${championshipId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), color,
          playerIds: Array.from(selectedIds),
          guestNames,
          captainId: captainId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar time"); return; }
      reset(); onCreated(); onClose();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Adicionar Time</DialogTitle></DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Nome do Time *</Label>
            <Input
              id="t-name" placeholder="Ex: Los Galácticos"
              value={name} onChange={e => setName(e.target.value)}
              required minLength={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map(c => (
                <button
                  key={c} type="button" onClick={() => setColor(c)}
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
            <Label>Jogadores {assignedUserIds.size > 0 && members.filter(m => !assignedUserIds.has(m.id)).length === 0 ? "(todos já alocados)" : ""}</Label>
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
                          type="checkbox" checked={isSelected}
                          onChange={() => !isAssigned && toggle(m.id)}
                          disabled={isAssigned} className="rounded"
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

          {/* Jogadores avulsos (sem cadastro) */}
          <div className="space-y-2">
            <Label>Jogadores sem cadastro <span className="text-muted-foreground font-normal">(apelido)</span></Label>
            <div className="flex gap-2">
              <Input
                placeholder="Apelido do jogador..."
                value={guestInput}
                onChange={e => setGuestInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGuest(); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addGuest} disabled={!guestInput.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {guestNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {guestNames.map((n, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                    <Link2 className="h-3 w-3 text-muted-foreground/60" />
                    {n}
                    <button type="button" onClick={() => setGuestNames(prev => prev.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
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
// Suporta 3 fluxos: iniciar partida / placar ao vivo / corrigir resultado

type GoalEntry = { side: "home" | "away"; scorerId: string | null; assisterId: string | null; loading: boolean };

function MatchResultModal({
  match,
  groupId,
  championshipId,
  isAdmin,
  teams,
  onClose,
  onSaved,
}: {
  match: MatchData | null;
  groupId: string;
  championshipId: string;
  isAdmin: boolean;
  teams: TeamData[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [goalEntry, setGoalEntry] = useState<GoalEntry | null>(null);

  useEffect(() => {
    if (match) {
      setHomeScore(match.homeScore ?? 0);
      setAwayScore(match.awayScore ?? 0);
      setError("");
      setEditMode(false);
      setConfirmCancel(false);
      setGoalEntry(null);
    }
  }, [match]);

  function getTeamPlayers(teamId: string | null) {
    if (!teamId) return [];
    return (teams.find(t => t.id === teamId)?.players ?? []).filter(p => !!p.userId);
  }

  async function handleRegisterGoal() {
    if (!match || !goalEntry || !goalEntry.scorerId) return;
    setGoalEntry(g => g && ({ ...g, loading: true }));
    try {
      const res = await fetch(
        `/api/groups/${groupId}/championships/${championshipId}/matches/${match.id}/goals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamSide: goalEntry.side,
            scorerId: goalEntry.scorerId,
            assisterId: goalEntry.assisterId || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao registrar gol"); setGoalEntry(g => g && ({ ...g, loading: false })); return; }
      if (goalEntry.side === "home") setHomeScore(data.homeScore);
      else setAwayScore(data.awayScore);
      setGoalEntry(null);
    } catch {
      setError("Erro de conexão");
      setGoalEntry(g => g && ({ ...g, loading: false }));
    }
  }

  async function patchMatch(body: Record<string, unknown>) {
    const res = await fetch(
      `/api/groups/${groupId}/championships/${championshipId}/matches/${match!.id}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
    return data;
  }

  async function handleStart() {
    if (!match) return;
    setLoading(true); setError("");
    try {
      await patchMatch({ action: "start" });
      onSaved(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelMatch() {
    if (!match) return;
    setLoading(true); setError("");
    try {
      await patchMatch({ action: "cancel" });
      onSaved(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de conexão");
    } finally {
      setLoading(false);
      setConfirmCancel(false);
    }
  }

  async function handleSaveScore() {
    if (!match) return;
    setLoading(true); setError("");
    try {
      await patchMatch({ homeScore, awayScore });
      onSaved(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (!match) return null;

  const isScheduled = match.status === "scheduled";
  const isPlaying   = match.status === "playing";
  const isFinished  = match.status === "finished";
  const showEdit    = isFinished && isAdmin && !editMode;
  const showScoreForm = isScheduled || isPlaying || (isFinished && editMode);

  return (
    <Dialog open={!!match} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPlaying && <Radio className="h-4 w-4 text-red-500 animate-pulse" />}
            {isPlaying ? "Placar ao vivo" : isFinished && !editMode ? "Resultado" : "Registrar Resultado"}
          </DialogTitle>
          <DialogDescription>
            {match.homeTeamName} × {match.awayTeamName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Scores */}
          <div className="flex items-center gap-4">
            {/* Home */}
            <div className="flex-1 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <TeamColorDot color={match.homeTeamColor ?? "#666"} />
                <span className="text-sm font-medium truncate max-w-[80px]">{match.homeTeamName}</span>
              </div>
              {showScoreForm ? (
                isPlaying ? (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHomeScore(s => Math.max(0, s - 1))}
                      className="w-8 h-8 rounded-full border text-lg font-bold flex items-center justify-center hover:bg-muted transition-colors"
                    >−</button>
                    <span className="text-3xl font-bold tabular-nums w-8 text-center">{homeScore}</span>
                    <button
                      type="button"
                      onClick={() => setHomeScore(s => s + 1)}
                      className="w-8 h-8 rounded-full border text-lg font-bold flex items-center justify-center hover:bg-muted transition-colors"
                    >+</button>
                  </div>
                ) : (
                  <Input
                    type="number" min={0} max={99}
                    value={homeScore}
                    onChange={e => setHomeScore(Number(e.target.value))}
                    className="text-center text-2xl font-bold h-14"
                  />
                )
              ) : (
                <p className="text-3xl font-bold tabular-nums text-center">{match.homeScore ?? 0}</p>
              )}
            </div>

            <span className="text-2xl font-bold text-muted-foreground">×</span>

            {/* Away */}
            <div className="flex-1 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <TeamColorDot color={match.awayTeamColor ?? "#666"} />
                <span className="text-sm font-medium truncate max-w-[80px]">{match.awayTeamName}</span>
              </div>
              {showScoreForm ? (
                isPlaying ? (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAwayScore(s => Math.max(0, s - 1))}
                      className="w-8 h-8 rounded-full border text-lg font-bold flex items-center justify-center hover:bg-muted transition-colors"
                    >−</button>
                    <span className="text-3xl font-bold tabular-nums w-8 text-center">{awayScore}</span>
                    <button
                      type="button"
                      onClick={() => setAwayScore(s => s + 1)}
                      className="w-8 h-8 rounded-full border text-lg font-bold flex items-center justify-center hover:bg-muted transition-colors"
                    >+</button>
                  </div>
                ) : (
                  <Input
                    type="number" min={0} max={99}
                    value={awayScore}
                    onChange={e => setAwayScore(Number(e.target.value))}
                    className="text-center text-2xl font-bold h-14"
                  />
                )
              ) : (
                <p className="text-3xl font-bold tabular-nums text-center">{match.awayScore ?? 0}</p>
              )}
            </div>
          </div>

          {/* Registro de gol por jogador (apenas durante partida em andamento) */}
          {isPlaying && isAdmin && !confirmCancel && (
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              {!goalEntry ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGoalEntry({ side: "home", scorerId: "", assisterId: "", loading: false })}
                    className="flex-1 text-xs font-medium py-2 px-3 rounded-md border bg-background hover:bg-muted transition-colors flex items-center justify-center gap-1"
                  >
                    ⚽ Gol <span className="truncate max-w-[60px]">{match.homeTeamName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoalEntry({ side: "away", scorerId: "", assisterId: "", loading: false })}
                    className="flex-1 text-xs font-medium py-2 px-3 rounded-md border bg-background hover:bg-muted transition-colors flex items-center justify-center gap-1"
                  >
                    ⚽ Gol <span className="truncate max-w-[60px]">{match.awayTeamName}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    ⚽ Gol — {goalEntry.side === "home" ? match.homeTeamName : match.awayTeamName}
                  </p>
                  {/* Scorer */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Quem marcou?</p>
                    <div className="flex flex-wrap gap-1">
                      {getTeamPlayers(goalEntry.side === "home" ? match.homeTeamId : match.awayTeamId).map(p => (
                        <button
                          key={p.userId}
                          type="button"
                          onClick={() => setGoalEntry(g => g && ({ ...g, scorerId: p.userId, assisterId: g.assisterId === p.userId ? "" : g.assisterId }))}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${goalEntry.scorerId === p.userId ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                        >
                          {p.userName}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Assister */}
                  {goalEntry.scorerId && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Assistência? <span className="italic">(opcional)</span></p>
                      <div className="flex flex-wrap gap-1">
                        {getTeamPlayers(goalEntry.side === "home" ? match.homeTeamId : match.awayTeamId)
                          .filter(p => p.userId !== goalEntry.scorerId)
                          .map(p => (
                            <button
                              key={p.userId}
                              type="button"
                              onClick={() => setGoalEntry(g => g && ({ ...g, assisterId: g.assisterId === p.userId ? "" : p.userId }))}
                              className={`text-xs px-2 py-1 rounded-full border transition-colors ${goalEntry.assisterId === p.userId ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                            >
                              {p.userName}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setGoalEntry(null)}
                      className="text-xs px-3 py-1.5 rounded-md border bg-background hover:bg-muted transition-colors">
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!goalEntry.scorerId || goalEntry.loading}
                      onClick={handleRegisterGoal}
                      className="flex-1 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {goalEntry.loading ? "Registrando..." : "Confirmar Gol"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {/* Confirmação inline de cancelamento */}
          {confirmCancel && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
              <p className="text-sm font-medium text-destructive">Cancelar esta partida?</p>
              <p className="text-xs text-muted-foreground">Esta ação não afeta a classificação. A partida será marcada como cancelada.</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setConfirmCancel(false)} className="flex-1">
                  Voltar
                </Button>
                <Button size="sm" variant="destructive" onClick={handleCancelMatch} disabled={loading} className="flex-1">
                  {loading ? "..." : "Confirmar Cancelamento"}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!confirmCancel && (
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {showEdit && (
              <>
                <Button variant="outline" onClick={onClose} className="sm:flex-1">Fechar</Button>
                <Button variant="outline" onClick={() => setEditMode(true)} className="sm:flex-1">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />Corrigir
                </Button>
              </>
            )}
            {isScheduled && (
              <>
                {isAdmin && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmCancel(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mr-auto">
                    Cancelar partida
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
                <Button
                  type="button" variant="outline" onClick={handleStart}
                  disabled={loading} className="sm:flex-1"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  {loading ? "..." : "Iniciar"}
                </Button>
                <Button type="button" onClick={handleSaveScore} disabled={loading} className="sm:flex-1">
                  {loading ? "Salvando..." : "Confirmar"}
                </Button>
              </>
            )}
            {isPlaying && (
              <>
                {isAdmin && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmCancel(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mr-auto">
                    Cancelar partida
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
                <Button type="button" onClick={handleSaveScore} disabled={loading} className="sm:flex-1">
                  {loading ? "Finalizando..." : "Finalizar Partida"}
                </Button>
              </>
            )}
            {isFinished && editMode && (
              <>
                <Button type="button" variant="outline" onClick={() => setEditMode(false)} className="sm:flex-1">Cancelar</Button>
                <Button type="button" onClick={handleSaveScore} disabled={loading} className="sm:flex-1">
                  {loading ? "Salvando..." : "Salvar Correção"}
                </Button>
              </>
            )}
          </DialogFooter>
          )}
        </div>
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
            <TableRow key={s.teamId} className={i === 0 ? "bg-primary/5" : ""}>
              <TableCell className="text-center font-medium text-muted-foreground">
                {i === 0 ? <Crown className="h-4 w-4 text-amber-500 mx-auto" /> : i + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <TeamColorDot color={s.teamColor} />
                  <span className="font-medium">{s.teamName}</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-bold tabular-nums">{s.points}</TableCell>
              <TableCell className="text-center tabular-nums text-muted-foreground">{s.gamesPlayed}</TableCell>
              <TableCell className="text-center tabular-nums text-green-600 dark:text-green-400">{s.wins}</TableCell>
              <TableCell className="text-center tabular-nums text-muted-foreground">{s.draws}</TableCell>
              <TableCell className="text-center tabular-nums text-destructive">{s.losses}</TableCell>
              <TableCell className="text-center tabular-nums">{s.goalsFor}</TableCell>
              <TableCell className="text-center tabular-nums">{s.goalsAgainst}</TableCell>
              <TableCell className="text-center tabular-nums font-medium">
                {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Top Scorers ───────────────────────────────────────────────────────────────

function TopScorersSection({ scorers }: { scorers: TopScorer[] }) {
  if (scorers.length === 0) return null;
  const max = scorers[0].goals;

  return (
    <div className="mt-6 pt-5 border-t">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <Goal className="h-4 w-4 text-primary" />
        Artilheiros
      </h3>
      <div className="space-y-2.5">
        {scorers.slice(0, 5).map((s, i) => (
          <div key={s.user_id} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-4 text-right tabular-nums">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium truncate">{s.user_name}</span>
                <div className="flex items-center gap-1">
                  <TeamColorDot color={s.team_color} />
                  <span className="text-xs text-muted-foreground">{s.team_name}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(s.goals / max) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold tabular-nums shrink-0">
              {s.goals} {s.goals === 1 ? "gol" : "gols"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bracket View (single elimination) ────────────────────────────────────────

function EliminationMatchCard({
  match: m, canManage, onClick,
}: {
  match: MatchData;
  canManage: boolean;
  onClick: () => void;
}) {
  const isFinished = m.status === "finished";
  const isPlaying  = m.status === "playing";
  const isTBD      = !m.homeTeamId || !m.awayTeamId;
  const canClick   = canManage && !isTBD;

  const homeWon = isFinished && m.homeScore != null && m.awayScore != null && m.homeScore > m.awayScore;
  const awayWon = isFinished && m.homeScore != null && m.awayScore != null && m.awayScore > m.homeScore;

  return (
    <Card
      className={`w-44 shrink-0 ${canClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
        ${isFinished ? "border-primary/30" : ""} ${isPlaying ? "border-red-400 dark:border-red-600" : ""}`}
      onClick={canClick ? onClick : undefined}
    >
      <CardContent className="p-0">
        {isPlaying && (
          <div className="px-3 py-1 border-b flex justify-center">
            <LiveBadge />
          </div>
        )}
        <div className={`flex items-center justify-between gap-1 px-3 py-2 border-b
          ${homeWon ? "bg-green-50 dark:bg-green-950/30" : ""}
          ${!m.homeTeamId ? "opacity-50" : ""}`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {m.homeTeamColor && <TeamColorDot color={m.homeTeamColor} />}
            <span className={`text-xs truncate ${homeWon ? "font-bold" : ""}`}>
              {m.homeTeamName ?? "A definir"}
            </span>
          </div>
          {(isFinished || isPlaying) && (
            <span className={`tabular-nums text-sm font-bold shrink-0 ${homeWon ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
              {m.homeScore ?? 0}
            </span>
          )}
        </div>

        <div className={`flex items-center justify-between gap-1 px-3 py-2
          ${awayWon ? "bg-green-50 dark:bg-green-950/30" : ""}
          ${!m.awayTeamId ? "opacity-50" : ""}`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {m.awayTeamColor && <TeamColorDot color={m.awayTeamColor} />}
            <span className={`text-xs truncate ${awayWon ? "font-bold" : ""}`}>
              {m.awayTeamName ?? "A definir"}
            </span>
          </div>
          {(isFinished || isPlaying) && (
            <span className={`tabular-nums text-sm font-bold shrink-0 ${awayWon ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
              {m.awayScore ?? 0}
            </span>
          )}
        </div>

        {(isFinished || canClick) && (
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
  rounds, canManage, onMatchClick,
}: {
  rounds: RoundData[];
  canManage: boolean;
  onMatchClick: (m: MatchData) => void;
}) {
  if (rounds.length === 0) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma rodada gerada.</div>;
  }
  const maxMatches = rounds[0]?.matches.length ?? 1;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max items-start">
        {rounds.map(r => {
          const matchCount = r.matches.length;
          const gapFactor = maxMatches / matchCount;
          const cardHeight = 88;
          const baseGap = 12;
          const gap = Math.round((gapFactor - 1) * (cardHeight + baseGap) + baseGap);

          return (
            <div key={r.id} className="flex flex-col items-center" style={{ minWidth: 176 }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 text-center">
                {r.round_name ?? `Rodada ${r.round_number}`}
              </p>
              <div className="flex flex-col" style={{ gap }}>
                {r.matches.map(m => (
                  <EliminationMatchCard
                    key={m.id} match={m} canManage={canManage}
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

// ─── Match Card (round-robin) ──────────────────────────────────────────────────

function MatchCard({
  match: m, canManage, onClick,
}: {
  match: MatchData;
  canManage: boolean;
  onClick: () => void;
}) {
  const isFinished = m.status === "finished";
  const isPlaying  = m.status === "playing";
  const isTBD      = !m.homeTeamId || !m.awayTeamId;
  const canClick   = canManage && !isTBD;

  return (
    <Card
      className={`${canClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
        ${isPlaying ? "border-red-400 dark:border-red-600" : ""}`}
      onClick={canClick ? onClick : undefined}
    >
      <CardContent className="p-3">
        {isPlaying && (
          <div className="flex justify-center mb-2">
            <LiveBadge />
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <span className={`font-medium text-sm truncate ${!m.homeTeamId ? "text-muted-foreground italic" : ""}`}>
              {m.homeTeamName ?? "A definir"}
            </span>
            {m.homeTeamColor && <TeamColorDot color={m.homeTeamColor} />}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(isFinished || isPlaying) ? (
              <>
                <span className="font-bold tabular-nums w-5 text-center">{m.homeScore ?? 0}</span>
                <span className="text-muted-foreground text-xs">×</span>
                <span className="font-bold tabular-nums w-5 text-center">{m.awayScore ?? 0}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs px-2">vs</span>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            {m.awayTeamColor && <TeamColorDot color={m.awayTeamColor} />}
            <span className={`font-medium text-sm truncate ${!m.awayTeamId ? "text-muted-foreground italic" : ""}`}>
              {m.awayTeamName ?? "A definir"}
            </span>
          </div>

          {isFinished ? (
            <Badge variant="outline" className="text-[10px] shrink-0">Fim</Badge>
          ) : canClick ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Rounds Tab ────────────────────────────────────────────────────────────────

function RoundsTab({
  rounds, canManage, onMatchClick,
}: {
  rounds: RoundData[];
  canManage: boolean;
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
              <MatchCard key={m.id} match={m} canManage={canManage} onClick={() => onMatchClick(m)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Meus Jogos Tab ────────────────────────────────────────────────────────────

function MyMatchesTab({
  rounds, myTeamIds, canManage, onMatchClick,
}: {
  rounds: RoundData[];
  myTeamIds: Set<string>;
  canManage: boolean;
  onMatchClick: (m: MatchData) => void;
}) {
  const myRounds = rounds
    .map(r => ({
      ...r,
      matches: r.matches.filter(m =>
        myTeamIds.has(m.homeTeamId ?? "") || myTeamIds.has(m.awayTeamId ?? "")
      ),
    }))
    .filter(r => r.matches.length > 0);

  if (myTeamIds.size === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Você não está em nenhum time neste campeonato.
      </div>
    );
  }

  if (myRounds.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Nenhuma partida encontrada para o seu time.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {myRounds.map(r => (
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
              <MatchCard key={m.id} match={m} canManage={canManage} onClick={() => onMatchClick(m)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Teams Tab ─────────────────────────────────────────────────────────────────

function TeamsTab({ teams }: { teams: TeamData[] }) {
  if (teams.length === 0) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Nenhum time cadastrado.</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {teams.map(t => <TeamCard key={t.id} team={t} />)}
    </div>
  );
}

// ─── Draw Teams Modal ─────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DrawTeamsModal({
  open, onClose, groupId, championshipId, members, assignedUserIds, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  championshipId: string;
  members: MemberOption[];
  assignedUserIds: Set<string>;
  onCreated: () => void;
}) {
  const availableMembers = members.filter(m => !assignedUserIds.has(m.id));
  const maxTeams = Math.max(2, Math.floor(availableMembers.length / 1));
  const [numTeams, setNumTeams] = useState(Math.min(2, maxTeams));
  const [preview, setPreview] = useState<{ name: string; color: string; players: MemberOption[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function buildPreview(n: number) {
    const shuffled = shuffleArray(availableMembers);
    const teams = Array.from({ length: n }, (_, i) => ({
      name: `Time ${i + 1}`,
      color: TEAM_COLORS[i % TEAM_COLORS.length],
      players: [] as MemberOption[],
    }));
    shuffled.forEach((m, i) => { teams[i % n].players.push(m); });
    return teams.filter(t => t.players.length > 0);
  }

  useEffect(() => {
    if (open) setPreview(buildPreview(numTeams));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleNumChange(n: number) {
    setNumTeams(n);
    setPreview(buildPreview(n));
  }

  function handleReshuffle() {
    setPreview(buildPreview(numTeams));
  }

  async function handleConfirm() {
    if (preview.length === 0) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(
        `/api/groups/${groupId}/championships/${championshipId}/teams`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teams: preview.map(t => ({
              name: t.name,
              color: t.color,
              playerIds: t.players.map(p => p.id),
            })),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar times"); return; }
      onCreated();
      onClose();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function reset() { setError(""); setPreview([]); }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sortear Times</DialogTitle>
          <DialogDescription>
            {availableMembers.length} jogador{availableMembers.length !== 1 ? "es" : ""} disponíve{availableMembers.length !== 1 ? "is" : "l"} para sorteio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3">
            <Label className="shrink-0">Número de times</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNumChange(Math.max(2, numTeams - 1))}
                disabled={numTeams <= 2}
                className="w-8 h-8 rounded-full border font-bold flex items-center justify-center hover:bg-muted disabled:opacity-40"
              >−</button>
              <span className="w-6 text-center font-bold tabular-nums">{numTeams}</span>
              <button
                type="button"
                onClick={() => handleNumChange(Math.min(maxTeams, numTeams + 1))}
                disabled={numTeams >= maxTeams}
                className="w-8 h-8 rounded-full border font-bold flex items-center justify-center hover:bg-muted disabled:opacity-40"
              >+</button>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Pré-visualização</p>
                <Button type="button" size="sm" variant="ghost" onClick={handleReshuffle} className="text-xs h-7">
                  Sortear novamente
                </Button>
              </div>
              <div className="rounded-lg border divide-y max-h-60 overflow-y-auto">
                {preview.map((team, i) => (
                  <div key={i} className="p-2.5 flex items-start gap-2">
                    <span
                      className="mt-0.5 inline-block w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.players.map(p => p.name).join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button type="button" onClick={handleConfirm} disabled={loading || preview.length === 0}>
            {loading ? "Criando times..." : "Confirmar Sorteio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Draft Panel ───────────────────────────────────────────────────────────────

function DraftPanel({
  championship, groupId, teams, members, isAdmin, onTeamAdded, onGenerated,
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
  const [showDrawTeams, setShowDrawTeams] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [singleDay, setSingleDay] = useState(!!championship.startsAt);
  const router = useRouter();

  const assignedUserIds = new Set(teams.flatMap(t => t.players.map(p => p.userId).filter((id): id is string => !!id)));

  async function handleGenerateRounds() {
    setGenerating(true); setGenError("");
    try {
      const res = await fetch(
        `/api/groups/${groupId}/championships/${championship.id}/generate-rounds`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ singleDay }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setGenError(data.error ?? "Erro ao gerar rodadas"); setGenerating(false); return; }
      setShowConfirm(false);
      router.refresh();
      onGenerated();
    } catch {
      setGenError("Erro de conexão"); setGenerating(false);
    }
  }

  return (
    <div>
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Times ({teams.length})
        </h2>
        {isAdmin && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowDrawTeams(true)}
              disabled={members.length < 2}
              title={members.length < 2 ? "Precisa de ao menos 2 membros no grupo" : "Sortear times automaticamente"}>
              <Users className="h-4 w-4 mr-1" />Sortear
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddTeam(true)}>
              <Plus className="h-4 w-4 mr-1" />Adicionar Time
            </Button>
          </div>
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
              key={t.id} team={t}
              isAdmin={isAdmin} groupId={groupId} championshipId={championship.id}
              onDeleted={() => { router.refresh(); onTeamAdded(); }}
              onLinked={() => { router.refresh(); onTeamAdded(); }}
            />
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg" disabled={teams.length < 2}
            onClick={() => setShowConfirm(true)} className="w-full max-w-sm"
          >
            <Play className="h-4 w-4 mr-2" />Iniciar Campeonato
          </Button>
          {teams.length < 2 && (
            <p className="text-xs text-muted-foreground">
              Mínimo de 2 times necessários (atual: {teams.length})
            </p>
          )}
        </div>
      )}

      <AddTeamModal
        open={showAddTeam} onClose={() => setShowAddTeam(false)}
        groupId={groupId} championshipId={championship.id}
        members={members} assignedUserIds={assignedUserIds}
        onCreated={() => { router.refresh(); onTeamAdded(); }}
      />

      <DrawTeamsModal
        open={showDrawTeams} onClose={() => setShowDrawTeams(false)}
        groupId={groupId} championshipId={championship.id}
        members={members} assignedUserIds={assignedUserIds}
        onCreated={() => { router.refresh(); onTeamAdded(); }}
      />

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Iniciar Campeonato?</DialogTitle>
            <DialogDescription>
              {championship.format === "single_elimination"
                ? `Bracket de eliminatórias com ${teams.length} times. ${Math.ceil(Math.log2(teams.length))} rodadas até a final.`
                : `Serão geradas ${teams.length % 2 === 0 ? teams.length - 1 : teams.length} rodadas com ${Math.floor(teams.length / 2)} partidas cada. Os eventos serão criados no calendário do grupo.`}
            </DialogDescription>
          </DialogHeader>

          {championship.startsAt && (
            <p className="text-sm text-muted-foreground">
              Início: {new Date(championship.startsAt).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric",
              })}.
            </p>
          )}

          <label className="flex items-center gap-3 cursor-pointer py-2 px-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={singleDay}
              onChange={e => setSingleDay(e.target.checked)}
              className="rounded"
            />
            <div>
              <p className="text-sm font-medium">Torneio de um dia</p>
              <p className="text-xs text-muted-foreground">
                Todas as rodadas no mesmo dia, espaçadas por {championship.matchDurationMinutes + 15} min
              </p>
            </div>
          </label>

          {genError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{genError}
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
  groupId, championship, teams, members,
  initialRounds, initialStandings, initialTopScorers, isAdmin, currentUserId,
}: Props) {
  const router = useRouter();
  const [rounds, setRounds]       = useState<RoundData[]>(initialRounds);
  const [standings, setStandings] = useState<StandingData[]>(initialStandings);
  const [topScorers, setTopScorers] = useState<TopScorer[]>(initialTopScorers);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [cancelingChamp, setCancelingChamp] = useState(false);
  const [cancelChampLoading, setCancelChampLoading] = useState(false);
  const defaultTab = championship.format === "single_elimination" ? "bracket" : "standings";
  const [tab, setTab] = useState(defaultTab);

  // IDs dos times do usuário atual (para "Meus Jogos")
  const myTeamIds = useMemo(
    () => new Set(teams.filter(t => t.players.some(p => p.userId === currentUserId)).map(t => t.id)),
    [teams, currentUserId]
  );

  // Usuário pode gerenciar partidas: admin OU capitão de algum time
  const canManageMatches = useMemo(
    () => isAdmin || teams.some(t => t.players.some(p => p.userId === currentUserId && p.isCaptain)),
    [isAdmin, teams, currentUserId]
  );

  // Polling adaptativo: 5s quando há partida ao vivo, 15s caso contrário
  const hasLiveMatch = rounds.some(r => r.matches.some(m => m.status === "playing"));

  const fetchStandings = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/championships/${championship.id}/standings`);
      if (!res.ok) return;
      const data = await res.json();
      setStandings(data.standings ?? []);
      setTopScorers(data.topScorers ?? []);
    } catch { /* ignore */ }
  }, [groupId, championship.id]);

  // Busca artilheiros na montagem
  useEffect(() => {
    if (championship.status !== "draft") {
      void fetchStandings();
    }
  }, [championship.status, fetchStandings]);

  useEffect(() => {
    if (championship.status !== "active") return;
    const interval = hasLiveMatch ? 5000 : 15000;
    const id = setInterval(fetchStandings, interval);
    return () => clearInterval(id);
  }, [championship.status, hasLiveMatch, fetchStandings]);

  async function refreshRounds() {
    try {
      const res = await fetch(`/api/groups/${groupId}/championships/${championship.id}/rounds`);
      if (!res.ok) return;
      const data = await res.json();
      const newRounds: RoundData[] = data.rounds ?? [];
      setRounds(newRounds);

      // Só força SSR reload quando não há mais partidas pendentes (campeonato pode ter encerrado)
      const stillPending = newRounds.some(r =>
        r.matches.some(m =>
          (m.status === "scheduled" || m.status === "playing") &&
          m.homeTeamId && m.awayTeamId
        )
      );
      if (!stillPending) {
        router.refresh();
      }
    } catch { /* ignore */ }
    void fetchStandings();
  }

  async function handleCancelChampionship() {
    setCancelChampLoading(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/championships/${championship.id}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) }
      );
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Erro ao cancelar campeonato"); return; }
      router.refresh();
    } catch {
      alert("Erro de conexão");
    } finally {
      setCancelChampLoading(false);
      setCancelingChamp(false);
    }
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
            {hasLiveMatch && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                <Radio className="h-3 w-3 animate-pulse" />Partida ao vivo
              </span>
            )}
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
        {isAdmin && (championship.status === "draft" || championship.status === "active") && (
          <Button
            size="sm" variant="outline"
            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive shrink-0"
            onClick={() => setCancelingChamp(true)}
          >
            <X className="h-3.5 w-3.5 mr-1" />Cancelar
          </Button>
        )}
      </div>

      {/* Dialog cancelar campeonato */}
      <Dialog open={cancelingChamp} onOpenChange={setCancelingChamp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar campeonato?</DialogTitle>
            <DialogDescription>
              Esta ação cancelará o campeonato <strong>{championship.name}</strong> e todas as partidas pendentes. Partidas já finalizadas são mantidas. Não é possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelingChamp(false)}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelChampionship} disabled={cancelChampLoading}>
              {cancelChampLoading ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banner de campeão */}
      {championship.status === "finished" && standings[0] && (() => {
        const champion = standings[0];
        return (
          <div
            className="rounded-xl p-5 mb-6 flex flex-col items-center text-center gap-2 border"
            style={{
              background: `linear-gradient(135deg, ${champion.teamColor}22 0%, ${champion.teamColor}11 100%)`,
              borderColor: `${champion.teamColor}55`,
            }}
          >
            <Trophy className="h-10 w-10" style={{ color: champion.teamColor }} />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Campeão</p>
            <p className="text-2xl font-extrabold" style={{ color: champion.teamColor }}>
              {champion.teamName}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span><strong className="text-foreground">{champion.points}</strong> pts</span>
              <span>·</span>
              <span><strong className="text-foreground">{champion.wins}</strong>V <strong className="text-foreground">{champion.draws}</strong>E <strong className="text-foreground">{champion.losses}</strong>D</span>
              <span>·</span>
              <span><strong className="text-foreground">{champion.goalsFor}</strong> gols</span>
            </div>
            {topScorers[0] && (
              <p className="text-xs text-muted-foreground mt-1">
                Artilheiro: <strong className="text-foreground">{topScorers[0].user_name}</strong> ({topScorers[0].goals} gols)
              </p>
            )}
          </div>
        );
      })()}

      {/* Draft mode */}
      {championship.status === "draft" && (
        <DraftPanel
          championship={championship} groupId={groupId}
          teams={teams} members={members} isAdmin={isAdmin}
          onTeamAdded={() => {}} onGenerated={() => {}}
        />
      )}

      {/* Single elimination */}
      {(championship.status === "active" || championship.status === "finished") &&
        championship.format === "single_elimination" && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="bracket">Chaveamento</TabsTrigger>
            {myTeamIds.size > 0 && <TabsTrigger value="my-matches">Meus Jogos</TabsTrigger>}
            <TabsTrigger value="teams">Times</TabsTrigger>
          </TabsList>

          <TabsContent value="bracket">
            <BracketView rounds={rounds} canManage={canManageMatches} onMatchClick={m => setSelectedMatch(m)} />
          </TabsContent>

          {myTeamIds.size > 0 && (
            <TabsContent value="my-matches">
              <MyMatchesTab
                rounds={rounds} myTeamIds={myTeamIds}
                canManage={canManageMatches} onMatchClick={m => setSelectedMatch(m)}
              />
            </TabsContent>
          )}

          <TabsContent value="teams">
            <TeamsTab teams={teams} />
          </TabsContent>
        </Tabs>
      )}

      {/* Round-robin */}
      {(championship.status === "active" || championship.status === "finished") &&
        championship.format !== "single_elimination" && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="standings">Classificação</TabsTrigger>
            <TabsTrigger value="rounds">Rodadas</TabsTrigger>
            {myTeamIds.size > 0 && <TabsTrigger value="my-matches">Meus Jogos</TabsTrigger>}
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
                <TopScorersSection scorers={topScorers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rounds">
            <RoundsTab rounds={rounds} canManage={canManageMatches} onMatchClick={m => setSelectedMatch(m)} />
          </TabsContent>

          {myTeamIds.size > 0 && (
            <TabsContent value="my-matches">
              <MyMatchesTab
                rounds={rounds} myTeamIds={myTeamIds}
                canManage={canManageMatches} onMatchClick={m => setSelectedMatch(m)}
              />
            </TabsContent>
          )}

          <TabsContent value="teams">
            <TeamsTab teams={teams} />
          </TabsContent>
        </Tabs>
      )}

      <MatchResultModal
        match={selectedMatch}
        groupId={groupId}
        championshipId={championship.id}
        isAdmin={isAdmin}
        teams={teams}
        onClose={() => setSelectedMatch(null)}
        onSaved={refreshRounds}
      />
    </div>
  );
}
