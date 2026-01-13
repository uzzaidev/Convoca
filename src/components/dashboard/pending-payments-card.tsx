"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DollarSign, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type PendingCharge = {
  id: string;
  group_id: string;
  group_name: string;
  amount_cents: number;
  type: string;
  due_date: string | null;
};

export function PendingPaymentsCard({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [charges, setCharges] = useState<PendingCharge[]>([]);

  useEffect(() => {
    const fetchPendingCharges = async () => {
      try {
        // Buscar contagem
        const countRes = await fetch("/api/users/me/pending-charges-count");
        const countData = await countRes.json();
        setCount(countData.count || 0);

        // Se houver cobranças, buscar detalhes (limitado a 5 mais recentes)
        if (countData.count > 0) {
          // Vou buscar dos grupos do usuário
          const groupsRes = await fetch("/api/groups");
          const groupsData = await groupsRes.json();

          const allCharges: PendingCharge[] = [];

          for (const group of groupsData.groups || []) {
            const chargesRes = await fetch(
              `/api/groups/${group.id}/charges?status=pending&userId=${userId}`
            );
            const chargesData = await chargesRes.json();

            if (chargesData.charges) {
              allCharges.push(
                ...chargesData.charges.map((c: any) => ({
                  ...c,
                  group_name: group.name,
                }))
              );
            }
          }

          // Ordenar por data de vencimento
          allCharges.sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          });

          setCharges(allCharges.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching pending charges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCharges();
  }, [userId]);

  if (loading) {
    return null; // Ou skeleton loader
  }

  if (count === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Você está em dia! Não há cobranças pendentes.
        </AlertDescription>
      </Alert>
    );
  }

  const totalAmount = charges.reduce((sum, c) => sum + c.amount_cents, 0);

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <CardTitle className="text-yellow-900">Pagamentos Pendentes</CardTitle>
            <CardDescription className="text-yellow-700">
              Você tem {count} cobrança{count !== 1 ? "s" : ""} pendente{count !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {charges.length > 0 && (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium text-yellow-900">
                Total em aberto: {formatCurrency(totalAmount)}
              </p>
              <div className="space-y-1">
                {charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between text-sm p-2 rounded bg-white/50"
                  >
                    <div>
                      <p className="font-medium text-yellow-900">{charge.group_name}</p>
                      <p className="text-xs text-yellow-700">
                        {charge.type === "monthly"
                          ? "Mensalidade"
                          : charge.type === "daily"
                          ? "Diária"
                          : charge.type === "fine"
                          ? "Multa"
                          : "Outro"}
                        {charge.due_date &&
                          ` - Vence em ${new Date(charge.due_date).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                    <p className="font-semibold text-yellow-900">
                      {formatCurrency(charge.amount_cents)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {charges.length > 0 && (
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href={`/groups/${charges[0].group_id}/payments`}>
                  Ver Todos os Pagamentos
                </Link>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
