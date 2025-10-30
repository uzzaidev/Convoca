"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TeamMember = {
  userId: string;
  userName: string;
  userImage: string | null;
  position: string;
  starter: boolean;
};

type TeamMemberWithTeamId = TeamMember & { teamId?: string };

type Team = {
  id: string;
  name: string;
  seed: number;
  is_winner: boolean | null;
  members: TeamMember[] | null;
};

type TeamEditorProps = {
  eventId: string;
  teams: Team[];
};

export function TeamEditor({ eventId, teams: initialTeams }: TeamEditorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    userId: string;
    userName: string;
    teamId: string;
  } | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Update teams when the prop changes (after re-draw)
  React.useEffect(() => {
    setTeams(initialTeams);
    // Reset selection when teams change
    setSelectedPlayer(null);
  }, [initialTeams]);

  const handlePlayerClick = async (
    userId: string,
    userName: string,
    teamId: string
  ) => {
    if (!selectedPlayer) {
      // First player selected
      setSelectedPlayer({ userId, userName, teamId });
    } else if (selectedPlayer.userId === userId) {
      // Same player clicked again, deselect
      setSelectedPlayer(null);
    } else {
      // Second player selected, perform swap
      setIsSwapping(true);

      try {
        const response = await fetch(`/api/events/${eventId}/teams/swap`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            player1: {
              userId: selectedPlayer.userId,
              currentTeamId: selectedPlayer.teamId,
            },
            player2: {
              userId: userId,
              currentTeamId: teamId,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao trocar jogadores");
        }

        // Update local state to reflect the swap
        const newTeams = teams.map((team) => {
          if (!team.members) return team;

          const members: TeamMemberWithTeamId[] = team.members.map((member) => {
            // Swap player 1 to team 2
            if (
              member.userId === selectedPlayer.userId &&
              team.id === selectedPlayer.teamId
            ) {
              return { ...member, teamId: teamId };
            }
            // Swap player 2 to team 1
            if (member.userId === userId && team.id === teamId) {
              return { ...member, teamId: selectedPlayer.teamId };
            }
            return member;
          });

          // Filter out players that have been moved
          const updatedMembers = members.filter((m) => {
            if ("teamId" in m && m.teamId) {
              return m.teamId === team.id;
            }
            return true;
          });

          // Add players that have been moved here
          const player1MovedHere =
            selectedPlayer.teamId !== team.id &&
            teamId === team.id &&
            members.find((m) => m.userId === selectedPlayer.userId);

          const player2MovedHere =
            teamId !== team.id &&
            selectedPlayer.teamId === team.id &&
            members.find((m) => m.userId === userId);

          // Clean up the temporary teamId property and return clean TeamMember objects
          const finalMembers: TeamMember[] = [
            ...updatedMembers,
            ...(player1MovedHere ? [player1MovedHere] : []),
            ...(player2MovedHere ? [player2MovedHere] : []),
          ].map((m) => {
            const { userId, userName, userImage, position, starter } = m;
            return { userId, userName, userImage, position, starter };
          });

          return {
            ...team,
            members: finalMembers,
          };
        });

        setTeams(newTeams);
        setSelectedPlayer(null);

        toast({
          title: "Jogadores trocados!",
          description: `${selectedPlayer.userName} ↔ ${userName}`,
        });
      } catch (error) {
        toast({
          title: "Erro",
          description:
            error instanceof Error ? error.message : "Erro ao trocar jogadores",
          variant: "destructive",
        });
      } finally {
        setIsSwapping(false);
      }
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case "gk":
        return "Goleiro";
      case "defender":
        return "Zagueiro";
      case "midfielder":
        return "Meio-campo";
      case "forward":
        return "Atacante";
      default:
        return "Linha";
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "gk":
        return "bg-yellow-500";
      case "defender":
        return "bg-blue-500";
      case "midfielder":
        return "bg-green-500";
      case "forward":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <ArrowLeftRight className="h-4 w-4 mr-2" />
          Editar Times
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Times</DialogTitle>
          <DialogDescription>
            Clique em dois jogadores de times diferentes para trocá-los de posição.
            {selectedPlayer && (
              <span className="block mt-2 text-primary font-medium">
                Selecionado: {selectedPlayer.userName} - Clique em outro jogador
                para trocar
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isSwapping && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Trocando jogadores...</span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id} className="border-2">
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  {team.name}
                  <Badge variant="secondary">{team.members?.length || 0}</Badge>
                </h3>
                <div className="space-y-2 min-h-[100px]">
                  {team.members?.map((member) => (
                    <button
                      key={member.userId}
                      onClick={() =>
                        handlePlayerClick(member.userId, member.userName, team.id)
                      }
                      disabled={isSwapping}
                      className={cn(
                        "w-full flex items-center gap-2 p-3 rounded-lg transition-all text-left",
                        "hover:bg-muted/80 active:scale-98",
                        selectedPlayer?.userId === member.userId
                          ? "bg-primary/20 border-2 border-primary"
                          : "bg-muted/50 border-2 border-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          getPositionColor(member.position)
                        )}
                      />
                      <span className="flex-1 font-medium">
                        {member.userName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getPositionLabel(member.position)}
                      </Badge>
                    </button>
                  ))}
                  {(!team.members || team.members.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum jogador
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedPlayer(null);
              setIsOpen(false);
            }}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
