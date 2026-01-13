"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Trophy, Play, BarChart3, Star } from "lucide-react";
import { ConfirmationTab } from "./confirmation-tab";
import { TeamsTab } from "./teams-tab";
import { LiveMatchTab } from "./live-match-tab";
import { RatingsTab } from "./ratings-tab";
import { StatsTab } from "./stats-tab";

type Player = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  preferred_position: string | null;
  secondary_position: string | null;
  created_at: string;
  removed_by_self_at: string | null;
};

type WaitlistPlayer = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  created_at: string;
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

type UserAttendance = {
  status: string;
  preferred_position: string | null;
  secondary_position: string | null;
} | null;

type GroupMember = {
  user_id: string;
  user_name: string;
  user_image: string | null;
  is_confirmed: boolean;
};

type EventTabsProps = {
  eventId: string;
  groupId: string;
  eventStatus: string;
  isAdmin: boolean;
  confirmedPlayers: Player[];
  waitlistPlayers: WaitlistPlayer[];
  teams: Team[];
  maxPlayers: number;
  hasTeams: boolean;
  userAttendance: UserAttendance;
  groupMembers: GroupMember[];
};

export function EventTabs({
  eventId,
  groupId,
  eventStatus,
  isAdmin,
  confirmedPlayers,
  waitlistPlayers,
  teams,
  maxPlayers,
  hasTeams,
  userAttendance,
  groupMembers,
}: EventTabsProps) {
  // Determine default tab based on event status
  const getDefaultTab = () => {
    if (eventStatus === "live") return "match";
    if (eventStatus === "finished") return "ratings";
    if (hasTeams) return "teams";
    return "confirmation";
  };

  return (
    <Tabs defaultValue={getDefaultTab()} className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
        <TabsTrigger value="confirmation" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Confirmação</span>
        </TabsTrigger>
        <TabsTrigger value="teams" className="gap-2">
          <Trophy className="h-4 w-4" />
          <span className="hidden sm:inline">Times</span>
        </TabsTrigger>
        <TabsTrigger
          value="match"
          className="gap-2"
          disabled={!hasTeams}
        >
          <Play className="h-4 w-4" />
          <span className="hidden sm:inline">Jogo</span>
        </TabsTrigger>
        <TabsTrigger
          value="stats"
          className="gap-2 hidden lg:flex"
          disabled={!hasTeams}
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Estatísticas</span>
        </TabsTrigger>
        <TabsTrigger
          value="ratings"
          className="gap-2"
          disabled={eventStatus !== "finished"}
        >
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">Avaliações</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="confirmation" className="mt-6">
        <ConfirmationTab
          eventId={eventId}
          groupId={groupId}
          isAdmin={isAdmin}
          confirmedPlayers={confirmedPlayers}
          waitlistPlayers={waitlistPlayers}
          hasTeams={hasTeams}
          maxPlayers={maxPlayers}
          eventStatus={eventStatus}
          userAttendance={userAttendance}
          groupMembers={groupMembers}
        />
      </TabsContent>

      <TabsContent value="teams" className="mt-6">
        <TeamsTab
          eventId={eventId}
          groupId={groupId}
          isAdmin={isAdmin}
          teams={teams}
          confirmedPlayers={confirmedPlayers}
          eventStatus={eventStatus}
          hasTeams={hasTeams}
        />
      </TabsContent>

      <TabsContent value="match" className="mt-6">
        <LiveMatchTab
          eventId={eventId}
          teams={teams}
          isAdmin={isAdmin}
          eventStatus={eventStatus}
        />
      </TabsContent>

      <TabsContent value="stats" className="mt-6">
        <StatsTab eventId={eventId} teams={teams} />
      </TabsContent>

      <TabsContent value="ratings" className="mt-6">
        <RatingsTab
          eventId={eventId}
          teams={teams}
          isAdmin={isAdmin}
        />
      </TabsContent>
    </Tabs>
  );
}
