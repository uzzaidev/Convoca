"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

type AdminSubscription = {
  id: string;
  group_id: string;
  group_name: string;
  user_name: string;
  user_email: string;
  stripe_subscription_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  grace_until: string | null;
  canceled_at: string | null;
  plan_name: string | null;
  coupon_code: string | null;
  created_at: string;
};

type GroupWithoutSub = {
  id: string;
  name: string;
  status: string;
  creator_name: string | null;
  creator_email: string | null;
  member_count: number;
  created_at: string;
};

type StatusFilter = "all" | "active" | "trialing" | "past_due" | "canceled" | "no_sub";

function getStatusBadge(status: string, graceUntil: string | null) {
  const hasGrace = graceUntil && new Date(graceUntil) > new Date();

  if (hasGrace) {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        Grace ate {new Date(graceUntil!).toLocaleDateString("pt-BR")}
      </Badge>
    );
  }

  const variants: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-200",
    trialing: "bg-purple-100 text-purple-800 border-purple-200",
    past_due: "bg-amber-100 text-amber-800 border-amber-200",
    canceled: "bg-red-100 text-red-800 border-red-200",
    incomplete: "bg-slate-100 text-slate-800 border-slate-200",
    unpaid: "bg-red-100 text-red-800 border-red-200",
  };

  const labels: Record<string, string> = {
    active: "Ativo",
    trialing: "Trial",
    past_due: "Em atraso",
    canceled: "Cancelado",
    incomplete: "Incompleto",
    unpaid: "Nao pago",
  };

  return (
    <Badge className={variants[status] ?? "bg-slate-100 text-slate-800"} variant="outline">
      {labels[status] ?? status}
    </Badge>
  );
}

export function AdminSubscriptionsTab() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [groupsWithoutSub, setGroupsWithoutSub] = useState<GroupWithoutSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loadingSubId, setLoadingSubId] = useState<string | null>(null);
  const [graceDays, setGraceDays] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" && filter !== "no_sub" ? `?status=${filter}` : "";
      const [subsRes, noSubRes] = await Promise.all([
        fetch(`/api/admin/subscriptions${params}`),
        fetch("/api/admin/subscriptions/groups-without-sub"),
      ]);
      const subsData = await subsRes.json();
      const noSubData = await noSubRes.json();
      if (subsRes.ok) setSubscriptions(subsData.subscriptions ?? []);
      if (noSubRes.ok) setGroupsWithoutSub(noSubData.groups ?? []);
    } catch {
      toast({ title: "Erro ao carregar assinaturas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAction(
    subscriptionId: string,
    action: "extend_grace" | "cancel" | "reactivate_manual",
    days?: number
  ) {
    setLoadingSubId(subscriptionId);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Sucesso!", description: data.message });
      fetchData();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoadingSubId(null);
    }
  }

  const showSubs = filter !== "no_sub";
  const showNoSub = filter === "all" || filter === "no_sub";

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="trialing">Em trial</SelectItem>
            <SelectItem value="past_due">Em atraso</SelectItem>
            <SelectItem value="canceled">Cancelados</SelectItem>
            <SelectItem value="no_sub">Sem assinatura</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          Atualizar
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      )}

      {/* Assinaturas existentes */}
      {!loading && showSubs && subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assinaturas Stripe</CardTitle>
            <CardDescription>
              Gerencie as assinaturas dos grupos. Acoes afetam o banco e o Stripe quando aplicavel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Responsavel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[280px]">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => {
                  const days = graceDays[sub.id] ?? "30";
                  const isLoading = loadingSubId === sub.id;

                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">{sub.group_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {sub.stripe_subscription_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{sub.user_name}</div>
                        <div className="text-xs text-muted-foreground">{sub.user_email}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(sub.status, sub.grace_until)}
                        {sub.trial_end && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Trial ate {new Date(sub.trial_end).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.current_period_end ? (
                          <div className="text-sm">
                            <div>ate {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.plan_name ?? <span className="text-muted-foreground text-sm">-</span>}
                        {sub.coupon_code && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            Cupom: {sub.coupon_code}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(sub.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              className="h-7 w-16 text-xs"
                              value={days}
                              onChange={(e) =>
                                setGraceDays((prev) => ({ ...prev, [sub.id]: e.target.value }))
                              }
                            />
                            <span className="text-xs text-muted-foreground">dias</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs px-2"
                              disabled={isLoading}
                              onClick={() =>
                                handleAction(sub.id, "extend_grace", parseInt(days))
                              }
                            >
                              +Grace
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2"
                              disabled={isLoading}
                              onClick={() =>
                                handleAction(sub.id, "reactivate_manual", parseInt(days))
                              }
                            >
                              Reativar
                            </Button>
                            {sub.status !== "canceled" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs px-2"
                                disabled={isLoading}
                                onClick={() => {
                                  if (confirm(`Cancelar assinatura do grupo ${sub.group_name}?`))
                                    handleAction(sub.id, "cancel");
                                }}
                              >
                                Cancelar
                              </Button>
                            )}
                            {sub.stripe_subscription_id && (
                              <a
                                href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline self-center"
                              >
                                Ver Stripe
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Grupos sem assinatura */}
      {!loading && showNoSub && groupsWithoutSub.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Grupos sem assinatura Stripe
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {groupsWithoutSub.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Grupos ativos que nao possuem assinatura Stripe cadastrada. Use o botao "Cobrar Pagamento" na aba Grupos para notificar o admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Criador</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupsWithoutSub.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="font-medium">{group.name}</div>
                      <Badge className="mt-1 bg-amber-100 text-amber-800 border-amber-200 text-xs" variant="outline">
                        {group.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>{group.creator_name ?? "-"}</div>
                      <div className="text-xs text-muted-foreground">{group.creator_email ?? ""}</div>
                    </TableCell>
                    <TableCell>{group.member_count}</TableCell>
                    <TableCell>{formatDate(group.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!loading && subscriptions.length === 0 && groupsWithoutSub.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma assinatura encontrada para o filtro selecionado.
        </p>
      )}
    </div>
  );
}