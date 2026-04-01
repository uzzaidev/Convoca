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
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="events">Eventos</TabsTrigger>
        <TabsTrigger value="recurrences">Peladas</TabsTrigger>
        <TabsTrigger value="scoring">Pontuação</TabsTrigger>
        <TabsTrigger value="seasons">Temporadas</TabsTrigger>
        <TabsTrigger value="invites">Convites</TabsTrigger>
        <TabsTrigger value="members">Membros</TabsTrigger>
        <TabsTrigger value="billing">Assinatura</TabsTrigger>
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
      <TabsContent value="scoring" className="mt-6">
        <ScoringConfigForm groupId={group.id} />
      </TabsContent>
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
