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
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreditCard, ExternalLink, Calendar, AlertTriangle } from "lucide-react";

type Subscription = {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  planName: string;
  planAmountCents: number | null;
  planInterval: string | null;
  planIntervalCount: number | null;
  planDescription: string | null;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
};

type Invoice = {
  id: string;
  status: string | null;
  amount_due: number;
  amount_paid: number;
  created: number;
  hosted_invoice_url: string | null;
  period_start: number;
  period_end: number;
};

type UpcomingInvoice = {
  amount_due: number;
  next_payment_attempt: number | null;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatDate(dateStr: string | number) {
  const date = typeof dateStr === "number" ? new Date(dateStr * 1000) : new Date(dateStr);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Ativa", className: "bg-green-100 text-green-800" },
    trialing: { label: "Período de teste", className: "bg-blue-100 text-blue-800" },
    past_due: { label: "Pagamento pendente", className: "bg-yellow-100 text-yellow-800" },
    canceled: { label: "Cancelada", className: "bg-red-100 text-red-800" },
    unpaid: { label: "Não paga", className: "bg-red-100 text-red-800" },
    incomplete: { label: "Incompleta", className: "bg-gray-100 text-gray-800" },
  };
  const s = map[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return <Badge className={s.className}>{s.label}</Badge>;
}

function getInvoiceStatusBadge(status: string | null) {
  const map: Record<string, { label: string; className: string }> = {
    paid: { label: "Pago", className: "bg-green-100 text-green-800" },
    open: { label: "Aberto", className: "bg-yellow-100 text-yellow-800" },
    void: { label: "Anulado", className: "bg-gray-100 text-gray-800" },
    draft: { label: "Rascunho", className: "bg-gray-100 text-gray-800" },
    uncollectible: { label: "Irrecuperável", className: "bg-red-100 text-red-800" },
  };
  const s = map[status || ""] || { label: status || "—", className: "bg-gray-100 text-gray-800" };
  return <Badge className={s.className}>{s.label}</Badge>;
}

function getIntervalLabel(interval: string | null, count: number | null) {
  if (!interval) return "";
  if (interval === "month" && count === 1) return "Mensal";
  if (interval === "month" && count === 3) return "Trimestral";
  if (interval === "month" && count === 6) return "Semestral";
  if (interval === "year" && count === 1) return "Anual";
  return `${count}x ${interval === "month" ? "meses" : "anos"}`;
}

export function GroupBillingTab({ groupId }: { groupId: string }) {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [upcomingInvoice, setUpcomingInvoice] = useState<UpcomingInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/billing`);
      const data = await res.json();
      if (res.ok) {
        setSubscription(data.subscription);
        setInvoices(data.invoices);
        setUpcomingInvoice(data.upcomingInvoice);
      }
    } catch {
      toast({ title: "Erro ao carregar informações", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [groupId, toast]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  async function handleAction(action: "cancel" | "reactivate") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: data.message });
      fetchBilling();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Erro ao abrir portal",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Carregando informações de cobrança...</p>;
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assinatura</CardTitle>
          <CardDescription>Este grupo não possui uma assinatura ativa.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isTrialing = subscription.status === "trialing";
  const isCanceling = subscription.cancelAtPeriodEnd;

  return (
    <div className="space-y-6">
      {/* Status da assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Plano</p>
              <p className="font-medium">{subscription.planName}</p>
              {subscription.planInterval && (
                <p className="text-xs text-muted-foreground">
                  {getIntervalLabel(subscription.planInterval, subscription.planIntervalCount)}
                  {subscription.planAmountCents && ` — ${formatCurrency(subscription.planAmountCents)}`}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                {getStatusBadge(subscription.status)}
                {isCanceling && (
                  <Badge className="bg-orange-100 text-orange-800">
                    Cancela em {formatDate(subscription.currentPeriodEnd)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Período atual
              </p>
              <p className="text-sm">
                {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            {isTrialing && subscription.trialEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Trial termina em</p>
                <p className="text-sm font-medium text-blue-600">{formatDate(subscription.trialEnd)}</p>
              </div>
            )}
            {upcomingInvoice && (
              <div>
                <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                <p className="text-sm">
                  {formatCurrency(upcomingInvoice.amount_due)}
                  {upcomingInvoice.next_payment_attempt && (
                    <> em {formatDate(upcomingInvoice.next_payment_attempt)}</>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openPortal}
              disabled={portalLoading}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {portalLoading ? "Abrindo..." : "Gerenciar no Stripe"}
            </Button>

            {isCanceling ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleAction("reactivate")}
                disabled={actionLoading}
              >
                {actionLoading ? "Processando..." : "Reativar Assinatura"}
              </Button>
            ) : (
              subscription.status !== "canceled" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={actionLoading}>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Cancelar Assinatura
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A assinatura será cancelada ao final do período atual
                        ({formatDate(subscription.currentPeriodEnd)}). Até lá, você
                        continua tendo acesso a todos os recursos do grupo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleAction("cancel")}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Confirmar cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de faturas */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Faturas</CardTitle>
            <CardDescription>Últimas faturas da assinatura deste grupo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{formatDate(inv.created)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(inv.period_start)} — {formatDate(inv.period_end)}
                    </TableCell>
                    <TableCell>{formatCurrency(inv.amount_due)}</TableCell>
                    <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                    <TableCell>
                      {inv.hosted_invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
