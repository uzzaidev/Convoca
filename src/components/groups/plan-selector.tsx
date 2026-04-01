"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  interval: string;
  interval_count: number;
  max_installments: number | null;
  trial_days: number;
  is_default: boolean;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function getIntervalLabel(interval: string, count: number) {
  if (interval === "month" && count === 1) return "/mês";
  if (interval === "month" && count === 3) return "/trimestre";
  if (interval === "month" && count === 6) return "/semestre";
  if (interval === "year" && count === 1) return "/ano";
  return `/${count} ${interval === "month" ? "meses" : "anos"}`;
}

function getMonthlyEquivalent(amountCents: number, interval: string, intervalCount: number) {
  let totalMonths = interval === "year" ? intervalCount * 12 : intervalCount;
  if (totalMonths <= 1) return null;
  return amountCents / totalMonths;
}

export function PlanSelector({
  onSelect,
  selectedPlanId,
  loading,
}: {
  onSelect: (planId: string) => void;
  selectedPlanId: string | null;
  loading?: boolean;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        if (res.ok && data.plans) {
          setPlans(data.plans);
          // Auto-select default plan if none selected
          if (!selectedPlanId) {
            const defaultPlan = data.plans.find((p: Plan) => p.is_default);
            if (defaultPlan) onSelect(defaultPlan.id);
            else if (data.plans.length > 0) onSelect(data.plans[0].id);
          }
        }
      } catch {
        // Plans will be empty, fallback handled by parent
      } finally {
        setFetching(false);
      }
    }
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fetching) {
    return <p className="text-sm text-muted-foreground text-center py-4">Carregando planos...</p>;
  }

  if (plans.length === 0) {
    return null; // No plans available, parent will use default price
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Escolha seu plano</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const monthlyEquiv = getMonthlyEquivalent(plan.amount_cents, plan.interval, plan.interval_count);

          return (
            <Card
              key={plan.id}
              className={cn(
                "cursor-pointer transition-all relative",
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/50"
              )}
              onClick={() => !loading && onSelect(plan.id)}
            >
              {plan.is_default && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                  Recomendado
                </Badge>
              )}
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base flex items-center justify-between">
                  {plan.name}
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-2xl font-bold">{formatCurrency(plan.amount_cents)}</span>
                  <span className="text-sm text-muted-foreground">{getIntervalLabel(plan.interval, plan.interval_count)}</span>
                </div>
                {monthlyEquiv && (
                  <p className="text-xs text-muted-foreground">
                    Equivale a {formatCurrency(monthlyEquiv)}/mês
                  </p>
                )}
                {plan.max_installments && (
                  <p className="text-xs text-green-600">
                    Em até {plan.max_installments}x de {formatCurrency(plan.amount_cents / plan.max_installments)}
                  </p>
                )}
                {plan.trial_days > 0 && (
                  <p className="text-xs text-blue-600">
                    {plan.trial_days} dias grátis
                  </p>
                )}
                {plan.description && (
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
