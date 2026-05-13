"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitesManager } from "@/components/groups/invites-manager";
import { MembersManager } from "@/components/groups/members-manager";
import { GroupInfoForm } from "@/components/groups/group-info-form";
import { EventSettingsForm } from "@/components/groups/event-settings-form";
import { ScoringConfigForm } from "@/components/groups/scoring-config-form";
import { RecurrencesManager } from "@/components/groups/recurrences-manager";
import { SeasonManager } from "@/components/seasons/season-manager";
import { GroupBillingTab } from "@/components/groups/group-billing-tab";

type Group = {
  id: string;
  name: string;
  description: string | null;
  privacy: string;
  appMode: "ranking" | "control";
};

type Invite = {
  id: string;
  code: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  created_at: string;
  created_by_name: string | null;
};

type Member = {
  id: string;
  user_id: string;
  role: string;
  is_mensalista: boolean;
  monthly_amount_cents: number;
  joined_at: string;
  name: string;
  email: string;
};

type GroupSettingsTabsProps = {
  group: Group;
  invites: Invite[];
  members: Member[];
  currentUserId: string;
};

export function GroupSettingsTabs({
  group,
  invites,
  members,
  currentUserId,
}: GroupSettingsTabsProps) {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted p-1">
        <TabsTrigger value="info" className="flex-1 text-xs sm:text-sm">Info</TabsTrigger>
        <TabsTrigger value="events" className="flex-1 text-xs sm:text-sm">Eventos</TabsTrigger>
        <TabsTrigger value="recurrences" className="flex-1 text-xs sm:text-sm">Peladas</TabsTrigger>
        {group.appMode === "ranking" && (
          <TabsTrigger value="scoring" className="flex-1 text-xs sm:text-sm">Pontuação</TabsTrigger>
        )}
        <TabsTrigger value="seasons" className="flex-1 text-xs sm:text-sm">Temporadas</TabsTrigger>
        <TabsTrigger value="invites" className="flex-1 text-xs sm:text-sm">Convites</TabsTrigger>
        <TabsTrigger value="members" className="flex-1 text-xs sm:text-sm">Membros</TabsTrigger>
        <TabsTrigger value="billing" className="flex-1 text-xs sm:text-sm">Assinatura</TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="mt-6">
        <GroupInfoForm group={group} />
      </TabsContent>
      <TabsContent value="events" className="mt-6">
        <EventSettingsForm groupId={group.id} />
      </TabsContent>
      <TabsContent value="recurrences" className="mt-6">
        <RecurrencesManager groupId={group.id} />
      </TabsContent>
      {group.appMode === "ranking" && (
        <TabsContent value="scoring" className="mt-6">
          <ScoringConfigForm groupId={group.id} />
        </TabsContent>
      )}
      <TabsContent value="seasons" className="mt-6">
        <SeasonManager groupId={group.id} />
      </TabsContent>
      <TabsContent value="invites" className="mt-6">
        <InvitesManager groupId={group.id} groupName={group.name} initialInvites={invites} />
      </TabsContent>
      <TabsContent value="members" className="mt-6">
        <MembersManager
          groupId={group.id}
          initialMembers={members}
          currentUserId={currentUserId}
        />
      </TabsContent>
      <TabsContent value="billing" className="mt-6">
        <GroupBillingTab groupId={group.id} />
      </TabsContent>
    </Tabs>
  );
}
