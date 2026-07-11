"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Plus, ChevronRight, Users, Swords, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ChampionshipSummary = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  format: string;
  team_formation: string;
  starts_at: string | null;
  ends_at: string | null;
  match_duration_minutes: number;
  match_win_goal_diff: number;
  team_count: number;
  match_count: number;
  finished_matches: number;
};

type Props = {
  groupId: string;
  championships: ChampionshipSummary[];
  isAdmin: boolean;
};

type CreateForm = {
  name: string;
  description: string;
  format: string;
  teamFormation: string;
  startsAt: string;
  matchDurationMinutes: number;
  matchWinGoalDiff: number;
  pointsWin: number;
  pointsDraw: number;
};

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

const FORMAT_LABEL: Record<string, string> = {
  round_robin: "Todos contra Todos",
  single_elimination: "Eliminatória Simples",
  double_elimination: "Eliminatória Dupla",
  mixed: "Misto",
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums">{done}/{total} partidas</span>
    </div>
  );
}

function ChampionshipCard({ c, groupId }: { c: ChampionshipSummary; groupId: string }) {
  return (
    <Link href={`/groups/${groupId}/championships/${c.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group border-l-4"
        style={{ borderLeftColor: c.status === "active" ? "hsl(var(--primary))" : "hsl(var(--border))" }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-base truncate">{c.name}</h3>
                <Badge variant={STATUS_VARIANT[c.status] ?? "outline"} className="text-[11px] shrink-0">
                  {STATUS_LABEL[c.status] ?? c.status}
                </Badge>
              </div>
              {c.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{c.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Swords className="h-3 w-3" />
                  {FORMAT_LABEL[c.format] ?? c.format}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {c.team_count} {c.team_count === 1 ? "time" : "times"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {c.match_duration_minutes} min
                </span>
                <span>{c.match_win_goal_diff} gols</span>
                {c.starts_at && (
                  <span>{formatDate(c.starts_at)}</span>
                )}
              </div>
              {c.status !== "draft" && c.match_count > 0 && (
                <ProgressBar done={c.finished_matches} total={c.match_count} />
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 group-hover:text-foreground transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const defaultForm: CreateForm = {
  name: "",
  description: "",
  format: "round_robin",
  teamFormation: "manual",
  startsAt: "",
  matchDurationMinutes: 10,
  matchWinGoalDiff: 2,
  pointsWin: 3,
  pointsDraw: 1,
};

export function ChampionshipsClient({ groupId, championships, isAdmin }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof CreateForm>(k: K, v: CreateForm[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body: Record<string, unknown> = {
      groupId,
      name: form.name.trim(),
      format: form.format,
      teamFormation: form.teamFormation,
      matchDurationMinutes: form.matchDurationMinutes,
      matchWinGoalDiff: form.matchWinGoalDiff,
      pointsWin: form.pointsWin,
      pointsDraw: form.pointsDraw,
      pointsLoss: 0,
    };
    if (form.description.trim()) body.description = form.description.trim();
    if (form.startsAt) body.startsAt = new Date(form.startsAt).toISOString();

    try {
      const res = await fetch(`/api/groups/${groupId}/championships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar campeonato"); return; }
      setShowCreate(false);
      setForm(defaultForm);
      router.push(`/groups/${groupId}/championships/${data.championship.id}`);
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Campeonatos</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Organize campeonatos e acompanhe a classificação em tempo real
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Criar
          </Button>
        )}
      </div>

      {/* Empty state */}
      {championships.length === 0 && (
        <div className="text-center py-16 rounded-xl border border-dashed">
          <Trophy className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-semibold text-lg">Nenhum campeonato ainda</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {isAdmin
              ? "Crie o primeiro campeonato do grupo!"
              : "Aguarde o admin criar um campeonato."}
          </p>
          {isAdmin && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Campeonato
            </Button>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {championships.map(c => (
          <ChampionshipCard key={c.id} c={c} groupId={groupId} />
        ))}
      </div>

      {/* Create modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Campeonato</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Nome *</Label>
              <Input
                id="c-name"
                placeholder="Ex: Copa da Pelada Semanal"
                value={form.name}
                onChange={e => update("name", e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Descrição (opcional)</Label>
              <Textarea
                id="c-desc"
                placeholder="Detalhes do campeonato..."
                value={form.description}
                onChange={e => update("description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Formato</Label>
                <Select value={form.format} onValueChange={v => update("format", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_robin">Todos contra Todos</SelectItem>
                    <SelectItem value="single_elimination">Eliminatória Simples</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Formação de Times</Label>
                <Select value={form.teamFormation} onValueChange={v => update("teamFormation", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (admin define)</SelectItem>
                    <SelectItem value="draw">Sorteio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-starts">Data de Início (opcional)</Label>
              <Input
                id="c-starts"
                type="datetime-local"
                value={form.startsAt}
                onChange={e => update("startsAt", e.target.value)}
              />
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Regras da Partida
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-dur">Duração (minutos)</Label>
                  <Input
                    id="c-dur"
                    type="number"
                    min={1}
                    max={120}
                    value={form.matchDurationMinutes}
                    onChange={e => update("matchDurationMinutes", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-gdiff">Gols de diferença</Label>
                  <Input
                    id="c-gdiff"
                    type="number"
                    min={1}
                    max={20}
                    value={form.matchWinGoalDiff}
                    onChange={e => update("matchWinGoalDiff", Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Partida encerra quando o tempo acabar <em>ou</em> um time abrir {form.matchWinGoalDiff} gol(s) de vantagem.
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pontuação
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-pw">Pontos por vitória</Label>
                  <Input
                    id="c-pw"
                    type="number"
                    min={0}
                    max={10}
                    value={form.pointsWin}
                    onChange={e => update("pointsWin", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-pd">Pontos por empate</Label>
                  <Input
                    id="c-pd"
                    type="number"
                    min={0}
                    max={10}
                    value={form.pointsDraw}
                    onChange={e => update("pointsDraw", Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !form.name.trim()}>
                {loading ? "Criando..." : "Criar Campeonato"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
