"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";

type Coupon = {
  id: string;
  code: string;
  couponId: string;
  name: string | null;
  percentOff: number | null;
  amountOff: number | null;
  currency: string | null;
  duration: string | null;
  durationInMonths: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  active: boolean;
  createdAt: string;
};

export function AdminCouponsTab() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [percentOff, setPercentOff] = useState("");
  const [amountOff, setAmountOff] = useState("");
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">("forever");
  const [durationInMonths, setDurationInMonths] = useState("");
  const [code, setCode] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (res.ok) {
        setCoupons(data.coupons);
      }
    } catch {
      toast({ title: "Erro ao carregar cupons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const body: Record<string, unknown> = {
        name,
        duration,
      };

      if (discountType === "percent") {
        body.percentOff = Number(percentOff);
      } else {
        body.amountOff = Math.round(Number(amountOff) * 100); // converter para centavos
      }

      if (duration === "repeating" && durationInMonths) {
        body.durationInMonths = Number(durationInMonths);
      }

      if (code.trim()) {
        body.code = code.trim();
      }

      if (maxRedemptions) {
        body.maxRedemptions = Number(maxRedemptions);
      }

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar cupom");
      }

      toast({ title: "Cupom criado", description: `Código: ${data.coupon.code}` });

      // Reset form
      setName("");
      setPercentOff("");
      setAmountOff("");
      setDuration("forever");
      setDurationInMonths("");
      setCode("");
      setMaxRedemptions("");

      fetchCoupons();
    } catch (error) {
      toast({
        title: "Erro ao criar cupom",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(couponId: string, active: boolean) {
    setTogglingId(couponId);
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar cupom");
      }

      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, active } : c))
      );

      toast({ title: active ? "Cupom ativado" : "Cupom desativado" });
    } catch (error) {
      toast({
        title: "Erro ao atualizar cupom",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  }

  function formatDiscount(coupon: Coupon) {
    if (coupon.percentOff) {
      return `${coupon.percentOff}%`;
    }
    if (coupon.amountOff) {
      return `R$ ${(coupon.amountOff / 100).toFixed(2)}`;
    }
    return "-";
  }

  function formatDuration(coupon: Coupon) {
    if (coupon.duration === "forever") return "Para sempre";
    if (coupon.duration === "once") return "Uma vez";
    if (coupon.duration === "repeating" && coupon.durationInMonths) {
      return `${coupon.durationInMonths} ${coupon.durationInMonths === 1 ? "mês" : "meses"}`;
    }
    return coupon.duration || "-";
  }

  return (
    <div className="space-y-6">
      {/* Formulário de criação */}
      <Card>
        <CardHeader>
          <CardTitle>Criar cupom de desconto</CardTitle>
          <CardDescription>
            Crie cupons que os clientes podem usar no checkout do Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-name">Nome do cupom</Label>
                <Input
                  id="coupon-name"
                  placeholder="Ex: Desconto de lançamento"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-code">Código (opcional)</Label>
                <Input
                  id="coupon-code"
                  placeholder="Ex: LAUNCH50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-muted-foreground">
                  Se vazio, o Stripe gera automaticamente
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo de desconto</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as "percent" | "fixed")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {discountType === "percent" ? (
                <div className="space-y-2">
                  <Label htmlFor="percent-off">Porcentagem de desconto</Label>
                  <Input
                    id="percent-off"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Ex: 50"
                    value={percentOff}
                    onChange={(e) => setPercentOff(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="amount-off">Valor de desconto (R$)</Label>
                  <Input
                    id="amount-off"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Ex: 30.00"
                    value={amountOff}
                    onChange={(e) => setAmountOff(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Duração</Label>
                <Select
                  value={duration}
                  onValueChange={(v) => setDuration(v as "once" | "repeating" | "forever")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forever">Para sempre</SelectItem>
                    <SelectItem value="once">Uma cobrança</SelectItem>
                    <SelectItem value="repeating">Por X meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {duration === "repeating" && (
              <div className="max-w-xs space-y-2">
                <Label htmlFor="duration-months">Quantidade de meses</Label>
                <Input
                  id="duration-months"
                  type="number"
                  min="1"
                  placeholder="Ex: 3"
                  value={durationInMonths}
                  onChange={(e) => setDurationInMonths(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="max-w-xs space-y-2">
              <Label htmlFor="max-redemptions">Máximo de usos (opcional)</Label>
              <Input
                id="max-redemptions"
                type="number"
                min="1"
                placeholder="Ilimitado"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar cupom"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de cupons */}
      <Card>
        <CardHeader>
          <CardTitle>Cupons existentes</CardTitle>
          <CardDescription>
            Gerencie os cupons de desconto criados no Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cupom criado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                        {coupon.code}
                      </code>
                    </TableCell>
                    <TableCell>{coupon.name || "-"}</TableCell>
                    <TableCell className="font-medium">{formatDiscount(coupon)}</TableCell>
                    <TableCell>{formatDuration(coupon)}</TableCell>
                    <TableCell>
                      {coupon.timesRedeemed}
                      {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.active ? "default" : "secondary"}>
                        {coupon.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={coupon.active}
                        disabled={togglingId === coupon.id}
                        onCheckedChange={(checked) => toggleActive(coupon.id, checked)}
                      />
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
