"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { AdminCouponsTab } from "@/components/admin/admin-coupons-tab";
import { formatDate } from "@/lib/utils";
import { type GroupStatus } from "@/lib/group-status";

type AdminGroup = {
  id: string;
  name: string;
  status: GroupStatus;
  statusReason: string | null;
  createdAt: string;
  creatorName: string | null;
  creatorEmail: string | null;
  memberCount: number;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  systemRole: "user" | "system_admin";
  groups: Array<{
    id: string;
    name: string;
    status: GroupStatus;
    role: string;
  }>;
};

type AdminStats = {
  totalGroups: number;
  pendingGroups: number;
  activeGroups: number;
  inactiveGroups: number;
  rejectedGroups: number;
  totalUsers: number;
};

export function AdminDashboard({
  stats,
  groups,
  users,
}: {
  stats: AdminStats;
  groups: AdminGroup[];
  users: AdminUser[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);

  async function updateStatus(groupId: string, status: "active" | "inactive" | "rejected") {
    let reason: string | undefined;

    if (status === "rejected") {
      const value = window.prompt("Informe o motivo da reprovacao do grupo:");
      reason = value?.trim();

      if (!reason) {
        toast({
          title: "Motivo obrigatorio",
          description: "Informe um motivo para reprovar o grupo.",
          variant: "destructive",
        });
        return;
      }
    }

    if (status === "inactive") {
      const value = window.prompt("Motivo da inativacao (opcional):");
      reason = value?.trim() || undefined;
    }

    try {
      setLoadingGroupId(groupId);

      const response = await fetch(`/api/admin/groups/${groupId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar status do grupo");
      }

      toast({
        title: "Status atualizado",
        description: `Grupo alterado para ${status}.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao atualizar grupo",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoadingGroupId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard title="Grupos" value={stats.totalGroups} />
        <SummaryCard title="Pendentes" value={stats.pendingGroups} tone="amber" />
        <SummaryCard title="Ativos" value={stats.activeGroups} tone="green" />
        <SummaryCard title="Inativos" value={stats.inactiveGroups} tone="slate" />
        <SummaryCard title="Reprovados" value={stats.rejectedGroups} tone="red" />
        <SummaryCard title="Contas" value={stats.totalUsers} tone="navy" />
      </div>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="users">Contas</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Todos os grupos</CardTitle>
              <CardDescription>Controle de aprovacao, ativacao e auditoria dos grupos criados.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Criador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[260px]">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="font-medium">{group.name}</div>
                          {group.statusReason && (
                            <p className="max-w-md text-xs text-muted-foreground">{group.statusReason}</p>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {group.members.map((member) => (
                              <Badge key={`${group.id}-${member.id}`} variant="outline">
                                {member.name} ({member.role})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{group.creatorName || "Sem criador"}</div>
                          <div className="text-xs text-muted-foreground">{group.creatorEmail || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <GroupStatusBadge status={group.status} />
                      </TableCell>
                      <TableCell>{group.memberCount}</TableCell>
                      <TableCell>{formatDate(group.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {group.status !== "active" && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(group.id, "active")}
                              disabled={loadingGroupId === group.id}
                            >
                              Aprovar / Reativar
                            </Button>
                          )}
                          {group.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(group.id, "inactive")}
                              disabled={loadingGroupId === group.id}
                            >
                              Inativar
                            </Button>
                          )}
                          {group.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatus(group.id, "rejected")}
                              disabled={loadingGroupId === group.id}
                            >
                              Reprovar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contas criadas</CardTitle>
              <CardDescription>Auditoria das contas e dos grupos aos quais cada usuario esta vinculado.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Grupos vinculados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            {user.systemRole === "system_admin" && <Badge>Admin Sistema</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {user.groups.length === 0 && <span className="text-sm text-muted-foreground">Sem grupos</span>}
                          {user.groups.map((group) => (
                            <Badge key={`${user.id}-${group.id}`} variant="outline">
                              {group.name} ({group.role})
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="mt-6">
          <AdminCouponsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: number;
  tone?: "default" | "green" | "amber" | "red" | "slate" | "navy";
}) {
  const toneClasses: Record<"default" | "green" | "amber" | "red" | "slate" | "navy", string> = {
    default: "bg-white",
    green: "bg-green-50 border-green-200",
    amber: "bg-amber-50 border-amber-200",
    red: "bg-red-50 border-red-200",
    slate: "bg-slate-50 border-slate-200",
    navy: "bg-navy/5 border-navy/20",
  };

  return (
    <Card className={toneClasses[tone]}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
