"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Loader2 } from "lucide-react";

type Position = "gk" | "defender" | "midfielder" | "forward";

type EventRsvpFormProps = {
  eventId: string;
  currentAttendance: {
    preferred_position?: string;
    secondary_position?: string;
    status?: string;
  } | null;
  eventStatus: string;
};

const POSITIONS = [
  { value: "gk", label: "Goleiro", icon: "🧤" },
  { value: "defender", label: "Zagueiro", icon: "🛡️" },
  { value: "midfielder", label: "Meio-campo", icon: "⚡" },
  { value: "forward", label: "Atacante", icon: "⚽" },
] as const;

export function EventRsvpForm({ eventId, currentAttendance, eventStatus }: EventRsvpFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferredPosition, setPreferredPosition] = useState<Position | null>(
    (currentAttendance?.preferred_position as Position) || null
  );
  const [secondaryPosition, setSecondaryPosition] = useState<Position | null>(
    (currentAttendance?.secondary_position as Position) || null
  );

  const handleRsvp = async (status: "yes" | "no") => {
    if (status === "yes" && !preferredPosition) {
      toast({
        title: "Posição obrigatória",
        description: "Selecione pelo menos sua posição preferencial",
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
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          role: preferredPosition === "gk" ? "gk" : "line",
          preferredPosition: status === "yes" ? preferredPosition : null,
          secondaryPosition: status === "yes" ? secondaryPosition : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao confirmar presença");
      }

      toast({
        title: status === "yes" ? "Presença confirmada!" : "Presença cancelada",
        description:
          status === "yes"
            ? "Sua confirmação foi registrada com sucesso"
            : "Sua confirmação foi removida",
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

  const isEventFinished = eventStatus === "finished";

  return (
    <div className="space-y-6">
      {/* Seleção de posição preferencial */}
      <div className="space-y-3">
        <Label className="text-base">1ª Posição Preferencial *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {POSITIONS.map((pos) => (
            <button
              key={pos.value}
              type="button"
              disabled={isEventFinished || isSubmitting}
              onClick={() => setPreferredPosition(pos.value)}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                preferredPosition === pos.value
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-muted hover:border-primary/50"
              } ${isEventFinished ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="text-3xl mb-2">{pos.icon}</div>
              <div className="text-sm font-medium">{pos.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Seleção de posição secundária */}
      <div className="space-y-3">
        <Label className="text-base">2ª Posição (Opcional)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {POSITIONS.map((pos) => (
            <button
              key={pos.value}
              type="button"
              disabled={isEventFinished || isSubmitting}
              onClick={() =>
                setSecondaryPosition(secondaryPosition === pos.value ? null : pos.value)
              }
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                secondaryPosition === pos.value
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-muted hover:border-primary/50"
              } ${isEventFinished ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="text-3xl mb-2">{pos.icon}</div>
              <div className="text-sm font-medium">{pos.label}</div>
            </button>
          ))}
        </div>
        {secondaryPosition && (
          <p className="text-xs text-muted-foreground">
            Clique novamente para remover a 2ª posição
          </p>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={() => handleRsvp("yes")}
          disabled={isEventFinished || isSubmitting || !preferredPosition}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Confirmar Presença
        </Button>
        <Button
          onClick={() => handleRsvp("no")}
          disabled={isEventFinished || isSubmitting}
          variant="outline"
          className="flex-1 sm:flex-none"
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          Não Vou
        </Button>
      </div>

      {isEventFinished && (
        <p className="text-sm text-muted-foreground text-center">
          Este evento já foi finalizado
        </p>
      )}
    </div>
  );
}
