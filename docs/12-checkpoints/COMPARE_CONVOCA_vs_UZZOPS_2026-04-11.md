# COMPARATIVO: Convoca vs UzzOPS — Diferenças e Convergência de Ideias

**Data:** 2026-04-11  
**Fonte:** Reverse engineering de ambos os projetos + `.brv/context-tree`

---

## 1. VISÃO GERAL DOS DOIS PRODUTOS

```mermaid
mindmap
  root((Apps))
    Convoca
      Gestão de Peladas
      Grupos de futebol
      RSVP / Lista de espera
      Sorteio de times
      MVP Voting
      Financeiro / Billing
      Temporadas e Rankings
    UzzOPS
      Gestão de Projetos Scrum
      Multi-tenancy por empresa
      Sprints e Backlog
      Planning Poker
      Daily Scrum
      Marketing / CRM
      Gantt / Roadmaps
      Reuniões e Encaminhamentos
```

---

## 2. COMPARATIVO DE STACK TÉCNICA

```mermaid
block-beta
  columns 3

  block:labels:1
    l1["Camada"]
    l2["Convoca"]
    l3["UzzOPS"]
  end

  block:fw:1
    fw1["Framework"]
    fw2["Next.js 16.1.1"]
    fw3["Next.js 16.1.6"]
  end

  block:react_:1
    r1["React"]
    r2["React 19.2"]
    r3["React 19.2.4"]
  end

  block:auth_:1
    a1["Auth"]
    a2["NextAuth v5\n(credentials)"]
    a3["Supabase SSR Auth\n(cookie sessions)"]
  end

  block:db_:1
    d1["Database"]
    d2["Neon PostgreSQL\nraw SQL"]
    d3["Supabase PostgreSQL\nRLS + multi-tenant"]
  end

  block:state_:1
    s1["Estado"]
    s2["Zustand"]
    s3["React Query 5\n+ Zustand 5"]
  end

  block:forms_:1
    fo1["Formulários"]
    fo2["Zod direto"]
    fo3["React Hook Form\n+ Zod 4"]
  end

  block:billing_:1
    bi1["Billing"]
    bi2["Stripe v21\n(subscriptions)"]
    bi3["Não tem"]
  end

  block:charts_:1
    c1["Gráficos"]
    c2["Nenhum ainda"]
    c3["Recharts 3.7"]
  end

  block:dnd_:1
    dn1["Drag & Drop"]
    dn2["Nenhum ainda"]
    dn3["@dnd-kit"]
  end

  block:flow_:1
    fl1["Fluxogramas"]
    fl2["Nenhum"]
    fl3["@xyflow/react"]
  end
```

---

## 3. DIFERENÇAS ESTRUTURAIS CHAVE

| Aspecto | Convoca | UzzOPS | Impacto |
|---|---|---|---|
| **Modelo de acesso** | 1 usuário → N grupos | Multi-tenant (empresa → projetos → membros) | Convoca é mais simples, correto para peladas |
| **Segurança de dados** | Auth via `requireAuth()` no handler | RLS (Postgres Row Level Security) em toda tabela | UzzOPS tem isolamento mais robusto |
| **Data fetching (client)** | Server Components + fetch direto | React Query 5 (cache, invalidação, loading states) | UzzOPS tem UX mais fluida em client-side |
| **Formulários** | Zod + validação manual | React Hook Form + Zod (field-level errors, touched) | UzzOPS tem melhor UX de formulário |
| **Visualização** | Tabelas simples | Recharts (gráficos), @xyflow (diagramas) | Convoca sem analytics visuais |
| **Drag & Drop** | Não existe | @dnd-kit (backlog, kanban, sorteio) | Convoca sem DnD |
| **Exportação** | jsPDF | jsPDF + xlsx + jszip | UzzOPS mais completo em export |
| **Complexidade de UI** | ~72 componentes | ~23 subpastas, centenas de componentes | UzzOPS muito mais rico visualmente |
| **API routes** | 61 endpoints | ~95+ endpoints | UzzOPS mais abrangente |
| **Migrations** | ~20 arquivos (sem sequência rígida) | 33 arquivos numerados (003-033) | UzzOPS mais disciplinado |
| **Hooks** | Nenhum (Server Components) | 21 React Query hooks | UzzOPS mais interativo |
| **Cron Jobs** | 2 (Vercel Cron) | Não documentado | Convoca tem automação |
| **Billing** | Stripe completo ✅ | Sem billing | Convoca mais maduro neste aspecto |
| **Email** | Resend (reset de senha) | Não documentado | — |

---

## 4. MÓDULOS DE UZZOPS QUE FAZEM SENTIDO NO CONVOCA

```mermaid
graph LR
    subgraph UzzOPS["UzzOPS — Fontes de Inspiração"]
        PK["Planning Poker\n(votação colaborativa)"]
        DS["Daily Scrum\n(check-in diário)"]
        RETRO["Retrospectivas\n(análise pós-evento)"]
        CHARTS["Recharts\n(gráficos e stats)"]
        DND["@dnd-kit\n(drag and drop)"]
        GANTT["Gantt/Timeline\n(planejamento)"]
        ROADMAP["Roadmaps\n(temporadas)"]
        RQ["React Query 5\n(data fetching)"]
        RHF["React Hook Form\n(formulários)"]
        DECISION["Decision Log\n(regras do grupo)"]
        EXPORT["xlsx + jszip\n(export rico)"]
        MD["MD Feeder\n(upload markdown)"]
    end

    subgraph Convoca["Convoca — Onde aplicar"]
        MVP["MVP Voting\n→ Planning Poker style"]
        CHECKIN["Check-in de jogadores\n→ Daily Scrum flow"]
        ANALYSIS["Análise pós-jogo\n→ Retrospectiva"]
        STATS["Estatísticas e rankings\n→ Recharts charts"]
        SORT["Sorteio de times\n→ DnD de jogadores"]
        SEASONS["Temporadas\n→ Timeline visual"]
        PLANNING["Planejamento de grupo\n→ Roadmap de peladas"]
        UX["UX fluida\n→ React Query hooks"]
        FORMS["Formulários\n→ React Hook Form"]
        RULES["Regras do grupo\n→ Decision Log"]
        EXPORTCONV["Export completo\n→ xlsx de finanças"]
        IMPORT["Importar jogadores\n→ CSV/MD feeder"]
    end

    PK --> MVP
    DS --> CHECKIN
    RETRO --> ANALYSIS
    CHARTS --> STATS
    DND --> SORT
    GANTT --> SEASONS
    ROADMAP --> PLANNING
    RQ --> UX
    RHF --> FORMS
    DECISION --> RULES
    EXPORT --> EXPORTCONV
    MD --> IMPORT
```

---

## 5. PLANO DE CONVERGÊNCIA — IDEIAS DO UZZOPS PARA O CONVOCA

### 5.1 PRIORIDADE ALTA (Impacto imediato na UX)

#### A. React Query 5 para data fetching client-side
**Problema atual:** Convoca usa Server Components para tudo. Ações como RSVP, check-in, votação requerem page reload ou custom state.

**Solução (UzzOPS-inspired):**
```typescript
// hooks/use-event-attendance.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useEventAttendance(eventId: string) {
  return useQuery({
    queryKey: ["event", eventId, "attendance"],
    queryFn: () => fetch(`/api/events/${eventId}/attendance`).then(r => r.json()),
  })
}

export function useRSVP(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: "yes" | "no" | "waitlist") =>
      fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event", eventId] }),
  })
}
```

**Arquivos a adicionar:**
- `src/hooks/use-event-attendance.ts`
- `src/hooks/use-group-members.ts`
- `src/hooks/use-rankings.ts`
- `src/providers/query-provider.tsx` (instalar `@tanstack/react-query`)

---

#### B. React Hook Form nos formulários
**Problema atual:** Formulários no Convoca têm validação manual e UX de erro fraca.

**Solução (UzzOPS-inspired):**
```typescript
// components/events/create-event-form.tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createEventSchema } from "@/lib/validations"

const form = useForm({
  resolver: zodResolver(createEventSchema),
  defaultValues: { maxPlayers: 10, maxGoalkeepers: 2 },
})

// Field-level errors, touched state, dirty tracking automático
```

**Pacotes a instalar:** `react-hook-form @hookform/resolvers`

---

#### C. Recharts para Estatísticas Visuais
**Problema atual:** Rankings e stats são apenas tabelas de texto. Sem visualização de evolução.

**Solução (UzzOPS-inspired):** Gráficos para:
- Evolução de pontos por temporada (LineChart)
- Distribuição gols/assistências por jogador (BarChart)
- Presença do membro ao longo do tempo (AreaChart)
- Placar de partidas (PieChart)

```typescript
// components/groups/ranking-chart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function RankingEvolutionChart({ data }: { data: RankingData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="points" stroke="#22c55e" />
        <XAxis dataKey="season" />
        <YAxis />
        <Tooltip />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Pacotes a instalar:** `recharts`

---

### 5.2 PRIORIDADE MÉDIA (Features novas baseadas em UzzOPS)

#### D. DnD Kit para Sorteio Visual de Times

**Inspiração:** UzzOPS usa @dnd-kit para arrastar features entre sprints/colunas kanban.

**Aplicação no Convoca:** Interface visual de sorteio onde admin pode **arrastar jogadores entre times** após o sorteio automático.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Time Azul    │    │  Sem Time       │    │    Time Verde   │
│─────────────────│    │─────────────────│    │─────────────────│
│ 🟢 João (GK)   │    │ ○ Carlos        │    │ 🟢 Ana (GK)    │
│ ○ Pedro         │◄───│ ○ Maria         │───►│ ○ Rafael        │
│ ○ Lucas         │    │                 │    │ ○ Fernanda      │
│ [+ Arrastar]    │    │ [Drag aqui]     │    │ [+ Arrastar]    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

Substitui o modal de swap atual (que exige selecionar 2 jogadores) por uma UI de drag-and-drop intuitiva.

**Pacotes a instalar:** `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

---

#### E. Sistema de Análise Pós-Jogo (Retrospectiva)

**Inspiração:** UzzOPS tem `retrospective_actions` — ações surgidas de retrospectivas de sprint.

**Aplicação no Convoca:** Análise pós-pelada onde o grupo registra:
- O que funcionou bem no jogo
- O que pode melhorar (horário, local, número de jogadores)
- Ações para próximo evento (ex: "confirmar quadra com antecedência")

```sql
-- Nova tabela
CREATE TABLE IF NOT EXISTS event_retrospectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('good', 'improve', 'action')),
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### F. Planning Poker → "Votação de Presença Estratégica"

**Inspiração:** UzzOPS tem Planning Poker para estimar esforço de features com votação em tempo real.

**Adaptação para Convoca:** Para peladas com vagas limitadas e disputadas, um sistema de **prioridade de vaga** por votação do grupo — membros votam em quem deve ter prioridade de vaga quando o evento está cheio (ex: quem participou menos recentemente).

---

#### G. Export Excel de Financeiro

**Inspiração:** UzzOPS exporta xlsx + jszip.

**Aplicação no Convoca:** Exportar relatório financeiro completo:
- Cobranças por membro
- Despesas do grupo
- Saldo da carteira
- Histórico de pagamentos

Hoje o Convoca só tem export PDF via jsPDF. Adicionar xlsx seria muito mais útil para o tesoureiro do grupo.

**Pacotes a instalar:** `xlsx`

---

#### H. Decision Log → "Regras do Grupo"

**Inspiração:** UzzOPS tem `decision_log` (ADRs) para registrar decisões arquiteturais.

**Adaptação:** Convoca poderia ter um **"Regras da Pelada"** — espaço onde o admin documenta as regras combinadas do grupo (valores, critérios de desempate, horário de confirmação, política de faltas, etc.)

```sql
CREATE TABLE IF NOT EXISTS group_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### I. MD Feeder → Import de Jogadores

**Inspiração:** UzzOPS permite upload de arquivo Markdown para importar dados (md_imports, md_items).

**Adaptação:** Convoca poderia importar lista de jogadores via CSV/Excel — útil para grupos que já têm uma planilha de membros e querem migrar para o app sem cadastrar um por um.

---

### 5.3 PRIORIDADE BAIXA (Futuro / Phase 3+)

#### J. Timeline Visual de Temporadas (estilo Gantt)

**Inspiração:** UzzOPS tem Gantt com múltiplas timelines (gantt_stages, gantt_tasks, gantt_milestones).

**Adaptação:** Visualização de temporadas do grupo em timeline — quando cada temporada começa/termina, partidas planejadas, marcos (torneios, confraternizações).

#### K. Roadmap de Peladas

**Inspiração:** UzzOPS tem roadmaps de produto com itens planejados.

**Adaptação:** "Planejamento de temporada" — o admin pode planejar visualmente quantas peladas serão feitas, em quais datas, com metas (ex: "jogar 20 vezes este semestre").

---

## 6. O QUE CONVOCA TEM QUE UZZOPS NÃO TEM

```mermaid
graph TD
    subgraph SoConvoca["Só no Convoca ✅"]
        BILLING["Stripe Billing\nAssinaturas por grupo"]
        RSVP["RSVP com Waitlist\nautomático"]
        DRAW["Sorteio de Times\naleatório + configurável"]
        SWAP["Swap de Jogadores"]
        CHECKIN["Check-in com\nordem de chegada"]
        CRON["Cron Jobs\n(mensalistas + recorrência)"]
        MVP_TIE["MVP Tiebreaker\ncom votação de desempate"]
        SEASONS["Temporadas com\nsnapshots de ranking"]
        RECUR["Peladas Recorrentes\n(weekly/biweekly/monthly)"]
        SCORING["Scoring Configurável\npor grupo"]
        ADMIN["Admin Panel\n(system_admin)"]
    end
```

Estes módulos são **diferenciais exclusivos do Convoca** — nativos do domínio de peladas. O UzzOPS não tem e não precisaria ter.

---

## 7. DIAGRAMA DE CONVERGÊNCIA TÉCNICA

```mermaid
flowchart LR
    subgraph UzzOPS_Tech["Stack UzzOPS"]
        RQ5["React Query 5"]
        RHF["React Hook Form"]
        RECHARTS["Recharts"]
        DNDKIT["@dnd-kit"]
        XYFLOW["@xyflow/react"]
        XLSX["xlsx + jszip"]
        SUPABASE_RLS["Supabase RLS"]
        MULTITENANT["Multi-tenancy"]
    end

    subgraph Decision["Decisão de Adoção"]
        ADOPT["✅ Adotar"]
        ADAPT["🔄 Adaptar ideia"]
        SKIP["❌ Não aplicável"]
    end

    subgraph Convoca_Roadmap["Roadmap Convoca (pós-convergência)"]
        C_RQ["React Query\nRSVP / Check-in / Voting UI"]
        C_RHF["React Hook Form\nFormulários de grupo/evento"]
        C_CHARTS["Recharts\nRankings + Stats visuais"]
        C_DND["@dnd-kit\nSorteio visual drag-drop"]
        C_XLSX["xlsx\nExport financeiro"]
        C_RULES["Regras do Grupo\n(ADR adaptado)"]
        C_RETRO["Retrospectiva pós-jogo\n(retro adaptada)"]
    end

    RQ5 --> ADOPT --> C_RQ
    RHF --> ADOPT --> C_RHF
    RECHARTS --> ADOPT --> C_CHARTS
    DNDKIT --> ADOPT --> C_DND
    XLSX --> ADOPT --> C_XLSX
    XYFLOW --> SKIP
    SUPABASE_RLS --> ADAPT --> C_RULES
    MULTITENANT --> SKIP
```

---

## 8. ROADMAP DE IMPLEMENTAÇÃO (Priorizado)

```mermaid
gantt
    title Roadmap de Convergência UzzOPS → Convoca
    dateFormat  YYYY-MM-DD
    section Infra / DX
        Instalar React Query 5           :a1, 2026-04-12, 3d
        Query Provider + hooks base      :a2, after a1, 5d
        Instalar React Hook Form         :a3, after a1, 2d
    section UX de Dados
        Hooks RSVP/check-in com RQ       :b1, after a2, 4d
        Hooks voting/ratings com RQ      :b2, after b1, 3d
        Formulários com RHF              :b3, after a3, 5d
    section Visualização
        Instalar Recharts                :c1, 2026-04-20, 2d
        Gráfico ranking por temporada    :c2, after c1, 4d
        Gráfico stats individuais        :c3, after c2, 3d
        Gráfico financeiro (cobranças)   :c4, after c3, 3d
    section Interação
        Instalar @dnd-kit                :d1, 2026-05-01, 2d
        Interface sorteio drag-drop      :d2, after d1, 7d
    section Features Novas
        Export xlsx financeiro           :e1, 2026-05-10, 3d
        Regras do Grupo                  :e2, after e1, 4d
        Análise pós-jogo (Retrospectiva) :e3, after e2, 5d
        Import jogadores (CSV)           :e4, after e3, 4d
```

---

## 9. RESUMO EXECUTIVO

```mermaid
pie title O que cada app pode aprender do outro
    "UzzOPS → Convoca: React Query (UX fluida)" : 25
    "UzzOPS → Convoca: Recharts (analytics visual)" : 20
    "UzzOPS → Convoca: @dnd-kit (sorteio drag-drop)" : 15
    "UzzOPS → Convoca: React Hook Form (formulários)" : 15
    "UzzOPS → Convoca: Conceitos (retro, decision log)" : 15
    "Convoca → UzzOPS: Stripe Billing" : 10
```

### TL;DR

| | Convoca | UzzOPS |
|---|---|---|
| **Domínio** | Gestão de peladas | Gestão de projetos Scrum |
| **Ponto forte** | Billing, Cron, Sorteio, Recorrências | UX rica, React Query, Gráficos, DnD |
| **Gap maior** | Sem React Query, sem gráficos, sem DnD | Sem billing, sem cron jobs |
| **Stack compartilhada** | Next.js, React 19, TypeScript, Tailwind, shadcn/ui, Zod, Zustand, pnpm |
| **O que migrar** | React Query + Recharts + @dnd-kit + React Hook Form | Stripe + Cron patterns |
| **O que NÃO migrar** | Multi-tenancy (desnecessário), @xyflow (sem caso de uso) | — |

---

*Comparativo gerado por reverse engineering em 2026-04-11.*
