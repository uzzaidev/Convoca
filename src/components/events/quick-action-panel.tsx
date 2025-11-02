"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircleDot, Target, Square, SquareX, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Team = {
  id: string;
  name: string;
  seed: number;
  members: Array<{
    userId: string;
    userName: string;
  }> | null;
};

type QuickActionPanelProps = {
  eventId: string;
  teams: Team[];
  onActionAdded: () => void;
};

type ActionType = "goal" | "assist" | "yellow_card" | "red_card";

export function QuickActionPanel({
  eventId,
  teams,
  onActionAdded,
}: QuickActionPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const players = selectedTeam?.members || [];

  const handleAction = async (actionType: ActionType) => {
    if (!selectedTeamId || !selectedPlayerId) {
      toast({
        title: "Selecione time e jogador",
        description: "Escolha um time e um jogador primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actionType: actionType,
          subjectUserId: selectedPlayerId,
          teamId: selectedTeamId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao registrar ação");
      }

      const actionNames: Record<ActionType, string> = {
        goal: "Gol",
        assist: "Assistência",
        yellow_card: "Cartão amarelo",
        red_card: "Cartão vermelho",
      };

      toast({
        title: `${actionNames[actionType]} registrado!`,
        description: `${players.find((p) => p.userId === selectedPlayerId)?.userName}`,
      });

      // Reset selection and refresh
      setSelectedPlayerId("");
      onActionAdded();
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao registrar ação",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Ação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Time</label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o time" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seleção de Jogador */}
        {selectedTeamId && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Jogador</label>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o jogador" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.userId} value={player.userId}>
                    {player.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button
            onClick={() => handleAction("goal")}
            disabled={!selectedPlayerId || isSubmitting}
            size="lg"
            className="h-20 flex-col gap-2"
            variant="default"
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <CircleDot className="h-6 w-6" />
                <span>Gol</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => handleAction("assist")}
            disabled={!selectedPlayerId || isSubmitting}
            size="lg"
            className="h-20 flex-col gap-2"
            variant="secondary"
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Target className="h-6 w-6" />
                <span>Assistência</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => handleAction("yellow_card")}
            disabled={!selectedPlayerId || isSubmitting}
            size="lg"
            className="h-20 flex-col gap-2"
            variant="outline"
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Square className="h-6 w-6 text-yellow-500" />
                <span>Cartão Amarelo</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => handleAction("red_card")}
            disabled={!selectedPlayerId || isSubmitting}
            size="lg"
            className="h-20 flex-col gap-2"
            variant="outline"
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <SquareX className="h-6 w-6 text-red-500" />
                <span>Cartão Vermelho</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
