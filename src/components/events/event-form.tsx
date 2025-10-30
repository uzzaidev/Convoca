"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

type EventFormProps = {
  groupId: string;
  mode: "create" | "edit";
  eventId?: string;
  initialData?: {
    startsAt: string;
    maxPlayers: number;
    maxGoalkeepers: number;
    waitlistEnabled: boolean;
  };
};

export function EventForm({ groupId, mode, eventId, initialData }: EventFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Format datetime for input (needs to be in local time for datetime-local input)
  const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) {
      // Default to tomorrow at 18:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      return tomorrow.toISOString().slice(0, 16);
    }
    return new Date(isoString).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    startsAt: formatDateTimeLocal(initialData?.startsAt),
    maxPlayers: initialData?.maxPlayers || 10,
    maxGoalkeepers: initialData?.maxGoalkeepers || 2,
    waitlistEnabled: initialData?.waitlistEnabled ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = mode === "create" ? "/api/events" : `/api/events/${eventId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const body =
        mode === "create"
          ? {
              groupId,
              startsAt: new Date(formData.startsAt).toISOString(),
              maxPlayers: formData.maxPlayers,
              maxGoalkeepers: formData.maxGoalkeepers,
              waitlistEnabled: formData.waitlistEnabled,
            }
          : {
              startsAt: new Date(formData.startsAt).toISOString(),
              maxPlayers: formData.maxPlayers,
              maxGoalkeepers: formData.maxGoalkeepers,
              waitlistEnabled: formData.waitlistEnabled,
            };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ao ${mode === "create" ? "criar" : "atualizar"} evento`);
      }

      toast({
        title: mode === "create" ? "Evento criado!" : "Evento atualizado!",
        description: `O evento foi ${mode === "create" ? "criado" : "atualizado"} com sucesso.`,
      });

      // Redirect to the event or group page
      if (mode === "create") {
        router.push(`/groups/${groupId}/events/${data.event.id}`);
      } else {
        router.push(`/groups/${groupId}/events/${eventId}`);
      }
    } catch (error) {
      toast({
        title: `Erro ao ${mode === "create" ? "criar" : "atualizar"} evento`,
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Novo Evento" : "Editar Evento"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Configure os detalhes do novo evento"
              : "Atualize os detalhes do evento"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startsAt">Data e Hora *</Label>
            <Input
              id="startsAt"
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) =>
                setFormData({ ...formData, startsAt: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Máximo de Jogadores *</Label>
              <Input
                id="maxPlayers"
                type="number"
                min="4"
                max="30"
                value={formData.maxPlayers}
                onChange={(e) =>
                  setFormData({ ...formData, maxPlayers: parseInt(e.target.value, 10) })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxGoalkeepers">Máximo de Goleiros *</Label>
              <Input
                id="maxGoalkeepers"
                type="number"
                min="0"
                max="4"
                value={formData.maxGoalkeepers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxGoalkeepers: parseInt(e.target.value, 10),
                  })
                }
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="waitlistEnabled"
              type="checkbox"
              checked={formData.waitlistEnabled}
              onChange={(e) =>
                setFormData({ ...formData, waitlistEnabled: e.target.checked })
              }
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="waitlistEnabled" className="cursor-pointer">
              Habilitar lista de espera
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Criar Evento" : "Salvar Alterações"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
