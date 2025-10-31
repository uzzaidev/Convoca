"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Loader2, Goal, Shield, Zap, TrendingUp } from "lucide-react";

type Position = "gk" | "defender" | "midfielder" | "forward";

type GroupMember = {
  userId: string;
  userName: string;
  userImage: string | null;
  isConfirmed: boolean;
};

type AdminPlayerManagerProps = {
  eventId: string;
  groupMembers: GroupMember[];
};

const POSITIONS = [
  { value: "gk", label: "Goleiro", Icon: Goal },
  { value: "defender", label: "Zagueiro", Icon: Shield },
  { value: "midfielder", label: "Meio-campo", Icon: Zap },
  { value: "forward", label: "Atacante", Icon: TrendingUp },
] as const;

export function AdminPlayerManager({ eventId, groupMembers }: AdminPlayerManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [preferredPosition, setPreferredPosition] = useState<Position | null>(null);
  const [secondaryPosition, setSecondaryPosition] = useState<Position | null>(null);

  // Filter unconfirmed members for the dropdown
  const unconfirmedMembers = groupMembers.filter(m => !m.isConfirmed);

  const handleConfirmPlayer = async () => {
    if (!selectedUserId || !preferredPosition) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um jogador e uma posição preferencial",
        variant: "destructive",
      });
      return;
    }

    if (preferredPosition === secondaryPosition && secondaryPosition !== null) {
      toast({
        title: "Posições duplicadas",
        description: "Selecione posições diferentes para 1ª e 2ª opção",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/admin-rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          status: "yes",
          preferredPosition,
          secondaryPosition,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao confirmar jogador");
      }

      toast({
        title: "Jogador confirmado!",
        description: "A confirmação foi registrada com sucesso",
      });

      setOpen(false);
      setSelectedUserId("");
      setPreferredPosition(null);
      setSecondaryPosition(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar solicitação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnconfirmPlayer = async (userId: string, userName: string) => {
    if (!confirm(`Deseja realmente desconfirmar ${userName}?`)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/admin-rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status: "no",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao desconfirmar jogador");
      }

      toast({
        title: "Jogador desconfirmado",
        description: "A confirmação foi removida com sucesso",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar solicitação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Button to confirm new player */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            Confirmar Jogador
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Jogador</DialogTitle>
            <DialogDescription>
              Selecione um jogador do grupo e suas posições para confirmá-lo neste evento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Player selection */}
            <div className="space-y-2">
              <Label htmlFor="player">Jogador *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="player">
                  <SelectValue placeholder="Selecione um jogador" />
                </SelectTrigger>
                <SelectContent>
                  {unconfirmedMembers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Todos os membros já estão confirmados
                    </div>
                  ) : (
                    unconfirmedMembers.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.userName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred position */}
            <div className="space-y-2">
              <Label>1ª Posição Preferencial *</Label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((pos) => {
                  const IconComponent = pos.Icon;
                  return (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => setPreferredPosition(pos.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        preferredPosition === pos.value
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <div className="flex justify-center mb-1">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="text-xs font-medium">{pos.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary position */}
            <div className="space-y-2">
              <Label>2ª Posição (Opcional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((pos) => {
                  const IconComponent = pos.Icon;
                  return (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() =>
                        setSecondaryPosition(secondaryPosition === pos.value ? null : pos.value)
                      }
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        secondaryPosition === pos.value
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <div className="flex justify-center mb-1">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="text-xs font-medium">{pos.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmPlayer} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List of confirmed players with unconfirm button */}
      {groupMembers.some(m => m.isConfirmed) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Gerenciar Confirmados</Label>
          <div className="grid gap-2">
            {groupMembers
              .filter(m => m.isConfirmed)
              .map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <span className="font-medium">{member.userName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnconfirmPlayer(member.userId, member.userName)}
                    disabled={isSubmitting}
                  >
                    Desconfirmar
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
