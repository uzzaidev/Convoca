"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Users, Loader2, Plus, Shuffle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Player = {
  userId: string;
  userName: string;
  preferredPosition: string | null;
  secondaryPosition: string | null;
};

type TeamMember = {
  userId: string;
  userName: string;
  position: string;
};

type Team = {
  name: string;
  members: TeamMember[];
};

type ManualTeamManagerProps = {
  eventId: string;
  confirmedPlayers: Player[];
  hasTeams: boolean;
};

const POSITIONS = [
  { value: "gk", label: "Goleiro" },
  { value: "defender", label: "Zagueiro" },
  { value: "midfielder", label: "Meio-campo" },
  { value: "forward", label: "Atacante" },
  { value: "line", label: "Linha" },
];

const TEAM_NAMES = ["Time A", "Time B", "Time C", "Time D"];

export function ManualTeamManager({
  eventId,
  confirmedPlayers,
  hasTeams,
}: ManualTeamManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassigned, setUnassigned] = useState<Player[]>([]);

  // Initialize teams and unassigned players when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Initialize empty teams
      const initialTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
        name: TEAM_NAMES[i],
        members: [],
      }));
      setTeams(initialTeams);
      setUnassigned([...confirmedPlayers]);
    }
  }, [isOpen, numTeams, confirmedPlayers]);

  const handleAddPlayerToTeam = (teamIndex: number, player: Player) => {
    // Remove from unassigned
    setUnassigned(unassigned.filter((p) => p.userId !== player.userId));

    // Add to team with their preferred position
    const position = player.preferredPosition || "line";
    const newTeams = [...teams];
    newTeams[teamIndex].members.push({
      userId: player.userId,
      userName: player.userName,
      position,
    });
    setTeams(newTeams);
  };

  const handleRemovePlayerFromTeam = (teamIndex: number, userId: string) => {
    const newTeams = [...teams];
    const removedPlayer = newTeams[teamIndex].members.find(
      (m) => m.userId === userId
    );
    
    if (removedPlayer) {
      // Remove from team
      newTeams[teamIndex].members = newTeams[teamIndex].members.filter(
        (m) => m.userId !== userId
      );
      setTeams(newTeams);

      // Add back to unassigned
      const originalPlayer = confirmedPlayers.find(
        (p) => p.userId === userId
      );
      if (originalPlayer) {
        setUnassigned([...unassigned, originalPlayer]);
      }
    }
  };

  const handleChangePosition = (
    teamIndex: number,
    userId: string,
    newPosition: string
  ) => {
    const newTeams = [...teams];
    const member = newTeams[teamIndex].members.find(
      (m) => m.userId === userId
    );
    if (member) {
      member.position = newPosition;
      setTeams(newTeams);
    }
  };

  const handleCreateTeams = async () => {
    // Validate that all players are assigned
    if (unassigned.length > 0) {
      toast({
        title: "Erro",
        description: "Todos os jogadores devem ser alocados em um time",
        variant: "destructive",
      });
      return;
    }

    // Validate that each team has at least one player
    const emptyTeams = teams.filter((t) => t.members.length === 0);
    if (emptyTeams.length > 0) {
      toast({
        title: "Erro",
        description: "Todos os times devem ter pelo menos um jogador",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(`/api/events/${eventId}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teams }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar times");
      }

      toast({
        title: "Times criados!",
        description: "Os times foram criados com sucesso",
      });

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao criar times",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRandomDistribute = () => {
    // Shuffle players
    const shuffled = [...confirmedPlayers].sort(() => Math.random() - 0.5);
    
    // Distribute evenly
    const newTeams: Team[] = teams.map((team) => ({ ...team, members: [] as TeamMember[] }));
    shuffled.forEach((player, index) => {
      const teamIndex = index % numTeams;
      const position = player.preferredPosition || "line";
      newTeams[teamIndex].members.push({
        userId: player.userId,
        userName: player.userName,
        position,
      });
    });

    setTeams(newTeams);
    setUnassigned([]);

    toast({
      title: "Jogadores distribuídos",
      description: "Os jogadores foram distribuídos aleatoriamente",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full sm:w-auto">
          <Users className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">
            {hasTeams ? "Editar Times Manualmente" : "Criar Times Manualmente"}
          </span>
          <span className="sm:hidden">
            {hasTeams ? "Editar" : "Criar"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Times Manualmente</DialogTitle>
          <DialogDescription>
            Distribua os jogadores confirmados entre os times. Você pode arrastar
            e soltar ou clicar para adicionar/remover.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Number of teams selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Número de times:</label>
            <Select
              value={numTeams.toString()}
              onValueChange={(value) => setNumTeams(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 times</SelectItem>
                <SelectItem value="3">3 times</SelectItem>
                <SelectItem value="4">4 times</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomDistribute}
              disabled={confirmedPlayers.length === 0}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Distribuir Aleatoriamente
            </Button>
          </div>

          {/* Teams */}
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team, teamIndex) => (
              <Card key={teamIndex} className="border-2">
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    {team.name}
                    <Badge variant="secondary">{team.members.length}</Badge>
                  </h3>
                  <div className="space-y-2 min-h-[100px]">
                    {team.members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                      >
                        <span className="flex-1 text-sm truncate">
                          {member.userName}
                        </span>
                        <Select
                          value={member.position}
                          onValueChange={(value) =>
                            handleChangePosition(teamIndex, member.userId, value)
                          }
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POSITIONS.map((pos) => (
                              <SelectItem key={pos.value} value={pos.value}>
                                {pos.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            handleRemovePlayerFromTeam(teamIndex, member.userId)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {team.members.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum jogador
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Unassigned players */}
          {unassigned.length > 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Jogadores não alocados
                  <Badge variant="outline">{unassigned.length}</Badge>
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {unassigned.map((player) => (
                    <div
                      key={player.userId}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium">
                          {player.userName}
                        </span>
                        {player.preferredPosition && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({POSITIONS.find((p) => p.value === player.preferredPosition)
                              ?.label})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {teams.map((_, teamIndex) => (
                          <Button
                            key={teamIndex}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleAddPlayerToTeam(teamIndex, player)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateTeams} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Criar Times
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
