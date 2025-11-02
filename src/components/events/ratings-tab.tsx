"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Star, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Team = {
  id: string;
  name: string;
  members: Array<{
    userId: string;
    userName: string;
  }> | null;
};

type PlayerRating = {
  player_id: string;
  rating: number;
};

type RatingsTabProps = {
  eventId: string;
  teams: Team[];
  isAdmin: boolean;
};

export function RatingsTab({
  eventId,
  teams,
  isAdmin,
}: RatingsTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [existingRatings, setExistingRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Get all players from all teams
  const allPlayers = teams.flatMap((team) =>
    (team.members || []).map((member) => ({
      ...member,
      teamName: team.name,
      teamId: team.id,
    }))
  );

  useEffect(() => {
    fetchExistingRatings();
  }, [eventId]);

  const fetchExistingRatings = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/ratings`);
      if (response.ok) {
        const data = await response.json();
        const ratingsMap: Record<string, number> = {};
        data.ratings?.forEach((r: PlayerRating) => {
          ratingsMap[r.player_id] = r.rating;
        });
        setExistingRatings(ratingsMap);
        setRatings(ratingsMap);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (playerId: string, value: number[]) => {
    setRatings((prev) => ({
      ...prev,
      [playerId]: value[0],
    }));
  };

  const handleSaveRatings = async () => {
    const ratingsToSave = Object.entries(ratings).filter(
      ([playerId, rating]) => rating > 0
    );

    if (ratingsToSave.length === 0) {
      toast({
        title: "Nenhuma avaliação",
        description: "Avalie pelo menos um jogador",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      let successCount = 0;
      let errorMessages: string[] = [];

      // Send each rating individually
      for (const [playerId, rating] of ratingsToSave) {
        try {
          const response = await fetch(`/api/events/${eventId}/ratings`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ratedUserId: playerId,
              score: rating,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Erro ao salvar avaliação");
          }

          successCount++;
        } catch (error) {
          errorMessages.push(
            error instanceof Error ? error.message : "Erro desconhecido"
          );
        }
      }

      if (successCount > 0) {
        toast({
          title: "Avaliações salvas!",
          description: `${successCount} avaliações foram registradas`,
        });

        setExistingRatings(ratings);
        router.refresh();
      }

      if (errorMessages.length > 0) {
        toast({
          title: "Alguns erros ocorreram",
          description: errorMessages[0],
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar avaliações",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando avaliações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Avaliar Jogadores
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Como admin, você pode avaliar todos os jogadores"
              : "Avalie seus companheiros de partida de 0 a 10"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teams.map((team) => (
              <div key={team.id}>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  {team.name}
                  <Badge variant="secondary" className="text-xs">
                    {team.members?.length || 0} jogadores
                  </Badge>
                </h3>

                <div className="space-y-4">
                  {team.members?.map((player) => {
                    const currentRating = ratings[player.userId] || 0;
                    const hasExistingRating = existingRatings[player.userId] !== undefined;

                    return (
                      <div
                        key={player.userId}
                        className="p-4 rounded-lg bg-muted/30 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.userName}</span>
                            {hasExistingRating && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-lg font-bold min-w-[2ch] text-right">
                              {currentRating}
                            </span>
                          </div>
                        </div>

                        <Slider
                          value={[currentRating]}
                          onValueChange={(value) => handleRatingChange(player.userId, value)}
                          max={10}
                          step={1}
                          className="w-full"
                        />

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSaveRatings}
              disabled={isSaving}
              size="lg"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Salvar Avaliações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
