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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  stripe_price_id: string;
  amount_cents: number;
  interval: string;
  interval_count: number;
  max_installments: number | null;
  trial_days: number;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function getIntervalLabel(interval: string, count: number) {
  if (interval === "month" && count === 1) return "Mensal";
  if (interval === "month" && count === 6) return "Semestral";
  if (interval === "month" && count === 3) return "Trimestral";
  if (interval === "year" && count === 1) return "Anual";
  return `${count}x ${interval === "month" ? "meses" : "anos"}`;
}

export function AdminPlansTab() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    amountReais: "",
    interval: "month",
    intervalCount: "1",
    maxInstallments: "",
    trialDays: "7",
    sortOrder: "0",
    isDefault: false,
  });

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      if (res.ok) setPlans(data.plans);
    } catch {
      toast({ title: "Erro ao carregar planos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const amountCents = Math.round(parseFloat(form.amountReais.replace(",", ".")) * 100);
    if (!amountCents || amountCents <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      setCreating(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          amountCents,
          interval: form.interval,
          intervalCount: parseInt(form.intervalCount),
          maxInstallments: form.maxInstallments ? parseInt(form.maxInstallments) : null,
          trialDays: parseInt(form.trialDays),
          sortOrder: parseInt(form.sortOrder),
          isDefault: form.isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Plano criado com sucesso!" });
      setForm({
        name: "",
        description: "",
        amountReais: "",
        interval: "month",
        intervalCount: "1",
        maxInstallments: "",
        trialDays: "7",
        sortOrder: "0",
        isDefault: false,
      });
      fetchPlans();
    } catch (error) {
      toast({
        title: "Erro ao criar plano",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(planId: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      fetchPlans();
    } catch {
      toast({ title: "Erro ao atualizar plano", variant: "destructive" });
    }
  }

  async function toggleDefault(planId: string) {
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      fetchPlans();
    } catch {
      toast({ title: "Erro ao definir padrão", variant: "destructive" });
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Carregando planos...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Criar novo plano */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Plano</CardTitle>
          <CardDescription>O plano será criado automaticamente no Stripe como uma Price.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome do Plano *</Label>
                <Input
                  placeholder="Ex: Plano Mensal"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  placeholder="Ex: 60,00"
                  value={form.amountReais}
                  onChange={(e) => setForm({ ...form, amountReais: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição do plano..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Intervalo</Label>
                <Select value={form.interval} onValueChange={(v) => setForm({ ...form, interval: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Meses</SelectItem>
                    <SelectItem value="year">Anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>A cada (intervalo)</Label>
                <Select value={form.intervalCount} onValueChange={(v) => setForm({ ...form, intervalCount: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Parcelas máx.</Label>
                <Select
                  value={form.maxInstallments || "none"}
                  onValueChange={(v) => setForm({ ...form, maxInstallments: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem parcelamento</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="6">6x</SelectItem>
                    <SelectItem value="12">12x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dias de trial</Label>
                <Input
                  type="number"
                  min="0"
                  max="90"
                  value={form.trialDays}
                  onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ordem de exibição</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm({ ...form, isDefault: v })}
                />
                <Label>Plano padrão (destacado na seleção)</Label>
              </div>
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar Plano"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de planos */}
      <Card>
        <CardHeader>
          <CardTitle>Planos Cadastrados</CardTitle>
          <CardDescription>Planos vinculados ao Stripe. Ativar/desativar afeta a disponibilidade no checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum plano cadastrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium">{plan.name}</div>
                      {plan.description && (
                        <div className="text-xs text-muted-foreground mt-1">{plan.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground font-mono mt-1">{plan.stripe_price_id}</div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(plan.amount_cents)}</TableCell>
                    <TableCell>{getIntervalLabel(plan.interval, plan.interval_count)}</TableCell>
                    <TableCell>
                      {plan.max_installments ? `Até ${plan.max_installments}x` : "—"}
                    </TableCell>
                    <TableCell>{plan.trial_days} dias</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plan.is_active}
                          onCheckedChange={(v) => toggleActive(plan.id, v)}
                        />
                        {plan.is_default && (
                          <Badge className="bg-blue-100 text-blue-800">Padrão</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {!plan.is_default && plan.is_active && (
                        <Button size="sm" variant="outline" onClick={() => toggleDefault(plan.id)}>
                          Definir padrão
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
