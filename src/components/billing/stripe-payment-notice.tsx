"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  /** Se o usuario eh admin de algum grupo sem assinatura ativa */
  hasGroupWithoutSubscription: boolean;
  /** Ultima vez que o usuario dispensou o aviso (ISO string ou null) */
  noticeDismissedAt: string | null;
}

const DEADLINE = new Date("2026-10-01");
const RESHOW_AFTER_DAYS = 7;

export function StripePaymentNotice({ hasGroupWithoutSubscription, noticeDismissedAt }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasGroupWithoutSubscription) return;
    if (new Date() >= DEADLINE) return; // Apos outubro, o bloqueio eh feito pelo backend

    if (noticeDismissedAt) {
      const dismissedDate = new Date(noticeDismissedAt);
      const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < RESHOW_AFTER_DAYS) return;
    }

    // Mostrar apos 1.5s para nao interferir no carregamento da pagina
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [hasGroupWithoutSubscription, noticeDismissedAt]);

  async function handleDismiss() {
    setOpen(false);
    try {
      await fetch("/api/users/dismiss-stripe-notice", { method: "POST" });
    } catch {
      // Ignorar erro de dismiss — nao eh critico
    }
  }

  async function handleSetupPayment() {
    setOpen(false);
    router.push("/settings?tab=billing");
  }

  const daysUntilDeadline = Math.max(
    0,
    Math.ceil((DEADLINE.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
              💳
            </div>
            <DialogTitle className="text-lg leading-tight">
              Pagamento via Stripe em breve obrigatorio
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-left space-y-2">
            <p>
              A partir de <strong>outubro de 2026</strong>, o pagamento do Convoca
              sera aceito <strong>somente pelo Stripe com cartao de credito</strong>.
            </p>
            <p>
              Seu grupo ainda nao tem uma assinatura configurada. Para garantir o
              acesso sem interrupcao, configure o pagamento antes do prazo.
            </p>
            {daysUntilDeadline > 0 && (
              <p className="text-amber-700 font-medium">
                {daysUntilDeadline} dias restantes ate o prazo.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleDismiss}
          >
            Lembrar mais tarde
          </Button>
          <Button
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            onClick={handleSetupPayment}
          >
            Configurar pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}