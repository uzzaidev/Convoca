"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchScoreboard } from "./match-scoreboard";
import { MatchControls } from "./match-controls";
import { QuickActionPanel } from "./quick-action-panel";
import { MatchTimeline } from "./match-timeline";
import { Play } from "lucide-react";

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

type MatchAction = {
  id: string;
  action_type: string;
  subject_user_id: string | null;
  subject_user_name?: string;
  team_id: string;
  team_name?: string;
  minute: number | null;
  created_at: string;
};

type LiveMatchTabProps = {
  eventId: string;
  teams: Team[];
  isAdmin: boolean;
  eventStatus: string;
};

export function LiveMatchTab({
  eventId,
  teams,
  isAdmin,
  eventStatus,
}: LiveMatchTabProps) {
  const [actions, setActions] = useState<MatchAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch actions on mount and when event status changes
  useEffect(() => {
    fetchActions();
  }, [eventId, eventStatus]);

  const fetchActions = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/actions`);
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error("Error fetching actions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionAdded = () => {
    fetchActions();
  };

  // Calculate scores from actions
  const calculateScore = (teamId: string) => {
    return actions.filter(
      (action) => action.action_type === "goal" && action.team_id === teamId
    ).length;
  };

  if (teams.length < 2) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Sorteie os times primeiro para começar o jogo</p>
        </CardContent>
      </Card>
    );
  }

  const teamA = teams[0];
  const teamB = teams[1];
  const scoreA = calculateScore(teamA.id);
  const scoreB = calculateScore(teamB.id);

  return (
    <div className="space-y-6">
      {/* Placar */}
      <MatchScoreboard
        teamA={{ ...teamA, score: scoreA }}
        teamB={{ ...teamB, score: scoreB }}
        eventStatus={eventStatus}
      />

      {/* Controles (Admin) */}
      {isAdmin && (
        <MatchControls
          eventId={eventId}
          eventStatus={eventStatus}
        />
      )}

      {/* Painel de Ações Rápidas - Admin pode adicionar mesmo após finalizar */}
      {isAdmin && (eventStatus === "live" || eventStatus === "finished") && (
        <QuickActionPanel
          eventId={eventId}
          teams={teams}
          onActionAdded={handleActionAdded}
        />
      )}

      {/* Timeline de Ações */}
      <MatchTimeline
        actions={actions}
        teams={teams}
        isAdmin={isAdmin}
        onActionDeleted={handleActionAdded}
        eventId={eventId}
      />
    </div>
  );
}
