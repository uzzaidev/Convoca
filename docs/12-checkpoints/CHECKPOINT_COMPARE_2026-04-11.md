# COMPARATIVO VISUAL — Convoca App (2026-04-11)

> Comparação entre o que o **CLAUDE.md documenta** vs o que o **código realmente implementa**,  
> com diagramas Mermaid para visualização da arquitetura real.

---

## 1. STACK — CLAUDE.md vs Código Real

```mermaid
quadrantChart
    title Stack: Documentado vs Real
    x-axis "Não documentado" --> "Documentado no CLAUDE.md"
    y-axis "Não implementado" --> "Implementado no código"

    quadrant-1 "✅ Documentado e implementado"
    quadrant-2 "⚡ Implementado, mas não documentado"
    quadrant-3 "💤 Nem documentado, nem feito"
    quadrant-4 "📄 Documentado mas não feito"

    NextAuth v5: [0.8, 0.95]
    Neon PostgreSQL: [0.85, 0.95]
    Tailwind CSS: [0.85, 0.95]
    shadcn/ui: [0.8, 0.9]
    Zustand: [0.8, 0.9]
    Pino Logger: [0.8, 0.9]
    Zod: [0.75, 0.9]
    Stripe Billing: [0.1, 0.95]
    Resend Email: [0.1, 0.9]
    Admin Panel: [0.05, 0.9]
    Smart Draw: [0.7, 0.05]
    Push Notifications: [0.7, 0.05]
    Real-time Scoreboard: [0.6, 0.05]
    MVP Tiebreaker: [0.1, 0.88]
    Seasons: [0.2, 0.88]
```

---

## 2. ARQUITETURA GERAL DO SISTEMA

```mermaid
graph TB
    subgraph Client["Frontend (Next.js 16 App Router)"]
        Landing["/ Landing Page"]
        Auth["Auth Pages\nsignin / signup / reset"]
        Dashboard["/dashboard"]
        Groups["/groups/[groupId]"]
        Events["/groups/[groupId]/events/[eventId]"]
        Payments["/groups/[groupId]/payments"]
        Admin["/admin (system_admin)"]
        Profile["/profile"]
    end

    subgraph API["API Routes (61 endpoints)"]
        AuthAPI["auth/*\nsignup, forgot, reset"]
        GroupsAPI["groups/*\nCRUD + members + invites\n+ charges + expenses\n+ seasons + recurrences"]
        EventsAPI["events/*\nCRUD + rsvp + draw\n+ teams + actions + ratings"]
        StripeAPI["stripe/*\ncheckout + portal\n+ subscription + webhook"]
        AdminAPI["admin/*\ngroups + plans\n+ coupons + subscriptions"]
        UsersAPI["users/*\nme + search"]
        CronAPI["cron/*\nmonthly-charges\nrecurring-events"]
    end

    subgraph Infra["Infraestrutura"]
        Neon[("Neon\nPostgreSQL")]
        Stripe["Stripe\nPayments"]
        Resend["Resend\nEmail"]
        Vercel["Vercel\nDeploy + Cron"]
    end

    Client --> API
    API --> Neon
    StripeAPI --> Stripe
    AuthAPI --> Resend
    Vercel -->|"schedule"| CronAPI
```

---

## 3. MODELO DE DADOS — ENTIDADES E RELACIONAMENTOS

```mermaid
erDiagram
    users {
        uuid id PK
        varchar name
        varchar email
        varchar system_role
        text password_hash
        varchar stripe_customer_id
        timestamp password_reset_expires
    }

    groups {
        uuid id PK
        varchar name
        varchar privacy
        varchar status
        uuid created_by FK
        timestamp deleted_at
    }

    group_members {
        uuid id PK
        uuid user_id FK
        uuid group_id FK
        varchar role
        boolean is_goalkeeper
        integer base_rating
        boolean is_mensalista
    }

    events {
        uuid id PK
        uuid group_id FK
        timestamp starts_at
        uuid venue_id FK
        integer max_players
        varchar status
        uuid recurrence_id FK
        timestamp list_opens_at
    }

    event_attendance {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        varchar status
        timestamp checked_in_at
        integer order_of_arrival
    }

    teams {
        uuid id PK
        uuid event_id FK
        varchar name
        boolean is_winner
    }

    team_members {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        varchar position
    }

    event_actions {
        uuid id PK
        uuid event_id FK
        uuid actor_user_id FK
        varchar action_type
        uuid team_id FK
    }

    player_ratings {
        uuid id PK
        uuid event_id FK
        uuid rater_user_id FK
        uuid rated_user_id FK
        integer score
    }

    seasons {
        uuid id PK
        uuid group_id FK
        varchar name
        varchar status
        timestamp starts_at
        timestamp ends_at
    }

    group_subscriptions {
        uuid id PK
        uuid group_id FK
        varchar stripe_subscription_id
        varchar status
        uuid plan_id FK
    }

    subscription_plans {
        uuid id PK
        varchar name
        varchar stripe_price_id
        integer amount_cents
        varchar interval
        boolean is_active
    }

    charges {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        uuid event_id FK
        varchar type
        varchar status
        integer amount_cents
    }

    users ||--o{ group_members : "participa"
    groups ||--o{ group_members : "tem"
    groups ||--o{ events : "hospeda"
    events ||--o{ event_attendance : "tem"
    events ||--o{ teams : "gera"
    teams ||--o{ team_members : "contém"
    users ||--o{ team_members : "joga em"
    events ||--o{ event_actions : "registra"
    events ||--o{ player_ratings : "avalia"
    groups ||--o{ seasons : "tem"
    groups ||--o{ group_subscriptions : "assina"
    subscription_plans ||--o{ group_subscriptions : "define"
    groups ||--o{ charges : "gera"
```

---

## 4. FLUXO DE AUTENTICAÇÃO E ACESSO

```mermaid
flowchart TD
    A["Requisição HTTP"] --> B{{"Rota pública?\n/ ou /simple-test"}}
    B -->|Sim| C["Retorna direto"]
    B -->|Não| D{{"Rota de Auth?\n/auth/*"}}
    D -->|Sim| E["Retorna página de auth"]
    D -->|Não| F{{"JWT válido?"}}
    F -->|Não| G["Redireciona para /auth/signin"]
    F -->|Sim| H{{"API Route?"}}
    H -->|Sim| I["requireAuth() no handler"]
    H -->|Não| J["Server Component\ngetCurrentUser()"]
    I --> K{{"system_admin\nnecessário?"}}
    K -->|Sim| L{{"system_role = system_admin?"}}
    L -->|Não| M["403 Forbidden"]
    L -->|Sim| N["✅ Acesso concedido"]
    K -->|Não| N
    J --> N
```

---

## 5. FLUXO COMPLETO DE BILLING (STRIPE)

```mermaid
sequenceDiagram
    actor User
    participant App
    participant StripeAPI as Stripe API
    participant DB as Neon DB
    participant Webhook

    User->>App: Cria grupo
    App->>DB: INSERT group (status: pending_payment)
    App->>User: Redireciona para checkout

    User->>App: POST /api/stripe/checkout
    App->>StripeAPI: createCheckoutSession(price_id, trial=7d)
    StripeAPI-->>App: session.url
    App-->>User: Redireciona para Stripe Checkout

    User->>StripeAPI: Preenche cartão + confirma
    StripeAPI->>Webhook: checkout.session.completed
    Webhook->>DB: INSERT group_subscriptions
    Webhook->>DB: UPDATE groups SET status = 'active'

    StripeAPI->>Webhook: invoice.payment_failed
    Webhook->>DB: UPDATE groups SET status = 'inactive'

    User->>App: POST /api/stripe/portal
    App->>StripeAPI: createPortalSession
    StripeAPI-->>User: Portal de autoatendimento
```

---

## 6. FLUXO DE EVENTO: DO RSVP AO SORTEIO

```mermaid
stateDiagram-v2
    [*] --> Agendado: Admin cria evento

    Agendado --> Aberto: list_opens_at atingido
    note right of Aberto: Jogadores confirmam presença

    Aberto --> AguardandoCheckin: Todos confirmaram
    note right of AguardandoCheckin: Admin abre check-in físico

    AguardandoCheckin --> Sorteio: Admin aciona draw
    note right of Sorteio: Só jogadores com check-in

    Sorteio --> EmJogo: Times criados
    note right of EmJogo: Gols/assistências registrados

    EmJogo --> Votacao: Admin encerra partida
    note right of Votacao: Jogadores votam no MVP

    Votacao --> Empate: Tie detectado
    Empate --> Votacao: Nova rodada de votos
    Empate --> Encerrado: Admin decide

    Votacao --> Encerrado: Votação finalizada
    Encerrado --> [*]
```

---

## 7. COMPARATIVO CLAUDE.md vs REALIDADE — STATUS POR MÓDULO

```mermaid
xychart-beta
    title "Módulos: Documentado no CLAUDE.md (azul) vs Implementado no código (verde)"
    x-axis ["Auth", "Grupos", "Eventos", "RSVP", "Sorteio", "Ações", "Votação", "Rankings", "Financeiro", "Billing", "Admin", "Temporadas", "Recorrências", "Tiebreaker", "PushNotif", "SmartDraw"]
    y-axis "Status (1=Não / 2=Parcial / 3=Completo)" 0 --> 3
    bar [3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 1, 1, 1, 1, 1, 1]
    line [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1]
```

> **Legenda:** Barras = documentado no CLAUDE.md | Linha = implementado no código  
> 1 = não presente | 2 = parcialmente | 3 = completo

---

## 8. MAPA DE DEPENDÊNCIAS CRÍTICAS

```mermaid
graph LR
    subgraph Core
        NextJS["Next.js 16.1.1"]
        React["React 19"]
        TS["TypeScript 5"]
    end

    subgraph Data
        Postgres["postgres 3.4.8\n(Neon driver)"]
        Neon[("Neon PostgreSQL")]
    end

    subgraph Auth
        NextAuth["next-auth 5 beta"]
        PGAdapter["@auth/pg-adapter"]
        Bcrypt["bcryptjs"]
    end

    subgraph Payments
        Stripe["stripe 21.0.1"]
    end

    subgraph Email
        Resend["resend 6.9.3"]
    end

    subgraph UI
        Radix["Radix UI primitives\n(shadcn/ui)"]
        Tailwind["Tailwind CSS 3.4"]
        TanTable["TanStack Table 8"]
        Lucide["lucide-react"]
    end

    subgraph State
        Zustand["Zustand 5"]
        Zod["Zod 3"]
    end

    subgraph Infra
        Pino["Pino 9\n(logging)"]
        DateFns["date-fns 4"]
        jsPDF["jspdf 3"]
    end

    NextJS --> React
    NextJS --> TS
    NextJS --> Postgres
    NextJS --> NextAuth
    NextAuth --> PGAdapter
    PGAdapter --> Postgres
    Postgres --> Neon
    NextJS --> Stripe
    NextJS --> Resend
    NextJS --> Radix
    NextJS --> Zustand
    NextJS --> Pino
```

---

## 9. ARQUITETURA DE COMPONENTES (FRONTEND)

```mermaid
graph TD
    subgraph Pages["Pages (Server Components por padrão)"]
        LP["/ Landing"]
        DB["Dashboard"]
        GP["Group Page"]
        EP["Event Page"]
        PP["Payments Page"]
        AP["Admin Page"]
    end

    subgraph Providers["Providers (Client)"]
        AuthProv["AuthProvider\n(NextAuth Session)"]
        Toaster["Toaster\n(shadcn Toast)"]
    end

    subgraph Components
        subgraph Layout
            Header["Header/Nav"]
        end
        subgraph GroupComps["Group Components"]
            GroupList["GroupList"]
            GroupCard["GroupCard"]
            MemberList["MemberList"]
            InviteManager["InviteManager"]
        end
        subgraph EventComps["Event Components"]
            RSVPPanel["RSVPPanel"]
            DrawPanel["DrawPanel"]
            TeamView["TeamView"]
            ActionLog["ActionLog"]
            VotingPanel["VotingPanel"]
        end
        subgraph PaymentComps["Payment Components"]
            BillingStatus["BillingStatus"]
            ChargesTable["ChargesTable"]
            ExpenseList["ExpenseList"]
        end
        subgraph AdminComps["Admin Components"]
            GroupsAdmin["GroupsAdmin"]
            PlansAdmin["PlansAdmin"]
            CouponsAdmin["CouponsAdmin"]
        end
        UI["shadcn/ui\n(Button, Dialog, Table,\nCard, Select, etc.)"]
    end

    Pages --> Providers
    Pages --> Components
    Components --> UI
    AuthProv --> Pages
```

---

## 10. RESUMO EXECUTIVO

```mermaid
pie title Módulos por Status de Implementação (Código Real)
    "Implementado ✅" : 14
    "Não iniciado ❌" : 4
```

```mermaid
pie title Cobertura do CLAUDE.md vs Código Real
    "Documentado e implementado" : 8
    "Implementado mas NÃO documentado" : 6
    "Documentado mas NÃO implementado" : 3
    "Nem documentado nem feito" : 1
```

---

### Conclusão

O projeto **Convoca** está **significativamente mais avançado** do que o `CLAUDE.md` descreve.

Os módulos de **Billing (Stripe)**, **Admin Panel**, **Temporadas**, **Recorrências**, **MVP Tiebreaker** e **Scoring configurável** estão todos implementados e funcionando, mas não estão documentados no CLAUDE.md.

O arquivo CLAUDE.md precisa ser atualizado para refletir o estado real do MVP, que está **bem além do "Phase 1"** original.

---

*Comparativo gerado por reverse engineering em 2026-04-11.*
