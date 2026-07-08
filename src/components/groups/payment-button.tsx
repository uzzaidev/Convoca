"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard } from "lucide-react";
import { PlanSelector } from "@/components/groups/plan-selector";
import { trackTrialStarted } from "@/lib/mobile/analytics";

export function PaymentButton({ groupId }: { groupId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  async function handlePayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          planId: selectedPlanId || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao iniciar pagamento");
      }

      if (data.url) {
        void trackTrialStarted({ planName: selectedPlanId ?? "default", trialDays: 14 });
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Erro ao iniciar pagamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PlanSelector
        onSelect={setSelectedPlanId}
        selectedPlanId={selectedPlanId}
        loading={loading}
      />
      <Button onClick={handlePayment} disabled={loading} size="lg">
        <CreditCard className="mr-2 h-5 w-5" />
        {loading ? "Redirecionando..." : "Realizar Pagamento"}
      </Button>
    </div>
  );
}
