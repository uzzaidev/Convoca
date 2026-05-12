"use client";

import { useState } from "react";

interface Props {
  tool: string;
  result?: unknown;
}

const TOOL_LABELS: Record<string, string> = {
  list_upcoming_events: "Listar próximos eventos",
  get_next_event: "Próximo evento",
  list_past_events: "Eventos passados",
  get_event_details: "Detalhes do evento",
  get_event_teams: "Times do evento",
  get_event_scoreboard: "Placar",
  get_group_rankings: "Ranking do grupo",
  get_my_stats: "Minhas estatísticas",
  get_top_scorers: "Artilheiros",
  get_frequency_ranking: "Frequência",
  list_group_members: "Membros do grupo",
  search_member_by_name: "Buscar membro",
  list_my_charges: "Minhas cobranças",
  list_group_charges: "Cobranças do grupo",
  get_group_wallet: "Carteira do grupo",
  list_expenses: "Despesas",
  create_event: "Criar evento",
  update_event: "Atualizar evento",
  cancel_event: "Cancelar evento",
  set_my_rsvp: "Confirmar presença",
  set_member_rsvp: "Confirmar presença de membro",
  check_in_player: "Fazer check-in",
  create_charge: "Criar cobrança",
  mark_charge_paid: "Marcar como pago",
  draw_teams: "Sortear times",
  swap_players: "Trocar jogadores",
};

export function ToolCallCard({ tool, result }: Props) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[tool] ?? tool;
  const hasResult = result !== undefined;

  return (
    <div className="rounded-md border border-border/50 bg-muted/30 text-xs overflow-hidden">
      <button
        type="button"
        onClick={() => hasResult && setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
      >
        <span className="text-muted-foreground">
          {hasResult ? (expanded ? "▾" : "▸") : "◌"}
        </span>
        <span className="font-medium">{label}</span>
        {!hasResult && (
          <span className="ml-auto text-muted-foreground animate-pulse">
            executando...
          </span>
        )}
        {hasResult && (
          <span className="ml-auto text-green-600">concluído</span>
        )}
      </button>

      {expanded && hasResult && (
        <pre className="px-3 pb-2 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
