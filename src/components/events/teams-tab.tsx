"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { TeamDrawButton } from "./team-draw-button";
import { ManualTeamManager } from "./manual-team-manager";
import { TeamEditor } from "./team-editor";

type Player = {
  id: string;
  name: string;
  preferred_position: string | null;
  secondary_position: string | null;
};

type Team = {
  id: string;
  name: string;
  seed: number;
  is_winner: boolean | null;
  members: Array<{
    userId: string;
    userName: string;
    userImage: string | null;
    position: string;
    starter: boolean;
  }> | null;
};

type TeamsTabProps = {
  eventId: string;
  groupId: string;
  isAdmin: boolean;
  teams: Team[];
  confirmedPlayers: Player[];
  eventStatus: string;
  hasTeams: boolean;
};

export function TeamsTab({
  eventId,
  groupId,
  isAdmin,
  teams,
  confirmedPlayers,
  eventStatus,
  hasTeams,
}: TeamsTabProps) {
  return (
    <div className="space-y-6">
      {/* Botões de ação (Admin apenas) */}
      {isAdmin && eventStatus === "scheduled" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <TeamDrawButton
            eventId={eventId}
            groupId={groupId}
            confirmedCount={confirmedPlayers.length}
            hasTeams={hasTeams}
            isAdmin={isAdmin}
          />
          <ManualTeamManager
            eventId={eventId}
            confirmedPlayers={confirmedPlayers.map((p) => ({
              userId: p.id,
              userName: p.name,
              preferredPosition: p.preferred_position,
              secondaryPosition: p.secondary_position,
            }))}
            hasTeams={hasTeams}
          />
        </div>
      )}

      {/* Times */}
      {teams.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                Times
              </CardTitle>
              {isAdmin && eventStatus === "scheduled" && (
                <TeamEditor eventId={eventId} teams={teams} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {teams.map((team) => (
                <div key={team.id} className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {team.name}
                    <Badge variant="secondary" className="text-xs">
                      {team.members?.length || 0} jogadores
                    </Badge>
                  </h3>
                  <div className="space-y-2">
                    {team.members?.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2 p-2 rounded bg-muted/30"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            member.position === "gk"
                              ? "bg-yellow-500"
                              : member.position === "defender"
                              ? "bg-blue-500"
                              : member.position === "midfielder"
                              ? "bg-green-500"
                              : member.position === "forward"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <span className="flex-1 text-sm font-medium">
                          {member.userName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {member.position === "gk"
                            ? "Goleiro"
                            : member.position === "defender"
                            ? "Zagueiro"
                            : member.position === "midfielder"
                            ? "Meio"
                            : member.position === "forward"
                            ? "Atacante"
                            : "Linha"}
                        </Badge>
                      </div>
                    ))}
                    {(!team.members || team.members.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum jogador neste time
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum time sorteado ainda</p>
            {isAdmin && (
              <p className="text-sm mt-2">Use o botão acima para sortear os times</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
