"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trophy, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MvpTiebreakerCard } from "./mvp-tiebreaker-card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Team = {
  id: string;
  name: string;
  members: Array<{
    userId: string;
    userName: string;
  }> | null;
};

type Vote = {
  player_id: string;
};

type VoteCount = {
  user_id: string;
  user_name: string;
  vote_count: number;
};

type RatingsTabProps = {
  eventId: string;
  teams: Team[];
  isAdmin: boolean;
  currentUserId: string;
};

export function RatingsTab({
  eventId,
  teams,
  isAdmin,
  currentUserId,
}: RatingsTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentVote, setCurrentVote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showTiebreaker, setShowTiebreaker] = useState(false);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);

  // Get all players from all teams
  const allPlayers = teams.flatMap((team) =>
    (team.members || []).map((member) => ({
      ...member,
      teamName: team.name,
      teamId: team.id,
    }))
  );

  useEffect(() => {
    fetchCurrentVote();

    // Poll for vote count updates every 15 seconds
    const interval = setInterval(fetchCurrentVote, 15000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchCurrentVote = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/ratings`);
      if (response.ok) {
        const data = await response.json();
        if (data.vote) {
          setCurrentVote(data.vote.player_id);
          if (!selectedPlayerId) {
            setSelectedPlayerId(data.vote.player_id);
          }
        }
        setVoteCounts(data.voteCounts || []);
        setTotalVoters(data.totalVoters || 0);
      }
    } catch (error) {
      console.error("Error fetching vote:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVote = async () => {
    if (!selectedPlayerId) {
      toast({
        title: "Nenhum jogador selecionado",
        description: "Selecione um jogador para votar como Craque da Partida",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${eventId}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ratedUserId: selectedPlayerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar voto");
      }

      toast({
        title: "Voto salvo!",
        description: "Seu voto para Craque da Partida foi registrado",
      });

      setCurrentVote(selectedPlayerId);
      fetchCurrentVote();
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao salvar voto",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalizeVoting = async () => {
    setIsFinalizing(true);

    try {
      const response = await fetch(`/api/events/${eventId}/ratings/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao finalizar votação");
      }

      const data = await response.json();

      if (data.hasTie) {
        toast({
          title: "Empate detectado!",
          description: `${data.tiebreaker.tiedPlayers.length} jogadores empatados. Inicie uma nova rodada de votação ou escolha o vencedor.`,
        });
        setShowTiebreaker(true);
      } else {
        toast({
          title: "MVP definido!",
          description: `${data.winner.userName} é o Craque da Partida com ${data.winner.voteCount} votos!`,
        });
      }

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao finalizar votação",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tiebreaker Card - shown when there's an active tiebreaker */}
      {showTiebreaker && (
        <MvpTiebreakerCard
          eventId={eventId}
          isAdmin={isAdmin}
          onTiebreakerResolved={() => {
            setShowTiebreaker(false);
            router.refresh();
          }}
        />
      )}

      {/* Admin Alert with Finalize Button */}
      {isAdmin && !showTiebreaker && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-blue-700">
              Como admin, você pode finalizar a votação para verificar se há empate
            </span>
            <Button
              onClick={handleFinalizeVoting}
              disabled={isFinalizing}
              size="sm"
              variant="default"
              className="ml-4"
            >
              {isFinalizing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Finalizar Votação
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Vote summary */}
      {totalVoters > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <Trophy className="h-4 w-4" />
              <span className="font-medium">
                {totalVoters} {totalVoters === 1 ? "voto computado" : "votos computados"}
              </span>
            </div>
            {voteCounts.length > 0 && voteCounts[0].vote_count > 0 && (
              <span className="text-sm font-semibold text-yellow-900">
                Líder: {voteCounts[0].user_name} ({voteCounts[0].vote_count})
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Craque da Partida
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Como admin, você pode votar em qualquer jogador"
              : "Vote em um jogador como Craque da Partida"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPlayerId || ""}
            onValueChange={setSelectedPlayerId}
          >
            <div className="space-y-6">
              {teams.map((team) => (
                <div key={team.id}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    {team.name}
                    <Badge variant="secondary" className="text-xs">
                      {team.members?.length || 0} jogadores
                    </Badge>
                  </h3>

                  <div className="space-y-2">
                    {team.members?.map((player) => {
                      const isSelf = player.userId === currentUserId;
                      const isSelected = selectedPlayerId === player.userId;
                      const isCurrentVote = currentVote === player.userId;
                      const playerVotes = voteCounts.find(
                        (vc) => vc.user_id === player.userId
                      );
                      const voteCount = playerVotes?.vote_count || 0;
                      const isLeader =
                        voteCounts.length > 0 &&
                        voteCount > 0 &&
                        voteCount === voteCounts[0]?.vote_count;

                      return (
                        <div
                          key={player.userId}
                          className={`p-4 rounded-lg flex items-center gap-3 transition-colors ${
                            isSelf
                              ? "bg-muted/20 opacity-50 cursor-not-allowed"
                              : `bg-muted/30 hover:bg-muted/50 cursor-pointer ${
                                  isSelected ? "ring-2 ring-yellow-500 bg-yellow-500/10" : ""
                                }`
                          }`}
                        >
                          <RadioGroupItem
                            value={player.userId}
                            id={player.userId}
                            disabled={isSelf}
                          />
                          <Label
                            htmlFor={player.userId}
                            className={`flex-1 flex items-center justify-between ${
                              isSelf ? "cursor-not-allowed" : "cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player.userName}</span>
                              {isSelf && (
                                <Badge variant="outline" className="text-xs">
                                  Você
                                </Badge>
                              )}
                              {isCurrentVote && (
                                <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-700 border-yellow-500/50">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Seu voto
                                </Badge>
                              )}
                            </div>
                            {voteCount > 0 && (
                              <Badge
                                variant={isLeader ? "default" : "secondary"}
                                className={`text-xs ${
                                  isLeader
                                    ? "bg-yellow-500 text-yellow-950 hover:bg-yellow-500"
                                    : ""
                                }`}
                              >
                                {isLeader && <Trophy className="h-3 w-3 mr-1" />}
                                {voteCount} {voteCount === 1 ? "voto" : "votos"}
                              </Badge>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSaveVote}
              disabled={isSaving || !selectedPlayerId}
              size="lg"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Salvar Voto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
