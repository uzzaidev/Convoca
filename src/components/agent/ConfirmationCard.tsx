"use client";

import { Button } from "@/components/ui/button";

interface Props {
  tool: string;
  arguments: unknown;
  onConfirm: () => void;
  onCancel: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  create_event: "Criar Evento",
  update_event: "Atualizar Evento",
  cancel_event: "Cancelar Evento",
  set_member_rsvp: "Confirmar Presença de Membro",
  check_in_player: "Fazer Check-in de Jogador",
  create_charge: "Criar Cobrança",
  mark_charge_paid: "Marcar como Pago",
  draw_teams: "Sortear Times",
  swap_players: "Trocar Jogadores",
};

export function ConfirmationCard({ tool, arguments: args, onConfirm, onCancel }: Props) {
  const label = ACTION_LABELS[tool] ?? tool;

  return (
    <div className="rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-950/20 p-4">
      <p className="font-semibold text-sm mb-1">Confirmar ação</p>
      <p className="text-sm text-muted-foreground mb-3">
        O assistente quer executar:{" "}
        <span className="font-medium text-foreground">{label}</span>
      </p>

      {args != null && (
        <pre className="bg-muted rounded p-2 text-xs overflow-x-auto mb-3">
          {JSON.stringify(args, null, 2)}
        </pre>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={onConfirm}>
          Aprovar
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
