"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Shuffle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type TeamDrawButtonProps = {
  eventId: string;
  confirmedCount: number;
  hasTeams: boolean;
};

export function TeamDrawButton({ eventId, confirmedCount, hasTeams }: TeamDrawButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDrawing, setIsDrawing] = useState(false);

  const handleDraw = async () => {
    setIsDrawing(true);

    try {
      const response = await fetch(`/api/events/${eventId}/draw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numTeams: 2 }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao sortear times");
      }

      toast({
        title: "Times sorteados!",
        description: "Os times foram criados com sucesso",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao sortear times",
        variant: "destructive",
      });
    } finally {
      setIsDrawing(false);
    }
  };

  if (confirmedCount < 4) {
    return (
      <Button disabled variant="outline" size="sm">
        <Shuffle className="h-4 w-4 mr-2" />
        Sortear Times
        <span className="ml-2 text-xs text-muted-foreground">(mín. 4 jogadores)</span>
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isDrawing}>
          {isDrawing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Shuffle className="h-4 w-4 mr-2" />
          )}
          {hasTeams ? "Sortear Novamente" : "Sortear Times"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasTeams ? "Sortear times novamente?" : "Sortear times"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasTeams
              ? "Isso irá apagar os times atuais e criar novos times balanceados baseado nas posições e pontuações dos jogadores."
              : "Os times serão criados de forma balanceada considerando as posições preferenciais e pontuações dos jogadores confirmados."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDraw}>
            Confirmar Sorteio
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
