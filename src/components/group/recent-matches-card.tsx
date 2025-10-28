"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Team = {
  id: string;
  name: string;
  is_winner: boolean;
  goals: number;
};

type Match = {
  id: string;
  starts_at: string;
  venue_name: string;
  teams: Team[] | null;
};

type RecentMatchesCardProps = {
  matches: Match[];
};

export function RecentMatchesCard({ matches }: RecentMatchesCardProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>🏟️ Jogos Recentes</CardTitle>
        <CardDescription>Últimos 5 jogos finalizados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="p-4 border rounded-lg hover:shadow-md transition-all"
            >
              {/* Cabeçalho do jogo */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <span className="text-sm text-muted-foreground">
                  📅 {formatDate(match.starts_at)}
                </span>
                {match.venue_name && (
                  <span className="text-sm text-muted-foreground">
                    📍 {match.venue_name}
                  </span>
                )}
              </div>

              {/* Placar */}
              {match.teams && match.teams.length > 0 ? (
                <div className="flex items-center justify-center gap-3 sm:gap-6">
                  {match.teams.map((team, index) => (
                    <React.Fragment key={team.id}>
                      {index > 0 && (
                        <div className="flex items-center justify-center">
                          <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                            ×
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex-1 text-center p-3 sm:p-4 rounded-lg transition-all ${
                          team.is_winner
                            ? "bg-green-500/10 border-2 border-green-500/30 shadow-sm"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="font-semibold text-sm sm:text-base mb-2 line-clamp-1">
                          {team.name}
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold">
                          {team.goals}
                        </div>
                        {team.is_winner && (
                          <Badge className="mt-2 text-xs" variant="default">
                            🏆 Vencedor
                          </Badge>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Informações do jogo não disponíveis
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
