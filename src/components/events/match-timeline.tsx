"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircleDot, Target, Square, SquareX, Trash2, Loader2, Clock } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type MatchAction = {
  id: string;
  action_type: string;
  subject_user_id: string | null;
  subject_user_name?: string;
  team_id: string;
  team_name?: string;
  minute: number | null;
  created_at: string;
};

type Team = {
  id: string;
  name: string;
  members: Array<{
    userId: string;
    userName: string;
  }> | null;
};

type MatchTimelineProps = {
  actions: MatchAction[];
  teams: Team[];
  isAdmin: boolean;
  onActionDeleted: () => void;
  eventId: string;
};

export function MatchTimeline({
  actions,
  teams,
  isAdmin,
  onActionDeleted,
  eventId,
}: MatchTimelineProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Enrich actions with team and player names
  const enrichedActions = actions.map((action) => {
    const team = teams.find((t) => t.id === action.team_id);
    const player = team?.members?.find((m) => m.userId === action.subject_user_id);

    return {
      ...action,
      team_name: team?.name,
      subject_user_name: player?.userName,
    };
  });

  const handleDeleteAction = async () => {
    if (!actionToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/actions`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ actionId: actionToDelete }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao deletar ação");
      }

      toast({
        title: "Ação removida",
        description: "A ação foi removida com sucesso",
      });

      setActionToDelete(null);
      onActionDeleted();
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao remover ação",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "goal":
        return <CircleDot className="h-5 w-5 text-green-500" />;
      case "assist":
        return <Target className="h-5 w-5 text-blue-500" />;
      case "yellow_card":
        return <Square className="h-5 w-5 text-yellow-500" />;
      case "red_card":
        return <SquareX className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      goal: "Gol",
      assist: "Assistência",
      yellow_card: "Cartão Amarelo",
      red_card: "Cartão Vermelho",
      period_start: "Início",
      period_end: "Fim",
    };
    return labels[actionType] || actionType;
  };

  if (enrichedActions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline do Jogo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma ação registrada ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Timeline do Jogo ({enrichedActions.length} ações)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enrichedActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">{getActionIcon(action.action_type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {action.team_name || "Time"}
                    </Badge>
                    <span className="font-medium text-sm">
                      {getActionLabel(action.action_type)}
                    </span>
                    {action.subject_user_name && (
                      <span className="text-sm text-muted-foreground truncate">
                        {action.subject_user_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(action.created_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActionToDelete(action.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!actionToDelete}
        onOpenChange={() => setActionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta ação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAction}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
