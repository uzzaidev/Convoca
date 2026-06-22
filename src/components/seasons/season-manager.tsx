"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Trophy, Loader2, Calendar, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Season = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: "active" | "finished" | "upcoming";
  created_at: string;
  created_by_name: string | null;
  events_count: number;
};

type SeasonManagerProps = {
  groupId: string;
};

export function SeasonManager({ groupId }: SeasonManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<string | null>(null);
  const [seasonToFinish, setSeasonToFinish] = useState<string | null>(null);
  const [newSeason, setNewSeason] = useState({
    name: "",
    startsAt: "",
    endsAt: "",
  });

  const fetchSeasons = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/seasons`);
      if (res.ok) {
        const data = await res.json();
        setSeasons(data.seasons || []);
      }
    } catch {
      console.error("Error fetching seasons");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const handleCreate = async () => {
    if (!newSeason.name || !newSeason.startsAt || !newSeason.endsAt) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/seasons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSeason),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Temporada criada!" });
      setIsCreateOpen(false);
      setNewSeason({ name: "", startsAt: "", endsAt: "" });
      fetchSeasons();
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao criar temporada",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!seasonToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/seasons/${seasonToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast({ title: "Temporada excluída" });
      setSeasonToDelete(null);
      fetchSeasons();
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao excluir temporada",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!seasonToFinish) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/seasons/${seasonToFinish}/finish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: "Temporada finalizada!",
        description: `Ranking salvo com ${data.playersCount} jogadores`,
      });
      setSeasonToFinish(null);
      fetchSeasons();
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao finalizar temporada",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (season: Season) => {
    switch (season.status) {
      case "active":
        return <Badge className="bg-green-500">Ativa</Badge>;
      case "finished":
        return <Badge variant="secondary">Finalizada</Badge>;
      case "upcoming":
        if (new Date(season.starts_at) <= new Date()) {
          return <Badge variant="outline">Aberta</Badge>;
        }
        return <Badge variant="outline">Futura</Badge>;
      default:
        return null;
    }
  };

  const canFinishSeason = (season: Season) => (
    season.status !== "finished" && new Date(season.starts_at) <= new Date()
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Temporadas</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Temporada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Temporada</DialogTitle>
              <DialogDescription>
                Defina o nome e o período da temporada. Os rankings serão calculados apenas com jogos dentro do período.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="season-name">Nome</Label>
                <Input
                  id="season-name"
                  placeholder="Ex: Temporada 2025.1"
                  value={newSeason.name}
                  onChange={(e) => setNewSeason((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="season-start">Data Início</Label>
                  <Input
                    id="season-start"
                    type="date"
                    value={newSeason.startsAt}
                    onChange={(e) => setNewSeason((prev) => ({ ...prev, startsAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="season-end">Data Fim</Label>
                  <Input
                    id="season-end"
                    type="date"
                    value={newSeason.endsAt}
                    onChange={(e) => setNewSeason((prev) => ({ ...prev, endsAt: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {seasons.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma temporada criada</p>
            <p className="text-sm mt-1">Crie uma temporada para separar os rankings por período</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => (
            <Card key={season.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{season.name}</span>
                      {getStatusBadge(season)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(season.starts_at), "dd/MM/yyyy", { locale: ptBR })}
                      {" — "}
                      {format(new Date(season.ends_at), "dd/MM/yyyy", { locale: ptBR })}
                      {" · "}
                      {season.events_count} {season.events_count === 1 ? "jogo" : "jogos"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canFinishSeason(season) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSeasonToFinish(season.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Finalizar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSeasonToDelete(season.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!seasonToDelete} onOpenChange={(open) => !open && setSeasonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir temporada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os rankings salvos desta temporada serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finish confirmation */}
      <AlertDialog open={!!seasonToFinish} onOpenChange={(open) => !open && setSeasonToFinish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar temporada?</AlertDialogTitle>
            <AlertDialogDescription>
              O ranking atual será salvo como snapshot permanente. Após finalizar, os dados não poderão ser alterados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinish} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
