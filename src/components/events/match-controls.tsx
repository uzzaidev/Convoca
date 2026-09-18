"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Square, Loader2, RotateCcw } from "lucide-react";
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

type MatchControlsProps = {
  eventId: string;
  eventStatus: string;
};

export function MatchControls({ eventId, eventStatus }: MatchControlsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);

  const handleReopenMatch = async () => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "live" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao reabrir jogo");
      }

      toast({
        title: "Jogo reaberto!",
        description: "Agora você pode editar times, jogadores e ações. Finalize novamente quando terminar.",
      });

      setShowReopenDialog(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao reabrir jogo",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartMatch = async () => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "live" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao iniciar jogo");
      }

      toast({
        title: "Jogo iniciado!",
        description: "Boa sorte para os times!",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao iniciar jogo",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFinishMatch = async () => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "finished" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao finalizar jogo");
      }

      toast({
        title: "Jogo finalizado!",
        description: "Agora os jogadores podem avaliar uns aos outros",
      });

      setShowFinishDialog(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao finalizar jogo",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Controles do Jogo</CardTitle>
          <CardDescription>
            Gerencie o status da partida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            {eventStatus === "scheduled" && (
              <Button
                onClick={handleStartMatch}
                disabled={isUpdating}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isUpdating ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 mr-2" />
                )}
                Começar Jogo
              </Button>
            )}

            {eventStatus === "live" && (
              <Button
                onClick={() => setShowFinishDialog(true)}
                disabled={isUpdating}
                size="lg"
                variant="destructive"
                className="w-full sm:w-auto"
              >
                <Square className="h-5 w-5 mr-2" />
                Finalizar Jogo
              </Button>
            )}

            {eventStatus === "finished" && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Jogo finalizado
                </div>
                <Button
                  onClick={() => setShowReopenDialog(true)}
                  disabled={isUpdating}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reabrir Jogo para Edição
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar o jogo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar o jogo? Após finalizar, os jogadores
              poderão avaliar uns aos outros e as estatísticas serão computadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishMatch} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Reopen Dialog */}
      <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir o jogo para edição?</AlertDialogTitle>
            <AlertDialogDescription>
              O status do jogo retornará para &quot;Em Andamento&quot;. Isso permite que você altere times, troque jogadores, ajuste o placar ou lance ações. Quando terminar suas alterações, basta finalizar o jogo novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReopenMatch} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Reabrir Jogo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
