"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Team = {
  id: string;
  name: string;
  score: number;
};

type MatchScoreboardProps = {
  teamA: Team;
  teamB: Team;
  eventStatus: string;
};

export function MatchScoreboard({
  teamA,
  teamB,
  eventStatus,
}: MatchScoreboardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-green-500/10 via-background to-green-500/10 p-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge
            variant={
              eventStatus === "live"
                ? "destructive"
                : eventStatus === "finished"
                ? "default"
                : "secondary"
            }
            className="animate-pulse"
          >
            {eventStatus === "live"
              ? "AO VIVO"
              : eventStatus === "finished"
              ? "FINALIZADO"
              : "AGENDADO"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Time A */}
          <div className="text-center">
            <h3 className="font-bold text-lg sm:text-xl mb-2 truncate">
              {teamA.name}
            </h3>
            <div className="text-4xl sm:text-6xl font-bold text-blue-600">
              {teamA.score}
            </div>
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">
              VS
            </div>
          </div>

          {/* Time B */}
          <div className="text-center">
            <h3 className="font-bold text-lg sm:text-xl mb-2 truncate">
              {teamB.name}
            </h3>
            <div className="text-4xl sm:text-6xl font-bold text-red-600">
              {teamB.score}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
