"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = {
  id: string;
  name: string;
  image: string | null;
};

type CreateChargeModalProps = {
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateChargeModal({ groupId, onClose, onSuccess }: CreateChargeModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    type: "daily" as "monthly" | "daily" | "fine" | "other",
    amountCents: "",
    dueDate: "",
  });

  useEffect(() => {
    // Buscar membros do grupo
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}`);
        if (!response.ok) throw new Error("Erro ao buscar membros");
        
        const data = await response.json();
        setMembers(data.members || []);
      } catch (error) {
        console.error("Erro ao buscar membros:", error);
      }
    };

    fetchMembers();
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos
    if (!formData.userId || !formData.amountCents) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const amountCents = parseFloat(formData.amountCents) * 100;
    
    if (amountCents <= 0 || isNaN(amountCents)) {
      alert("Valor deve ser maior que zero");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/charges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: formData.userId,
          type: formData.type,
          amountCents: Math.round(amountCents),
          dueDate: formData.dueDate || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar cobrança");
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao criar cobrança:", error);
      alert(error instanceof Error ? error.message : "Erro ao criar cobrança");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Selecionar membro */}
            <div>
              <Label htmlFor="userId">Membro *</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) => setFormData({ ...formData, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de cobrança */}
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as typeof formData.type })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensalidade</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="fine">Multa</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div>
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={formData.amountCents}
                onChange={(e) => setFormData({ ...formData, amountCents: e.target.value })}
                required
              />
            </div>

            {/* Data de vencimento */}
            <div>
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Cobrança"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
