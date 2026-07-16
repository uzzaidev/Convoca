"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitesManager } from "@/components/groups/invites-manager";
import { MembersManager } from "@/components/groups/members-manager";
import { GroupInfoForm } from "@/components/groups/group-info-form";
import { EventSettingsForm } from "@/components/groups/event-settings-form";
import { ScoringConfigForm } from "@/components/groups/scoring-config-form";
import { RecurrencesManager } from "@/components/groups/recurrences-manager";
import { SeasonManager } from "@/components/seasons/season-manager";
import { GroupBillingTab } from "@/components/groups/group-billing-tab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteGroup() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/groups/${group.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error ?? "Erro ao excluir grupo");
        setDeleting(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setDeleteError("Erro de conexão");
      setDeleting(false);
    }
  }

  return (
    <>
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

      {/* Zona de Perigo */}
      <div className="mt-10 rounded-lg border border-destructive/40 p-5">
        <h3 className="text-sm font-semibold text-destructive mb-1">Zona de Perigo</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Excluir o grupo remove permanentemente o acesso de todos os membros. Os dados históricos são preservados internamente.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { setConfirmName(""); setDeleteError(""); setShowDeleteDialog(true); }}
        >
          Excluir grupo
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir grupo</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Digite o nome do grupo para confirmar:
              <span className="block mt-1 font-semibold text-foreground">{group.name}</span>
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Nome do grupo"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            autoFocus
          />
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={confirmName !== group.name || deleting}
              onClick={handleDeleteGroup}
            >
              {deleting ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
