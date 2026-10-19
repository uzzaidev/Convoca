"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
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

type DeleteEventButtonProps = {
  eventId: string;
  groupId: string;
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function DeleteEventButton({
  eventId,
  groupId,
  variant = "destructive",
  size = "sm",
  className,
}: DeleteEventButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/events/${eventId}?permanent=true`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir partida");
      }

      toast({
        title: "Partida excluída!",
        description:
          data.message || "A partida e seus dados foram removidos permanentemente.",
      });

      setOpen(false);
      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao excluir partida",
        description:
          error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        disabled={isDeleting}
        className={className}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 mr-2" />
        )}
        Excluir Partida
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta partida?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta partida? Todas as presenças,
              times sorteados, gols, estatísticas e avaliações desta partida
              serão removidos permanentemente e deixarão de contar no ranking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
