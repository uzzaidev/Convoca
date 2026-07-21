# Plano de Onboarding — Convoca

> v2 — revisado em 2026-07-17 com base em duas rodadas de auditoria de código e análise crítica.  
> Toda afirmação tem evidência de arquivo:linha. Pronto para execução em ordem.

---

## Princípio guia

O onboarding não é uma tela de boas-vindas. É a distância entre o usuário chegar e o usuário entender que o produto funciona. No Convoca, esse momento é: **primeiro sorteio de times realizado com a galera certa dentro do grupo certo.**

---

## Estado atual comprovado

| o que existe | evidência |
|---|---|
| Auth next-auth v5, credentials | `src/lib/auth.ts` |
| Papéis de grupo: `admin`, `member` | `src/lib/group-access.ts:68` |
| Papel de sistema: `system_admin` (1 usuário hard-coded) | `src/lib/auth-helpers.ts:62`, migration |
| **Grupos novos entram em status `pending`** — admin fica bloqueado | `src/lib/group-status.ts:4`, `src/components/groups/group-status-notice.tsx` |
| Analytics Firebase GA4 com 7 eventos, 3 com dados errados | `src/lib/mobile/analytics.ts` |
| Agente IA reativo, invisível no mobile sidebar | `src/components/agent/FloatingAgentBubble.tsx:20` |
| 12 estados vazios identificados, 10 sem CTA acionável | inventário abaixo |
| Nenhuma biblioteca de onboarding instalada | `package.json` |
| Nenhum campo de onboarding no banco | auditoria de migrations |

**Insight das screenshots (94 telas capturadas, conta real):** 3 dos 4 grupos da conta de produção têm 0 eventos. Admins criam o grupo e não avançam para criar a primeira pelada. Esse é o ponto de abandono principal — não a tela de signup.

---

## Hierarquia de escopo do progresso

Antes de implementar checklist ou tour, definir em qual escopo cada orientação pertence. Sem isso, o usuário recebe o mesmo tutorial em cada grupo novo.

| escopo | o que pertence aqui | onde persiste | exemplo |
|---|---|---|---|
| **usuário** | navegação, agente existe, primeiros passos globais | `users` (campo futuro) ou localStorage | "Você tem um assistente — toque no ícone verde" |
| **papel** | o que admin pode fazer vs member | `users` por role detectada | "Como admin, você pode criar peladas" |
| **grupo** | checklist de configuração daquele grupo | `group_members` ou tabela futura | "Configure este grupo: adicionar jogadores, criar pelada" |
| **evento** | instrução de partida ao vivo | `event_attendance` ou localStorage por event_id | "Registre gols em Ao Vivo" |

Regra: orientação de escopo **usuário** aparece 1 vez total. Orientação de escopo **grupo** aparece 1 vez por grupo. Orientação de escopo **evento** aparece 1 vez por evento ou 1 vez global.

---

## P0A — Bloqueios funcionais (executar antes de medir qualquer coisa)

### P0A.1 — Código de convite perdido no signup/signin

**Classificação:** bug de conversão confirmado  
**Evidências:**
- `src/app/invite/[code]/page.tsx:126` — `href="/auth/signin"` sem parâmetros
- `src/app/auth/signin/page.tsx:37` — `router.push("/dashboard")` hardcoded
- `src/app/auth/signup/page.tsx:69` — redirect para `/auth/signin` sem parâmetros
- zero uso de localStorage/sessionStorage/cookie para preservar o code

**Fluxo atual (quebrado):**
```
/invite/ABC123
  → "Entrar pelo navegador"
  → /auth/signin           ← code perdido aqui
  → /dashboard             ← não entrou no grupo
```

**Fluxo corrigido:**
```
/invite/ABC123
  → /auth/signin?callbackUrl=%2Fgroups%2Fjoin%3Fcode%3DABC123
  → login bem-sucedido → ler callbackUrl
  → /groups/join?code=ABC123  ← formulário pré-preenchido
  → /groups/[id]
```

**Implementação:**
1. `invite/[code]/page.tsx:126` — montar URL com `encodeURIComponent`
2. `signin/page.tsx:37` — ler `searchParams.callbackUrl`, validar, redirecionar
3. `signup/page.tsx:69` — encadear callbackUrl para o redirect ao signin

**Proteção obrigatória contra open redirect** (nomes de caminho maliciosos como `https://evil.com` ou `//evil.com`):
```typescript
const SAFE_PREFIXES = ['/groups/', '/events/', '/dashboard', '/profile'];
function isSafeCallback(url: string): boolean {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return false;
  return SAFE_PREFIXES.some(p => url.startsWith(p));
}
```

**Testes mínimos antes de fechar:**
- usuário já cadastrado abre `/invite/CODE` → entra no grupo direto ✓
- usuário novo abre `/invite/CODE` → cria conta → entra no grupo sem redigitar código ✓
- `/invite/CODE` expirado → mensagem correta, não loop ✓
- usuário já membro do grupo → mensagem "já membro" ✓
- callbackUrl externo malicioso → ignorado, vai para `/dashboard` ✓
- Capacitor (WebView): link de convite recebido no WhatsApp → abre app → entra no grupo ✓

**Esforço:** ~1h  
**Métrica:** `invite_join_completed.had_code_prefilled = true` aumenta após o fix

---

### P0A.2 — `create_charge` sem proteção contra duplicata

**Evidência:** `src/lib/agent/tools/write-finance.ts` — INSERT direto sem idempotency key  
**Risco:** admin confirma criação de cobrança via agente, agente resubmite → cobrança duplicada sem detecção  

**Solução:** idempotency key, não unique constraint de campos comerciais  
*Motivo da rejeição do constraint:* `(group_id, user_id, description, due_date)` bloquearia cobranças legítimas com mesma descrição e data — ex: duas mensalidades no mesmo mês para dois motivos diferentes.

**Implementação:**
1. Migration: adicionar `idempotency_key TEXT UNIQUE` em `charges`
2. Tool: gerar `agent_request_id` no início do request e passar como idempotency_key
3. Handler: ao receber a mesma key, retornar a cobrança existente sem inserir novamente

**Esforço:** ~2h (migration + ajuste no tool)

---

### P0A.3 — Status `pending` bloqueia admin sem orientação clara ← **ponto ausente no feedback**

**Este é o maior bloqueio de ativação confirmado pelo código e pelas screenshots.**

Fluxo real do admin hoje:
```
Cria conta
  → Cria grupo
  → Status: pending (aguarda aprovação manual do system_admin)
  → GroupStatusNotice mostra mensagem passiva
  → Admin não pode criar evento, não pode convidar ninguém
  → Abandona
```

**Evidências:**
- `src/lib/group-status.ts:4` — status `pending` bloqueia tudo
- `src/lib/group-access.ts:158–163` — grupos não-active são bloqueados para todos exceto system_admin
- `src/components/groups/group-status-notice.tsx` — exibe aviso, sem ação sugerida
- Screenshots: grupos da conta de produção sem eventos = admin criou grupo mas não saiu do estado inicial

**O que fazer:**  
O `GroupStatusNotice` deve, enquanto o grupo está pending:
1. Explicar que a aprovação é necessária (com tempo estimado)
2. Sugerir ações que o admin pode fazer AGORA: configurar convites, definir configurações, preparar a página do grupo
3. Oferecer link direto para configurações

Isso não corrige o fluxo de aprovação — mas elimina o estado de "estou travado sem saber por quê".

**Esforço:** ~30min (só componente, sem banco)

---

## P0B — Instrumentação baseline

### Eventos com erros confirmados

| evento atual | problema | arquivo:linha | correção |
|---|---|---|---|
| `sign_up_started` | dispara em todo pageload, sem distinção de intenção | `signup/page.tsx:19` | substituir por funil de 4 eventos (abaixo) |
| `player_invited` | propriedade `group_member_count` passa `invites.length` | `invites-manager.tsx:96` | definir o que a prop representa (veja abaixo) |
| `pelada_created` | hardcoda `has_venue=false`, `is_recurring=false` | `create-group-form.tsx:65–67` | ler valores reais do form |
| `trackSubscriptionStarted` | exportada, zero call sites | `analytics.ts:175` | substituir por 3 eventos semânticos (abaixo) |

**`player_invited` — clarificação de propriedade obrigatória antes de corrigir:**  
A propriedade deve representar uma das três opções, e a semântica importa:
- `invited_count` — quantas pessoas foram convidadas nessa ação específica (provavelmente 1 por convite gerado)
- `group_member_count` — total de membros do grupo após a ação
- `pending_invite_count` — total de convites ainda não usados

Decisão de produto necessária antes de implementar. Se a intenção é medir tamanho do grupo, usar `group_member_count` real (query do banco no momento do evento). Se é medir ação de convite, usar `invited_count: 1`.

### Contrato de tracking revisado

**Funil de signup (4 eventos, não 1):**
```
sign_up_page_viewed     → página carregou (useEffect mount)
sign_up_form_started    → primeiro campo alterado (onChange)
sign_up_submitted       → formulário enviado (submit)
sign_up_completed       → HTTP 200 recebido (conta criada)
sign_up_failed          → HTTP 4xx/5xx (erro na criação)

arquivo: src/app/auth/signup/page.tsx
dedup sign_up_page_viewed: flag sessionStorage antes de disparar
privacy: nenhum campo do formulário nos eventos
```

**Convite (2 eventos separados por momento):**
```
invite_page_viewed
  → dispara ao montar o componente (page.tsx:~linha 60, após render inicial)
  → required: { invite_code_length: number }  ← não o code em claro
  → optional: { group_member_count: number }  ← da query SQL se válido

invite_validation_completed
  → dispara após o SQL retornar resultado
  → required: { valid: boolean }
  → optional: { invalid_reason: "expired" | "not_found" | "max_uses_reached" | "group_inactive" }
  → privacy: não registrar o code

invite_join_completed
  → após HTTP 200 em /api/groups/join
  → required: { had_code_prefilled: boolean, source: "invite_page" | "join_form" | "agent" }
  → dedup: group_id + user_id + session
```

**RSVP (nome correto):**
```
event_rsvp_updated                           ← não "match_cancelled"
  → trigger: event-rsvp-form.tsx, após HTTP 200
  → required: { rsvp_status: "yes" | "no" | "waitlist", is_goalkeeper: boolean }
  → optional: { source: "event_page" | "dashboard" | "agent", hours_before_event: number }
  → dedup: event_id + user_id + status (não reativar se status não mudou)

"match_cancelled" deve ser reservado para o admin cancelar a partida de fato.
```

**Sorteio:**
```
team_draw_completed
  → trigger: team-draw-button.tsx, após HTTP 200
  → required: { player_count: number, team_count: number, has_goalkeepers: boolean }
  → success_or_failure: success
```

**Assinatura (3 eventos, não 1):**
```
subscription_checkout_started
  → trigger: payment-button.tsx:35 (antes do redirect Stripe)
  → required: { plan_name, trial_days }

subscription_checkout_completed
  → trigger: webhook Stripe (server) ou redirect de retorno
  → required: { plan_name, is_trial: boolean }
  → fonte confiável: webhook (não redirect, que pode ser bloqueado)

subscription_checkout_failed
  → trigger: webhook Stripe com status failure
  → required: { plan_name, failure_reason }
```

**Agente — funil de descoberta (sem o qual não sabemos nada sobre uso real):**
```
agent_entrypoint_viewed    → FloatingAgentBubble montado e visível (desktop)
agent_opened               → usuário clica para abrir o chat
agent_message_sent         → mensagem enviada
agent_tool_proposed        → agente propõe uma ação (tool call)
agent_tool_confirmed       → usuário confirma a ação
agent_tool_completed       → ação executada com sucesso
agent_tool_failed          → ação falhou

privacy: NUNCA registrar conteúdo de mensagem
required em todos: { group_role: "admin" | "member" }
```

**Por que esse funil importa:** `agent_message_sent` sozinho não distingue usuário que não vê o agente / vê mas não abre / abre mas não envia / envia mas não resolve. Precisamos dos 7 eventos para saber onde o funil quebra.

**O que nunca deve ser enviado:**
- Conteúdo de mensagens ao agente
- Código de convite em claro
- `group_name`, `player_name`, email ou qualquer PII
- Valores monetários individuais

---

## P1 — 12 estados vazios por papel

> Implementáveis sem biblioteca. Edições cirúrgicas em componentes existentes.

A contagem "12 estados" refere-se a:

| # | componente | arquivo | condição |
|---|---|---|---|
| 1 | Sem grupos (dashboard) | `dashboard/groups-card.tsx:56` | `groups.length === 0` |
| 2 | Sem eventos próximos (dashboard) | `dashboard/upcoming-events-card.tsx:37` | `events.length === 0` |
| 3 | Sem eventos no grupo | `group/upcoming-events-card.tsx:75` | `events.length === 0` |
| 4 | Ranking geral vazio | `group/rankings-card.tsx:519` | `generalRanking.length === 0` |
| 5 | Artilheiros vazios | `group/rankings-card.tsx:971` | `scorersData.length === 0` |
| 6 | Assistências vazias | `group/rankings-card.tsx:1008` | `assistersData.length === 0` |
| 7 | Goleiros vazios | `group/rankings-card.tsx:1050` | `goalkeepersData.length === 0` |
| 8 | Frequência vazia | `group/frequency-card.tsx:33` | `playerFrequency.length === 0` |
| 9 | Sem times sorteados | `events/teams-tab.tsx:145` | `teams.length === 0` |
| 10 | Timeline sem ações | `events/match-timeline.tsx:143` | `enrichedActions.length === 0` |
| 11 | Stats sem dados | `events/stats-tab.tsx:151` | `actions.length === 0` |
| 12 | Invites (estado implícito) | `groups/invites-manager.tsx` | lista vazia sem mensagem |

### Textos propostos por papel

| # | estado | admin | member |
|---|---|---|---|
| 1 | Sem grupos | "Crie seu primeiro grupo ou entre com um código de convite." | "Use o código de convite recebido para entrar em um grupo." |
| 2 | Sem eventos (dashboard) | "Crie uma pelada para o grupo começar." | "Aguardando o admin criar a próxima pelada." |
| 3 | Sem eventos no grupo | "Nenhuma pelada agendada. Crie a primeira." | "Aguardando admin criar a próxima partida." |
| 4 | Ranking vazio | "O ranking aparece após a primeira pelada finalizada." | idem |
| 5 | Artilheiros vazios | "Registre gols no modo Ao Vivo para ver artilheiros." | "Nenhum gol registrado ainda." |
| 6 | Assistências vazias | "Registre assistências no modo Ao Vivo." | "Nenhuma assistência registrada ainda." |
| 7 | Goleiros vazios | "Cadastre goleiros nas configurações e registre partidas." | "Nenhum goleiro com jogos registrados." |
| 8 | Frequência vazia | "Dados de frequência aparecem após a primeira pelada finalizada." | idem |
| 9 | Sem sorteio | texto já existe + "Confirme os check-ins antes de sortear." | "Aguardando o admin sortear os times." |
| 10 | Timeline sem ações | "Use o Painel de Ações para registrar gols, assistências e cartões." | "Aguardando o admin registrar as ações da partida." |
| 11 | Stats sem dados | "Registre ações durante a partida para ver as estatísticas." | idem |
| 12 | Sem convites | "Crie um convite e compartilhe com a galera pelo WhatsApp." | N/A (admin only) |

**Regra para CTA:** só mostrar CTA que o papel atual pode executar. Admin no estado 9 (sem sorteio) pode ver botão "Sortear" — member não.

**Ordem de implementação sugerida dentro de P1:** 1 e 2 (maior impacto, dashboard), depois 3 e 9 (jornada de evento), depois os demais.

---

## P1.5 — Instrumentar descoberta do agente (sem torná-lo proativo)

Antes de qualquer decisão sobre agente proativo, coletar dados com `agent_entrypoint_viewed` + `agent_opened`. Sem esses eventos, não sabemos se o problema é visibilidade, utilidade ou ambos.

**Esforço:** ~30min (adicionar evento em `FloatingAgentBubble.tsx` e no handler de abertura do chat mobile)

---

## P2 — Spike de biblioteca de tour (em paralelo à coleta de dados P0B)

O spike não bloqueia P0A nem P1. Pode rodar em paralelo enquanto os eventos de P0B acumulam dados.

**Testar obrigatoriamente em Capacitor WebView (iOS), não só no Chrome:**

| requisito | Radix resolve | código próprio | biblioteca |
|---|---|---|---|
| Tooltip simples | ✅ (`react-tooltip` instalado) | — | — |
| Dialog de boas-vindas | ✅ (`react-dialog` instalado) | — | — |
| Store de progresso entre rotas | ✅ (zustand instalado) | — | — |
| Safe areas iOS | ✅ (CSS `env(safe-area-inset-*)`) | — | — |
| Spotlight (escurecer + recortar elemento) | ❌ | spike SVG clip-path | alternativa |
| Tooltip ancorado em elemento dinâmico | ❌ | `getBoundingClientRect` | alternativa |
| Elemento dentro de Dialog existente | ❌ | não trivial | necessária |
| Teclado mobile aberto (viewport resize) | ❌ | `visualViewport.onresize` | alternativa |

**Atenção de contraste:** a paleta do Convoca usa verde intenso em CTAs e cabeçalhos. Hotspot verde sobre fundo verde some visualmente. O spike deve testar contraste em fundo claro, fundo escuro e card verde. Não definir cor de hotspot antes do spike.

**Candidatas:**
- `driver.js` ~15KB gz — leve, spotlight nativo, sem dep React (precisa `dynamic import` no SSR)
- `react-joyride` ~40KB gz — madura, React nativo, ARIA completo

**Decisão:** baseada no spike em WebView, não em preferência teórica.

---

## P3 — Primeira experiência guiada

**Pré-requisito:** dados de P0B com critério de volume, não de calendário.

**Critério de volume mínimo antes de P3:**
- ≥ 50 jornadas de convite rastreadas (`invite_page_viewed`)
- ≥ 30 novos organizadores com grupo criado (`pelada_created`)
- ≥ 20 sorteios rastreados (`team_draw_completed`)

Duas semanas com 5 usuários não produz evidência. Dois dias com 200 podem.

**Jornada admin (baseada no funil real de abandono que os dados irão revelar):**
```
Criar grupo → [P0A.3: explicar pending] → Convidar jogadores → Criar pelada → Confirmar presenças → Sortear
```

**Jornada member:**
```
Abrir convite → [P0A.1: entrar no grupo] → Confirmar presença → Ver times
```

Não definir sequência de passos antes de ter dados de abandono de P0B.

---

## P4 — Checklist por grupo

**Pré-requisito:** P3 validado + definição de escopo (seção de hierarquia acima)

O checklist deve ter escopo `grupo`: cada grupo tem seu próprio progresso.

```
Configure este grupo — 0 de 5

○ Adicionar ou convidar jogadores    ← admin only
○ Criar a primeira pelada            ← admin only
○ Receber pelo menos 4 confirmações  ← estado automático
○ Realizar o primeiro sorteio        ← admin only
○ Registrar o resultado              ← admin only
```

Persistência: campo `onboarding_progress JSONB` em `group_members` (por membro + grupo) ou tabela dedicada. Decisão de schema antes de implementar.

---

## P5 — Orientação contextual

**Pré-requisito:** dados reais de onde usuários param (P0B + P3), não hipótese.

Não definir quais são os pontos confusos antes de ter os dados. Hotspots nos 2–3 pontos com maior taxa de abandono identificada pelos eventos.

---

## O que não implementar até ter dados

| item | motivo |
|---|---|
| Tour completo com spotlight | falta spike + dados de abandono |
| Agente proativo | `create_charge` ainda tem bug; agente não sabe rota atual; sem baseline de uso |
| Engine compartilhado `packages/uzzai-onboarding` | prematuro antes de validar no Convoca |
| Onboarding de campeonatos | módulo novo, fluxo principal ainda não instrumentado |
| Evento único oficial de ativação | escolher antes dos dados distorce decisões futuras |

---

## Roadmap de execução

```
P0A.1  Corrigir fluxo convite → signup → join            ~1h
P0A.2  Idempotency key em create_charge                   ~2h
P0A.3  GroupStatusNotice com orientação em pending        ~30min

P0B    Funil signup (4 eventos)                           ~1h
       Contrato de tracking completo implementado         ~2h
       Correção player_invited (após decisão semântica)   ~15min
       Funil agente (7 eventos)                           ~1h

P1     12 estados vazios com texto por papel              ~1 dia
P1.5   Instrumentar descoberta do agente                  ~30min

P2     Spike de biblioteca (paralelo a P0B/P1)            ~1 dia

P3     Primeira experiência (após critério de volume)     a definir
P4     Checklist por grupo                                a definir
P5     Orientação contextual                              a definir
```

**Critério para avançar de P1 para P3:** atingir volume mínimo de eventos definido acima + spike P2 concluído com decisão de biblioteca.

---

## Decisões abertas (não bloqueia P0A nem P0B)

| decisão | bloqueada por |
|---|---|
| Propriedade de `player_invited` | definição de produto: o que a métrica representa |
| `set_my_rsvp` sem confirmação — intencional? | decisão de produto |
| Biblioteca de tour | resultado do spike P2 |
| Agente proativo vs onboarding determinístico | dados de P0B + uso do agente |
| Schema de persistência de checklist | decisão de P4 |

---

*v2 — 2026-07-17. Próxima revisão após critério de volume P0B atingido.*
