"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Check, Receipt, Trash2 } from "lucide-react";
import { CreateChargeModal } from "./create-charge-modal";
import { CreateExpenseModal } from "./create-expense-modal";
import { ChargesDataTable, type Charge } from "./charges-data-table";

type Expense = {
  id: string;
  category: string;
  description: string | null;
  amount_cents: number;
  date: string;
  created_at: string;
  created_by_name: string | null;
};

const categoryLabels: Record<string, string> = {
  venue_rental: "Quadra",
  equipment: "Material",
  referee: "Árbitro",
  other: "Outro",
};

type PaymentsContentProps = {
  groupId: string;
  isAdmin: boolean;
};

export function PaymentsContent({ groupId, isAdmin }: PaymentsContentProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const fetchCharges = async () => {
    try {
      setLoading(true);
      const [chargesRes, expensesRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/charges`),
        fetch(`/api/groups/${groupId}/expenses`),
      ]);
      
      if (chargesRes.ok) {
        const data = await chargesRes.json();
        setCharges(data.charges || []);
      }
      if (expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error);
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

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa? O valor será devolvido ao caixa.")) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir despesa");

      fetchCharges();
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      alert("Erro ao excluir despesa");
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

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_cents, 0);

  const totalPaid = charges
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount_cents, 0);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} despesa(s)
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

      {/* Despesas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Despesas</CardTitle>
            {isAdmin && (
              <Button onClick={() => setShowExpenseModal(true)} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma despesa registrada.</p>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {categoryLabels[expense.category] || expense.category}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {expense.description || categoryLabels[expense.category] || expense.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString("pt-BR")} •{" "}
                        {expense.created_by_name || "Desconhecido"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(expense.amount_cents)}
                    </span>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de criação de cobrança */}
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

      {/* Modal de criação de despesa */}
      {showExpenseModal && (
        <CreateExpenseModal
          groupId={groupId}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {
            setShowExpenseModal(false);
            fetchCharges();
          }}
        />
      )}
    </div>
  );
}
