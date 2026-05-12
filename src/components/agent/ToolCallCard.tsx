"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <div className="px-3 pb-2">
          <ResultView result={result} />
        </div>
      )}
    </div>
  );
}

function parseResult(result: unknown): unknown {
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }
  return result;
}

function ResultView({ result }: { result: unknown }) {
  const parsed = parseResult(result);

  // Array de objetos → tabela shadcn
  if (
    Array.isArray(parsed) &&
    parsed.length > 0 &&
    typeof parsed[0] === "object" &&
    parsed[0] !== null
  ) {
    const keys = Object.keys(parsed[0] as Record<string, unknown>).filter(
      (k) => (parsed as Record<string, unknown>[])[0][k] !== null || (parsed as Record<string, unknown>[]).some((r) => r[k] !== null)
    );
    return (
      <div className="overflow-x-auto rounded-md border border-border/40">
        <Table>
          <TableHeader>
            <TableRow>
              {keys.map((k) => (
                <TableHead key={k} className="capitalize text-xs py-2">
                  {k.replace(/_/g, " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(parsed as Record<string, unknown>[]).map((row, i) => (
              <TableRow key={i}>
                {keys.map((k) => (
                  <TableCell key={k} className="text-xs py-1.5">
                    {row[k] == null ? <span className="text-muted-foreground">-</span> : String(row[k])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Objeto simples → key: value
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    return (
      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        {Object.entries(parsed as Record<string, unknown>).map(([k, v]) => (
          <>
            <dt key={`k-${k}`} className="text-muted-foreground font-medium capitalize">
              {k.replace(/_/g, " ")}
            </dt>
            <dd key={`v-${k}`} className="text-muted-foreground">
              {v == null ? "-" : String(v)}
            </dd>
          </>
        ))}
      </dl>
    );
  }

  // Fallback → texto simples
  return (
    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
      {typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)}
    </pre>
  );
}
