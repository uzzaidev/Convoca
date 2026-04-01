"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard } from "lucide-react";

export function PaymentButton({ groupId }: { groupId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao iniciar pagamento");
      }

      if (data.url) {
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
    <Button onClick={handlePayment} disabled={loading} size="lg" className="mt-4">
      <CreditCard className="mr-2 h-5 w-5" />
      {loading ? "Redirecionando..." : "Realizar Pagamento"}
    </Button>
  );
}
