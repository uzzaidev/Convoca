"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, AlertCircle, CheckCircle2, Crown, Vote, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TiebreakerPlayer = {
  userId: string;
  userName: string;
  userImage: string | null;
  voteCount: number;
};

type TiebreakerData = {
  id: string;
  round: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  winnerId: string | null;
  decidedBy: string | null;
  players: TiebreakerPlayer[];
  userHasVoted: boolean;
  userVotedFor: string | null;
  totalParticipants: number;
};

type MvpTiebreakerCardProps = {
  eventId: string;
  isAdmin: boolean;
  onTiebreakerResolved?: () => void;
};

export function MvpTiebreakerCard({
  eventId,
  isAdmin,
  onTiebreakerResolved,
}: MvpTiebreakerCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tiebreaker, setTiebreaker] = useState<TiebreakerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [deciding, setDeciding] = useState(false);

  const fetchTiebreaker = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/ratings/tiebreaker`);
      if (!response.ok) throw new Error("Erro ao buscar desempate");

      const data = await response.json();

      if (data.hasTiebreaker) {
        setTiebreaker(data.tiebreaker);
      } else {
        setTiebreaker(null);
      }
    } catch (error) {
      console.error("Error fetching tiebreaker:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiebreaker();
    // Poll every 10 seconds if voting is active
    const interval = setInterval(() => {
      if (tiebreaker?.status === "voting") {
        fetchTiebreaker();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [eventId, tiebreaker?.status]);

  const handleVote = async (votedUserId: string) => {
    if (!tiebreaker) return;

    setVoting(true);
    try {
      const response = await fetch(
        `/api/events/${eventId}/ratings/tiebreaker/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tiebreakerId: tiebreaker.id,
            votedUserId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao registrar voto");
      }

      toast({
        title: "Voto registrado!",
        description: "Seu voto foi contabilizado com sucesso",
      });

      await fetchTiebreaker();

      // Check if tiebreaker was resolved
      const updatedResponse = await fetch(`/api/events/${eventId}/ratings/tiebreaker`);
      const updatedData = await updatedResponse.json();

      if (updatedData.hasTiebreaker &&
          (updatedData.tiebreaker.status === "completed" ||
           updatedData.tiebreaker.status === "admin_decided")) {
        onTiebreakerResolved?.();
      }

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao registrar voto",
        variant: "destructive",
      });
    } finally {
      setVoting(false);
    }
  };

  const handleAdminDecision = async (winnerUserId: string) => {
    if (!tiebreaker) return;

    setDeciding(true);
    try {
      const response = await fetch(
        `/api/events/${eventId}/ratings/tiebreaker/decide`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tiebreakerId: tiebreaker.id,
            winnerUserId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao definir vencedor");
      }

      toast({
        title: "Vencedor definido!",
        description: "O MVP foi escolhido com sucesso",
      });

      onTiebreakerResolved?.();
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao definir vencedor",
        variant: "destructive",
      });
    } finally {
      setDeciding(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
        </CardContent>
      </Card>
    );
  }

  if (!tiebreaker) {
    return null;
  }

  const isCompleted = tiebreaker.status === "completed" || tiebreaker.status === "admin_decided";
  const winner = tiebreaker.players.find((p) => p.userId === tiebreaker.winnerId);

  // Se completado, mostrar vencedor
  if (isCompleted && winner) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Trophy className="h-5 w-5" />
            MVP Definido {tiebreaker.status === "admin_decided" && "(Decisão Admin)"}
          </CardTitle>
          <CardDescription>
            Desempate resolvido na rodada {tiebreaker.round}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-green-100 border border-green-300">
            <Avatar className="h-16 w-16 border-2 border-green-600">
              <AvatarImage src={winner.userImage || undefined} />
              <AvatarFallback>{winner.userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <h3 className="text-xl font-bold text-green-700">{winner.userName}</h3>
              </div>
              <p className="text-sm text-green-600">
                {tiebreaker.status === "admin_decided"
                  ? "Escolhido pelo administrador"
                  : `${winner.voteCount} votos no desempate`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado: pending ou voting
  const totalVotes = tiebreaker.players.reduce((sum, p) => sum + p.voteCount, 0);
  const allVoted = totalVotes === tiebreaker.totalParticipants;

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700">
          <AlertCircle className="h-5 w-5" />
          Desempate de MVP - Rodada {tiebreaker.round}
        </CardTitle>
        <CardDescription>
          {tiebreaker.players.length} jogadores empatados. {totalVotes}/{tiebreaker.totalParticipants} votos registrados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta para admin */}
        {isAdmin && allVoted && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              Todos votaram mas ainda há empate. Você pode abrir nova rodada ou escolher o vencedor manualmente.
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta para usuário que já votou */}
        {tiebreaker.userHasVoted && !isAdmin && (
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              Você já votou neste desempate. Aguardando outros jogadores...
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de jogadores */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700">Jogadores Empatados:</h4>

          {tiebreaker.players.map((player) => (
            <div
              key={player.userId}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                tiebreaker.userVotedFor === player.userId
                  ? "border-yellow-500 bg-yellow-100"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={player.userImage || undefined} />
                  <AvatarFallback>{player.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{player.userName}</p>
                  <p className="text-sm text-gray-500">
                    {player.voteCount} {player.voteCount === 1 ? "voto" : "votos"}
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                {/* Botão de voto para jogadores */}
                {!tiebreaker.userHasVoted && !isAdmin && (
                  <Button
                    onClick={() => handleVote(player.userId)}
                    disabled={voting}
                    size="sm"
                    variant={tiebreaker.userVotedFor === player.userId ? "default" : "outline"}
                  >
                    {voting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Vote className="h-4 w-4 mr-1" />
                        Votar
                      </>
                    )}
                  </Button>
                )}

                {/* Botão de decisão para admin */}
                {isAdmin && (
                  <Button
                    onClick={() => handleAdminDecision(player.userId)}
                    disabled={deciding}
                    size="sm"
                    variant="default"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {deciding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-1" />
                        Escolher
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Badge de status */}
        <div className="flex justify-center pt-2">
          <Badge variant="outline" className="text-yellow-700 border-yellow-300">
            {tiebreaker.status === "pending" && "Aguardando Início da Votação"}
            {tiebreaker.status === "voting" && "Votação em Andamento"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
