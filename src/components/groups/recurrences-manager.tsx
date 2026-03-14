"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Pause, Play, Trash2 } from "lucide-react";

type Recurrence = {
  id: string;
  frequency: string;
  day_of_week: number;
  start_time: string;
  venue_name: string | null;
  max_players: number;
  max_goalkeepers: number;
  list_opens_hours_before: number;
  is_active: boolean;
  created_at: string;
};

const dayNames = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const frequencyLabels: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

type RecurrencesManagerProps = {
  groupId: string;
};

export function RecurrencesManager({ groupId }: RecurrencesManagerProps) {
  const { toast } = useToast();
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRecurrences = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}/recurrences`);
      if (res.ok) {
        const data = await res.json();
        setRecurrences(data.recurrences || []);
      }
    } catch (error) {
      console.error("Erro ao buscar recorrências:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurrences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleToggleActive = async (recurrence: Recurrence) => {
    setUpdating(recurrence.id);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/recurrences/${recurrence.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !recurrence.is_active }),
        }
      );

      if (!res.ok) throw new Error("Erro ao atualizar");

      setRecurrences(
        recurrences.map((r) =>
          r.id === recurrence.id ? { ...r, is_active: !r.is_active } : r
        )
      );

      toast({
        title: recurrence.is_active ? "Recorrência pausada" : "Recorrência ativada",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar recorrência",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (recurrence: Recurrence) => {
    if (!confirm("Desativar esta pelada recorrente? Eventos já criados não serão afetados.")) return;

    setUpdating(recurrence.id);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/recurrences/${recurrence.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Erro ao excluir");

      setRecurrences(
        recurrences.map((r) =>
          r.id === recurrence.id ? { ...r, is_active: false } : r
        )
      );

      toast({ title: "Recorrência desativada" });
    } catch (error) {
      toast({
        title: "Erro ao excluir recorrência",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Carregando...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peladas Recorrentes</CardTitle>
        <CardDescription>
          Peladas que se repetem automaticamente. Para criar uma nova, use
          &quot;Novo Evento&quot; e marque &quot;Pelada recorrente&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recurrences.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma pelada recorrente configurada.
          </p>
        ) : (
          <div className="space-y-3">
            {recurrences.map((rec) => (
              <div
                key={rec.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  !rec.is_active ? "opacity-60" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {dayNames[rec.day_of_week]} às {rec.start_time}
                    </span>
                    <Badge variant={rec.is_active ? "default" : "secondary"}>
                      {rec.is_active ? "Ativa" : "Pausada"}
                    </Badge>
                    <Badge variant="outline">
                      {frequencyLabels[rec.frequency] || rec.frequency}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rec.max_players} jogadores • Lista abre {rec.list_opens_hours_before}h antes
                    {rec.venue_name && ` • ${rec.venue_name}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(rec)}
                    disabled={updating === rec.id}
                    title={rec.is_active ? "Pausar" : "Ativar"}
                  >
                    {updating === rec.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : rec.is_active ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  {rec.is_active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rec)}
                      disabled={updating === rec.id}
                      title="Desativar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
