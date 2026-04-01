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
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

type Invoice = {
  id: string;
  number: string | null;
  customerEmail: string | null;
  customerName: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string | null;
  paid: boolean;
  created: string;
  hostedInvoiceUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
};

type UpcomingRenewal = {
  id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_end: string;
  trial_end: string | null;
  group_name: string;
  user_name: string;
  user_email: string;
};

type DashboardData = {
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
    past_due: number;
    canceled: number;
    incomplete: number;
  };
  upcomingRenewals: UpcomingRenewal[];
  customers: {
    linked: number;
    unlinked: number;
  };
  recentInvoices: Invoice[];
  balance: {
    available: number;
    pending: number;
    currency: string;
  };
  couponStats: {
    total: number;
    active: number;
    totalRedemptions: number;
  };
  monthlyRevenue: number;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const statusLabels: Record<string, string> = {
  active: "Ativa",
  trialing: "Trial",
  past_due: "Atrasada",
  canceled: "Cancelada",
  incomplete: "Incompleta",
  paid: "Pago",
  open: "Aberta",
  draft: "Rascunho",
  void: "Anulada",
  uncollectible: "Incobrável",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trialing: "bg-blue-100 text-blue-800",
  past_due: "bg-red-100 text-red-800",
  canceled: "bg-gray-100 text-gray-800",
  incomplete: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  open: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
  void: "bg-gray-100 text-gray-800",
  uncollectible: "bg-red-100 text-red-800",
};

export function AdminFinanceTab() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stripe-dashboard");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        throw new Error(json.error);
      }
    } catch {
      toast({ title: "Erro ao carregar dados financeiros", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Carregando dados financeiros...</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Erro ao carregar dados.</p>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription>Saldo Disponível</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(data.balance.available)}
            </div>
            {data.balance.pending > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(data.balance.pending)} pendente
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription>Receita do Mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(data.monthlyRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assinaturas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.subscriptions.total}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.subscriptions.active > 0 && (
                <Badge className="bg-green-100 text-green-800">{data.subscriptions.active} ativas</Badge>
              )}
              {data.subscriptions.trialing > 0 && (
                <Badge className="bg-blue-100 text-blue-800">{data.subscriptions.trialing} trial</Badge>
              )}
              {data.subscriptions.past_due > 0 && (
                <Badge className="bg-red-100 text-red-800">{data.subscriptions.past_due} atrasadas</Badge>
              )}
              {data.subscriptions.canceled > 0 && (
                <Badge variant="secondary">{data.subscriptions.canceled} canceladas</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cupons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.couponStats.total}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-green-100 text-green-800">{data.couponStats.active} ativos</Badge>
              <Badge variant="secondary">{data.couponStats.totalRedemptions} usos</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clientes vinculados */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clientes no Stripe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <div>
                <span className="text-2xl font-bold">{data.customers.linked}</span>
                <span className="text-sm text-muted-foreground ml-1">vinculados</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-muted-foreground">{data.customers.unlinked}</span>
                <span className="text-sm text-muted-foreground ml-1">sem vínculo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Links Rápidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener noreferrer">
                  Stripe Payments
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://dashboard.stripe.com/subscriptions" target="_blank" rel="noopener noreferrer">
                  Stripe Subscriptions
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://dashboard.stripe.com/customers" target="_blank" rel="noopener noreferrer">
                  Stripe Customers
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos vencimentos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos vencimentos (30 dias)</CardTitle>
          <CardDescription>
            Assinaturas que vencem ou renovam nos próximos 30 dias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.upcomingRenewals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma renovação nos próximos 30 dias.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Dias restantes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.upcomingRenewals.map((renewal) => {
                  const days = daysUntil(renewal.current_period_end);
                  return (
                    <TableRow key={renewal.id}>
                      <TableCell className="font-medium">{renewal.group_name}</TableCell>
                      <TableCell>
                        <div>{renewal.user_name}</div>
                        <div className="text-xs text-muted-foreground">{renewal.user_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[renewal.status] || ""}>
                          {statusLabels[renewal.status] || renewal.status}
                        </Badge>
                        {renewal.trial_end && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Trial até {formatDate(renewal.trial_end)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(renewal.current_period_end)}</TableCell>
                      <TableCell>
                        <span className={days <= 3 ? "text-red-600 font-bold" : days <= 7 ? "text-amber-600 font-medium" : ""}>
                          {days <= 0 ? "Hoje" : `${days} dias`}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Histórico de faturas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas faturas</CardTitle>
          <CardDescription>
            Histórico de pagamentos recentes do Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma fatura registrada ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">
                      {invoice.number || invoice.id.slice(0, 16)}
                    </TableCell>
                    <TableCell>
                      <div>{invoice.customerName || "-"}</div>
                      <div className="text-xs text-muted-foreground">{invoice.customerEmail || "-"}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.amountPaid || invoice.amountDue)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status || ""] || ""}>
                        {statusLabels[invoice.status || ""] || invoice.status || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(invoice.created)}</TableCell>
                    <TableCell>
                      {invoice.hostedInvoiceUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                            Ver
                          </a>
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
