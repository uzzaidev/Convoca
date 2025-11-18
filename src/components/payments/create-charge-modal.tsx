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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Member = {
  id: string;
  name: string;
  image: string | null;
};

type Event = {
  id: string;
  starts_at: string;
  venue_name: string | null;
};

type Participant = {
  user_id: string;
  user_name: string;
  status: string;
  checked_in_at: string | null;
};

type CreateChargeModalProps = {
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateChargeModal({ groupId, onClose, onSuccess }: CreateChargeModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [chargeMode, setChargeMode] = useState<"individual" | "event">("individual");
  const [formData, setFormData] = useState({
    userId: "",
    type: "daily" as "monthly" | "daily" | "fine" | "other",
    amountCents: "",
    dueDate: "",
  });
  const [eventFormData, setEventFormData] = useState({
    eventId: "",
    type: "daily" as "monthly" | "daily" | "fine" | "other",
    totalAmount: "",
    dueDate: "",
  });

  useEffect(() => {
    // Buscar membros do grupo e eventos
    const fetchData = async () => {
      try {
        // Buscar membros
        const groupResponse = await fetch(`/api/groups/${groupId}`);
        if (!groupResponse.ok) throw new Error("Erro ao buscar membros");
        
        const groupData = await groupResponse.json();
        setMembers(groupData.group?.members || []);

        // Buscar eventos finalizados recentes
        const eventsResponse = await fetch(`/api/events?groupId=${groupId}&status=finished&limit=10`);
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData.events || []);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    fetchData();
  }, [groupId]);

  // Buscar participantes quando um evento for selecionado
  useEffect(() => {
    if (!eventFormData.eventId) {
      setParticipants([]);
      return;
    }

    const fetchParticipants = async () => {
      try {
        const response = await fetch(`/api/events/${eventFormData.eventId}`);
        if (!response.ok) throw new Error("Erro ao buscar participantes");
        
        const data = await response.json();
        console.log("Event data:", data);
        console.log("Attendance:", data.event?.attendance);
        
        // Filtrar participantes que confirmaram presença (status 'yes')
        // Se tiver checked_in_at, significa que jogou
        // Se não tiver checked_in_at mas status for 'yes', também incluir (confirmou mas pode não ter feito check-in)
        const attendees = (data.event?.attendance || []).filter(
          (att: Participant) => att.status === 'yes'
        );
        console.log("Filtered attendees:", attendees);
        setParticipants(attendees);
      } catch (error) {
        console.error("Erro ao buscar participantes:", error);
      }
    };

    fetchParticipants();
  }, [eventFormData.eventId]);

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

  const handleEventChargesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventFormData.eventId || !eventFormData.totalAmount || participants.length === 0) {
      alert("Por favor, selecione um evento com participantes e informe o valor total");
      return;
    }

    const totalAmount = parseFloat(eventFormData.totalAmount) * 100;
    
    if (totalAmount <= 0 || isNaN(totalAmount)) {
      alert("Valor total deve ser maior que zero");
      return;
    }

    // Calcular valor por pessoa
    const amountPerPerson = Math.round(totalAmount / participants.length);

    setLoading(true);

    try {
      // Criar cobrança para cada participante
      const promises = participants.map(participant =>
        fetch(`/api/groups/${groupId}/charges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: participant.user_id,
            type: eventFormData.type,
            amountCents: amountPerPerson,
            dueDate: eventFormData.dueDate || undefined,
            eventId: eventFormData.eventId, // Link charge to event
          }),
        })
      );

      const responses = await Promise.all(promises);
      
      // Verificar se todas as requisições foram bem-sucedidas
      const failedResponses = responses.filter(r => !r.ok);
      if (failedResponses.length > 0) {
        throw new Error(`Erro ao criar ${failedResponses.length} cobrança(s)`);
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao criar cobranças:", error);
      alert(error instanceof Error ? error.message : "Erro ao criar cobranças");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>

        <Tabs value={chargeMode} onValueChange={(v) => setChargeMode(v as typeof chargeMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Cobrança Individual</TabsTrigger>
            <TabsTrigger value="event">Cobrança por Partida</TabsTrigger>
          </TabsList>

          {/* Cobrança Individual */}
          <TabsContent value="individual">
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
                      {members.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">Carregando membros...</div>
                      ) : (
                        members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))
                      )}
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
          </TabsContent>

          {/* Cobrança por Partida */}
          <TabsContent value="event">
            <form onSubmit={handleEventChargesSubmit}>
              <div className="space-y-4">
                {/* Selecionar evento */}
                <div>
                  <Label htmlFor="eventId">Partida *</Label>
                  <Select
                    value={eventFormData.eventId}
                    onValueChange={(value) => setEventFormData({ ...eventFormData, eventId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma partida" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhuma partida finalizada encontrada
                        </div>
                      ) : (
                        events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {new Date(event.starts_at).toLocaleDateString("pt-BR")} 
                            {event.venue_name && ` - ${event.venue_name}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mostrar participantes */}
                {eventFormData.eventId && (
                  <div className="rounded-md border p-3">
                    <Label className="text-sm font-medium">
                      Participantes que jogaram: {participants.length}
                    </Label>
                    {participants.length > 0 ? (
                      <div className="mt-2 max-h-32 overflow-y-auto text-sm text-muted-foreground">
                        {participants.map((p) => p.user_name).join(", ")}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhum participante encontrado
                      </p>
                    )}
                  </div>
                )}

                {/* Tipo de cobrança */}
                <div>
                  <Label htmlFor="eventType">Tipo *</Label>
                  <Select
                    value={eventFormData.type}
                    onValueChange={(value) =>
                      setEventFormData({ ...eventFormData, type: value as typeof eventFormData.type })
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

                {/* Valor Total */}
                <div>
                  <Label htmlFor="totalAmount">Valor Total (R$) *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="500,00"
                    value={eventFormData.totalAmount}
                    onChange={(e) => setEventFormData({ ...eventFormData, totalAmount: e.target.value })}
                    required
                  />
                  {eventFormData.totalAmount && participants.length > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      R$ {(parseFloat(eventFormData.totalAmount) / participants.length).toFixed(2)} por pessoa
                    </p>
                  )}
                </div>

                {/* Data de vencimento */}
                <div>
                  <Label htmlFor="eventDueDate">Data de Vencimento</Label>
                  <Input
                    id="eventDueDate"
                    type="date"
                    value={eventFormData.dueDate}
                    onChange={(e) => setEventFormData({ ...eventFormData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || participants.length === 0}>
                  {loading ? "Criando..." : `Criar ${participants.length} Cobrança(s)`}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
