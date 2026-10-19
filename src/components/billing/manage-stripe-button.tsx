"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

export function ManageStripeButton({
  label = "Minhas Assinaturas",
  variant = "outline",
}: {
  label?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleOpenPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao abrir portal");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Erro ao abrir portal de assinaturas",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} onClick={handleOpenPortal} disabled={loading} className="flex items-center gap-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      {label}
      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
    </Button>
  );
}
