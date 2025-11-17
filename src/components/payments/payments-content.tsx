"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Check } from "lucide-react";
import { CreateChargeModal } from "./create-charge-modal";
import { ChargesDataTable, type Charge } from "./charges-data-table";

type PaymentsContentProps = {
  groupId: string;
  isAdmin: boolean;
};

export function PaymentsContent({ groupId, isAdmin }: PaymentsContentProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCharges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/charges`);
      if (!response.ok) throw new Error("Erro ao buscar cobranças");
      
      const data = await response.json();
      setCharges(data.charges || []);
    } catch (error) {
      console.error("Erro ao buscar cobranças:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleMarkAsPaid = async (chargeId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/charges/${chargeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar cobrança");

      fetchCharges();
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      alert("Erro ao marcar como pago");
    }
  };

  const handleCancelCharge = async (chargeId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/charges/${chargeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "canceled" }),
      });

      if (!response.ok) throw new Error("Erro ao cancelar cobrança");

      fetchCharges();
    } catch (error) {
      console.error("Erro ao cancelar cobrança:", error);
      alert("Erro ao cancelar cobrança");
    }
  };

  const handleDeleteCharge = async (chargeId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta cobrança?")) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/charges/${chargeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir cobrança");

      fetchCharges();
    } catch (error) {
      console.error("Erro ao excluir cobrança:", error);
      alert("Erro ao excluir cobrança");
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const totalPending = charges
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amount_cents, 0);

  const totalPaid = charges
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount_cents, 0);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {charges.filter((c) => c.status === "pending").length} cobrança(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {charges.filter((c) => c.status === "paid").length} pagamento(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cobranças */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Cobranças</CardTitle>
            {isAdmin && (
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Cobrança
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : (
            <ChargesDataTable
              data={charges}
              isAdmin={isAdmin}
              onMarkAsPaid={handleMarkAsPaid}
              onCancel={handleCancelCharge}
              onDelete={handleDeleteCharge}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de criação */}
      {showCreateModal && (
        <CreateChargeModal
          groupId={groupId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCharges();
          }}
        />
      )}
    </div>
  );
}
