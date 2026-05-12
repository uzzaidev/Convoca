# CHECKPOINT DE DOCUMENTAÇÃO — Convoca App

**Data:** 2026-04-11
**Versão do Projeto:** 0.1.0
**Branch:** main
**Último Commit:** `f0e7852` — feat: add universal project checkpoint documentation
**Método:** Reverse engineering a partir do código-fonte (fonte de verdade: código + migrations SQL)

---

## 1. STACK DETECTADA

```yaml
stack_detection:
  tipo_projeto: fullstack
  linguagem_principal: TypeScript
  framework_principal: Next.js 16.1.1 (App Router + React Server Components)
  react: 19.2.0
  package_manager: pnpm@10.18.1
  database:
    provider: Neon PostgreSQL (Serverless)
    client: "@neondatabase/serverless + postgres@3.4.8"
    orm: NENHUM (raw SQL com template literals)
  auth: NextAuth v5 (beta.25) — Credentials Provider (email/senha)
  auth_adapter: "@auth/pg-adapter"
  payments: Stripe v21.0.1
  email: Resend v6.9.3
  logging: Pino v9.5.0
  state: Zustand v5.0.8
  ui: shadcn/ui (Radix UI primitives)
  styling: Tailwind CSS v3.4.1
  validation: Zod v3.24.1
  tables: TanStack React Table v8.21.3
  export: jspdf v3.0.4 + jspdf-autotable
  build_tool: Next.js Webpack (--webpack flag)
  deploy: Vercel
  secrets_local: Doppler (script dev:doppler)
```

---

## 2. ESTRUTURA DE DIRETÓRIOS

```
convoca-app/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page pública
│   │   ├── dashboard/page.tsx          # Dashboard principal
│   │   ├── profile/page.tsx            # Perfil do usuário
│   │   ├── admin/page.tsx              # Painel admin (system_admin)
│   │   ├── simple-test/page.tsx        # Página de teste
│   │   ├── auth/
│   │   │   ├── signin/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── error/page.tsx
│   │   ├── groups/
│   │   │   ├── new/page.tsx
│   │   │   ├── join/page.tsx
│   │   │   └── [groupId]/
│   │   │       ├── page.tsx            # Detalhe do grupo
│   │   │       ├── settings/page.tsx
│   │   │       ├── payments/page.tsx
│   │   │       └── events/
│   │   │           ├── new/page.tsx
│   │   │           └── [eventId]/page.tsx
│   │   ├── events/
│   │   │   └── [eventId]/page.tsx      # Visualização de evento
│   │   └── api/                        # 61 route.ts (API Routes)
│   │       ├── auth/                   # signup, forgot-password, reset-password
│   │       ├── admin/                  # groups, plans, coupons, subscriptions, stripe-dashboard
│   │       ├── groups/                 # CRUD + invites + members + billing + charges + expenses
│   │       │   └── [groupId]/         # rankings, stats, seasons, recurrences, scoring-config
│   │       ├── events/                 # CRUD + rsvp + draw + teams + actions + ratings
│   │       │   └── [eventId]/         # admin-rsvp, tiebreaker, swap
│   │       ├── stripe/                 # checkout, portal, subscription, webhook
│   │       ├── cron/                   # generate-monthly-charges, generate-recurring-events
│   │       ├── users/                  # me, search, pending-charges-count
│   │       ├── plans/                  # listagem pública de planos
│   │       └── debug/
│   ├── components/
│   │   ├── ui/                         # shadcn/ui (Radix UI)
│   │   ├── layout/                     # Headers, navigation
│   │   ├── dashboard/                  # Componentes do dashboard
│   │   ├── groups/                     # Componentes de grupos
│   │   ├── group/                      # Componentes de grupo individual
│   │   ├── events/                     # Componentes de eventos
│   │   ├── payments/                   # Componentes de pagamento
│   │   ├── seasons/                    # Componentes de temporadas
│   │   ├── admin/                      # Componentes administrativos
│   │   ├── profile/                    # Componentes de perfil
│   │   └── providers/                  # React providers (AuthProvider)
│   ├── db/
│   │   ├── client.ts                   # Neon client export
│   │   ├── migrations/                 # ~20 arquivos SQL
│   │   │   ├── schema.sql              # Schema completo (fonte de verdade)
│   │   │   ├── 005_stripe_subscriptions.sql
│   │   │   ├── 006_subscription_plans.sql
│   │   │   ├── add-seasons-and-own-goal.sql
│   │   │   ├── add_mvp_tiebreaker.sql
│   │   │   ├── 20260315_add_recurrences_expenses_columns.sql
│   │   │   └── 20260324_add_system_admin_group_status.sql
│   │   └── backups/
│   ├── lib/
│   │   ├── auth.ts                     # NextAuth config
│   │   ├── auth-helpers.ts             # getCurrentUser, requireAuth
│   │   ├── stripe.ts                   # Stripe client singleton
│   │   ├── subscription.ts             # Lógica de assinatura
│   │   ├── email.ts                    # Resend email (password reset)
│   │   ├── logger.ts                   # Pino logger
│   │   ├── utils.ts                    # Utilitários gerais
│   │   ├── event-access.ts             # Controle de acesso a eventos
│   │   ├── group-access.ts             # Controle de acesso a grupos
│   │   ├── group-status.ts             # Lógica de status de grupo
│   │   ├── rate-limit.ts               # Rate limiting
│   │   ├── route-errors.ts             # Padronização de erros de API
│   │   ├── validations.ts              # Zod schemas principais
│   │   ├── validations-charges.ts      # Zod schemas financeiros
│   │   ├── validations-params.ts       # Validação de parâmetros de rota
│   │   └── stores/
│   │       └── auth-store.ts           # Zustand store
│   └── types/                          # TypeScript types
├── docs/                               # Documentação extensiva
├── .brv/context-tree/                  # Contexto de arquitetura (BRV)
├── .github/                            # Workflows CI, scripts
├── backups/                            # Backups SQL
└── public/                             # Assets estáticos
```

**Métricas de código:**
| Métrica | Valor |
|---|---|
| Arquivos TypeScript/TSX (src/) | 172 |
| Componentes React (.tsx em components/) | 72 |
| API Routes (route.ts) | 61 |
| Migrations SQL | ~20 arquivos |

---

## 3. BANCO DE DADOS — SCHEMA COMPLETO

### Tabelas Implementadas (verificado em schema.sql + migrations)

| Tabela | Propósito | Relações Chave |
|---|---|---|
| `users` | Contas de usuário | — |
| `groups` | Grupos de pelada | created_by → users |
| `group_members` | Membros + roles | user_id, group_id |
| `venues` | Quadras/locais | group_id |
| `event_recurrences` | Peladas recorrentes | group_id, venue_id |
| `events` | Partidas agendadas | group_id, venue_id, recurrence_id |
| `event_attendance` | RSVP + check-in | event_id, user_id |
| `teams` | Times sorteados | event_id |
| `team_members` | Jogadores nos times | team_id, user_id |
| `event_actions` | Gols, assistências, cartões | event_id, actor_user_id |
| `player_ratings` | Avaliações pós-jogo | event_id, rater_user_id, rated_user_id |
| `invites` | Códigos de convite | group_id |
| `wallets` | Carteiras (grupo/user) | owner_id polimórfico |
| `charges` | Cobranças (mensalidade, diária, multa) | group_id, user_id, event_id |
| `expenses` | Despesas do grupo | group_id |
| `draw_configs` | Configuração de sorteio | group_id (unique) |
| `event_settings` | Configurações de evento padrão | group_id (unique) |
| `scoring_configs` | Pontuação do ranking | group_id (unique) |
| `seasons` | Temporadas do grupo | group_id |
| `season_snapshots` | Ranking ao fechar temporada | season_id, user_id |
| `group_subscriptions` | Assinaturas Stripe por grupo | group_id, stripe_subscription_id |
| `subscription_plans` | Planos disponíveis | stripe_price_id |
| `mvp_tiebreakers` | Desempate de votação MVP | event_id |
| `mvp_tiebreaker_votes` | Votos no desempate | tiebreaker_id, voter_user_id |

### Campos relevantes adicionados via migrations (beyond schema.sql)

- `users.stripe_customer_id` — migration 005
- `users.password_reset_token`, `users.password_reset_expires` — migration 20260211
- `group_subscriptions.plan_id`, `.stripe_price_id` — migration 006
- `groups.status` estendido: `'pending_payment'` — migration 005, `'rejected'` — migration 20260324
- `event_actions.action_type` estendido: `'own_goal'` — migration add-seasons
- `event_recurrences` — recorrências de eventos com colunas extras na migration 20260315

---

## 4. MÓDULOS FUNCIONAIS

### 4.1 Autenticação (✅ Implementado)
- Signup com hash bcrypt (10 rounds)
- Signin (credentials)
- Sessão JWT (30 dias)
- Password reset via email (Resend)
- Middleware de proteção de rotas

### 4.2 Grupos (✅ Implementado)
- CRUD completo de grupos
- Roles: `admin` | `member`
- Status do grupo: `pending` | `pending_payment` | `active` | `inactive` | `rejected`
- Soft delete (`deleted_at`)
- Sistema de convites por código
- Configurações de evento padrão por grupo
- Configuração de sorteio por grupo
- Configuração de pontuação por grupo

### 4.3 Eventos / Peladas (✅ Implementado)
- CRUD de eventos
- RSVP com lista de espera automática (`yes` | `no` | `waitlist` | `dm`)
- Check-in com ordem de chegada
- Admin RSVP (admin gerencia presença de outros)
- Status: `scheduled` | `live` | `finished` | `canceled`
- Abertura automática de lista (`list_opens_at`)

### 4.4 Sorteio de Times (✅ Implementado)
- Sorteio aleatório com separação de goleiros
- Suporte a seed para reprodutibilidade
- Posições: `gk` | `defender` | `midfielder` | `forward` | `line`
- Troca de jogadores entre times (swap)
- Configurável: jogadores/time, reservas, quantidade por posição

### 4.5 Ações de Jogo (✅ Implementado)
- Tipos: `goal`, `assist`, `save`, `tackle`, `error`, `yellow_card`, `red_card`, `period_start`, `period_end`, `own_goal`
- Vinculado a evento, jogador e time

### 4.6 Avaliações / MVP Voting (✅ Implementado)
- Sistema de votos entre jogadores pós-partida
- Desempate automático via `mvp_tiebreakers`
- Modos: votação coletiva ou decisão admin
- Finalização de votação com status

### 4.7 Rankings e Estatísticas (✅ Implementado)
- Rankings configuráveis: modo `standard` (V/E/D) e `complete` (com gols, MVP)
- Stats do grupo e stats individuais do usuário
- Pontuação configurável por grupo (`scoring_configs`)

### 4.8 Temporadas (✅ Implementado)
- Criação e encerramento de temporadas por grupo
- Snapshots de ranking ao encerrar temporada
- Status: `upcoming` | `active` | `finished`

### 4.9 Recorrências (✅ Implementado)
- Peladas recorrentes: `weekly` | `biweekly` | `monthly`
- Geração automática via cron (`/api/cron/generate-recurring-events`)
- Configurável: dia da semana, horário, local, limites de jogadores

### 4.10 Financeiro (✅ Implementado)
- Cobranças por tipo: `monthly` | `daily` | `fine` | `other`
- Geração automática de cobranças mensais (`/api/cron/generate-monthly-charges`)
- Despesas do grupo por categoria: `venue_rental` | `equipment` | `referee` | `other`
- Carteiras (wallets) para grupo e usuário
- Dashboard financeiro via `/groups/[groupId]/payments`

### 4.11 Billing / Stripe (✅ Implementado — além do CLAUDE.md)
- Assinaturas Stripe por grupo
- Planos de assinatura (`subscription_plans`)
- Fluxo: Checkout → Webhook → Ativação do grupo
- Portal do cliente Stripe
- Trial de 7 dias
- Coupons (via API admin)
- Dashboard Stripe para admin

### 4.12 Admin (✅ Implementado — além do CLAUDE.md)
- Gestão de grupos (aprovar, rejeitar, ativar, inativar)
- Gestão de planos de assinatura
- Gestão de coupons
- Gestão de assinaturas
- Acesso ao Stripe Dashboard
- Controle via `system_role = 'system_admin'`

### 4.13 Busca de Usuários (✅ Implementado)
- `/api/users/search` — busca por email ou nome

### 4.14 Perfil de Usuário (✅ Implementado)
- `/api/users/me` — dados do usuário autenticado
- `/api/users/me/pending-charges-count` — cobranças pendentes

---

## 5. API ENDPOINTS — MAPA COMPLETO

### Auth
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/signup` | Cadastro |
| POST | `/api/auth/forgot-password` | Solicitar reset |
| POST | `/api/auth/reset-password` | Confirmar reset |
| ALL | `/api/auth/[...nextauth]` | NextAuth handler |

### Groups
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/api/groups` | Listar/criar grupo |
| GET/PATCH/DELETE | `/api/groups/[groupId]` | CRUD grupo |
| POST | `/api/groups/join` | Entrar com código |
| GET | `/api/groups/[groupId]/members` | Listar membros |
| POST | `/api/groups/[groupId]/members/create-user` | Criar e adicionar |
| PATCH/DELETE | `/api/groups/[groupId]/members/[userId]` | Gerenciar membro |
| GET/POST | `/api/groups/[groupId]/invites` | Convites |
| DELETE | `/api/groups/[groupId]/invites/[inviteId]` | Deletar convite |
| GET/PATCH | `/api/groups/[groupId]/draw-config` | Config de sorteio |
| GET/PATCH | `/api/groups/[groupId]/event-settings` | Config de evento |
| GET/PATCH | `/api/groups/[groupId]/scoring-config` | Config de pontuação |
| GET | `/api/groups/[groupId]/stats` | Estatísticas do grupo |
| GET | `/api/groups/[groupId]/my-stats` | Stats do usuário no grupo |
| GET | `/api/groups/[groupId]/rankings` | Ranking |
| GET/POST | `/api/groups/[groupId]/charges` | Cobranças |
| GET/PATCH/DELETE | `/api/groups/[groupId]/charges/[chargeId]` | Cobrança individual |
| GET/POST | `/api/groups/[groupId]/expenses` | Despesas |
| GET/PATCH/DELETE | `/api/groups/[groupId]/expenses/[expenseId]` | Despesa individual |
| GET/POST | `/api/groups/[groupId]/seasons` | Temporadas |
| GET/PATCH | `/api/groups/[groupId]/seasons/[seasonId]` | Temporada individual |
| POST | `/api/groups/[groupId]/seasons/[seasonId]/finish` | Encerrar temporada |
| GET/POST | `/api/groups/[groupId]/recurrences` | Recorrências |
| GET/PATCH/DELETE | `/api/groups/[groupId]/recurrences/[recurrenceId]` | Recorrência individual |
| GET | `/api/groups/[groupId]/billing` | Status de billing |

### Events
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/api/events` | Listar/criar evento |
| GET/PATCH/DELETE | `/api/events/[eventId]` | CRUD evento |
| POST | `/api/events/[eventId]/rsvp` | RSVP do usuário |
| POST | `/api/events/[eventId]/admin-rsvp` | Admin gerencia RSVP |
| POST | `/api/events/[eventId]/draw` | Sortear times |
| GET | `/api/events/[eventId]/teams` | Times sorteados |
| GET/DELETE | `/api/events/[eventId]/teams/[teamId]` | Time individual |
| POST | `/api/events/[eventId]/teams/swap` | Trocar jogadores |
| GET/POST/DELETE | `/api/events/[eventId]/actions` | Ações de jogo |
| GET/POST | `/api/events/[eventId]/ratings` | Votação |
| POST | `/api/events/[eventId]/ratings/finalize` | Finalizar votação |
| GET | `/api/events/[eventId]/ratings/tiebreaker` | Status do desempate |
| POST | `/api/events/[eventId]/ratings/tiebreaker/vote` | Votar no desempate |
| POST | `/api/events/[eventId]/ratings/tiebreaker/decide` | Admin decide empate |

### Stripe / Billing
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/stripe/checkout` | Criar sessão de checkout |
| POST | `/api/stripe/portal` | Portal do cliente |
| GET | `/api/stripe/subscription/[groupId]` | Status da assinatura |
| POST | `/api/stripe/webhook` | Webhook do Stripe |

### Admin
| Método | Endpoint | Descrição |
|---|---|---|
| GET/PATCH/DELETE | `/api/admin/groups/[groupId]/status` | Mudar status do grupo |
| POST | `/api/admin/groups/require-payment` | Exigir pagamento |
| GET/POST | `/api/admin/plans` | Planos de assinatura |
| GET/PATCH/DELETE | `/api/admin/plans/[planId]` | Plano individual |
| GET/POST | `/api/admin/coupons` | Coupons |
| GET/PATCH/DELETE | `/api/admin/coupons/[couponId]` | Coupon individual |
| GET | `/api/admin/subscriptions` | Assinaturas ativas |
| GET | `/api/admin/stripe-dashboard` | Link do Stripe Dashboard |

### Usuários / Outros
| Método | Endpoint | Descrição |
|---|---|---|
| GET/PATCH | `/api/users/me` | Perfil do usuário |
| GET | `/api/users/me/pending-charges-count` | Cobranças pendentes |
| GET | `/api/users/search` | Buscar usuários |
| GET | `/api/plans` | Listar planos (público) |
| GET | `/api/debug` | Debug info |

### Cron Jobs
| Endpoint | Trigger | Descrição |
|---|---|---|
| `/api/cron/generate-monthly-charges` | Agendado | Gerar cobranças mensalistas |
| `/api/cron/generate-recurring-events` | Agendado | Gerar eventos recorrentes |

---

## 6. FLUXOS CRÍTICOS

### 6.1 Fluxo de Criação de Grupo + Pagamento
```
Usuário cria grupo → Status: 'pending_payment'
→ /api/stripe/checkout → Stripe Checkout Session
→ Stripe Webhook (checkout.session.completed)
→ group_subscriptions criado → Status: 'active'
```

### 6.2 Fluxo de RSVP
```
Usuário confirma presença → POST /api/events/[id]/rsvp
→ Verifica limite de jogadores/goleiros
→ Status: 'yes' | 'waitlist' (se cheio)
→ Ao cancelar: próximo da lista sobe automaticamente
→ Check-in: atualiza checked_in_at + order_of_arrival
```

### 6.3 Fluxo de Sorteio
```
Admin aciona draw → POST /api/events/[id]/draw
→ Valida: apenas jogadores com check-in
→ Separa goleiros de linha
→ Distribuição aleatória (com seed)
→ Cria teams + team_members
→ Suporta swap posterior entre times
```

### 6.4 Fluxo de Votação MVP
```
Partida encerrada → Jogadores votam nos colegas
→ POST /api/events/[id]/ratings
→ Se empate → mvp_tiebreakers criado
→ Votação de desempate OU decisão admin
→ POST /api/events/[id]/ratings/finalize
```

### 6.5 Fluxo de Recorrência
```
Admin cria event_recurrence (frequência, dia, horário)
→ Cron job executa diariamente
→ POST /api/cron/generate-recurring-events
→ Novos events criados automaticamente
→ list_opens_at calculado (X horas antes)
```

---

## 7. VARIÁVEIS DE AMBIENTE

```bash
# Database
DATABASE_URL=postgresql://...           # Neon connection string

# Auth
AUTH_SECRET=...                         # NextAuth secret (openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Email
RESEND_API_KEY=re_...

# Cron (Vercel Cron authorization)
CRON_SECRET=...
```

---

## 8. COMPARATIVO: CLAUDE.md vs CÓDIGO REAL

> Diferenças encontradas entre o que o CLAUDE.md documenta e o que o código realmente implementa.

| Feature | CLAUDE.md diz | Código real |
|---|---|---|
| Billing/Stripe | Não documentado | ✅ Completamente implementado (Stripe, subscription_plans, coupons, admin) |
| Admin panel | Não documentado | ✅ Implementado (`/admin`, `/api/admin/*`, `system_role = 'system_admin'`) |
| Temporadas | "Planned (Phase 2+)" | ✅ Implementado (seasons, season_snapshots, finish endpoint) |
| Recorrências | Não documentado | ✅ Implementado (event_recurrences + cron job) |
| MVP Tiebreaker | Não documentado | ✅ Implementado (mvp_tiebreakers, votação e decisão admin) |
| Scoring configurável | Não documentado | ✅ Implementado (scoring_configs, modos standard/complete) |
| Despesas | Não documentado | ✅ Implementado (expenses table + API) |
| Password reset | Não documentado | ✅ Implementado (Resend + tokens no DB) |
| Push notifications | "Planned (Phase 2+)" | ❌ Não implementado |
| Smart team draw | "Planned (Phase 2+)" | ❌ Não implementado (ainda aleatório) |
| Materialized View scoreboard | Documentado | ❌ Não encontrado nas migrations (possivelmente removido) |
| Voting (replaces ratings) | Documentado | ✅ player_ratings ainda existe + sistema de votos |
| Middleware protection | Documentado | ⚠️ Arquivo middleware.ts não encontrado no código atual |

---

## 9. DEPENDÊNCIAS PRINCIPAIS

```
Produção:
  next@16.1.1                  — Framework principal
  react@19.2.0                 — UI
  next-auth@5.0.0-beta.25      — Autenticação
  @auth/pg-adapter@1.7.4       — Adapter NextAuth → Postgres
  postgres@3.4.8               — Client SQL (Neon)
  stripe@21.0.1                — Pagamentos
  resend@6.9.3                 — Emails transacionais
  zod@3.24.1                   — Validação de schemas
  zustand@5.0.8                — Estado global
  pino@9.5.0                   — Logging estruturado
  bcryptjs@2.4.3               — Hash de senhas
  date-fns@4.1.0               — Manipulação de datas
  jspdf@3.0.4                  — Exportação PDF
  @tanstack/react-table@8.21.3 — Tabelas
  lucide-react@0.462.0         — Ícones
  tailwindcss@3.4.1            — Styling
  [Radix UI primitives]        — shadcn/ui base

Dev:
  typescript@5.x               — Tipagem
  eslint@9.x                   — Linting
```

---

## 10. STATUS REAL DO MVP (Fonte: código, não docs)

### ✅ Totalmente implementado
- Autenticação completa (login, signup, reset de senha)
- Grupos (CRUD, roles, invites, status workflow)
- Eventos (CRUD, RSVP, waitlist, check-in, status)
- Sorteio de times (aleatório, configurável, swap)
- Ações de jogo (gols, assistências, cartões, gol contra)
- Votação MVP com sistema de desempate
- Rankings e estatísticas (configuráveis por grupo)
- Temporadas com snapshots de ranking
- Recorrências de eventos com cron job
- Financeiro: cobranças, despesas, wallets, cron de mensalistas
- Billing: Stripe (checkout, portal, webhook, trial, coupons)
- Painel admin (grupos, planos, assinaturas, Stripe)
- Busca de usuários
- Export PDF

### ❌ Não implementado (Phase 2+)
- Push notifications
- Sorteio inteligente por nível de habilidade
- Real-time scoreboard (WebSocket/SSE)
- Analytics avançados
- App mobile nativo

---

*Checkpoint gerado por reverse engineering em 2026-04-11. Fonte de verdade: código-fonte + migrations SQL.*
