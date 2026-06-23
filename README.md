# Convoca App

App para gestão de peladas de futebol - criação de grupos, organização de partidas, sorteio de times, estatísticas e rankings.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Neon (Postgres Serverless) via lib `postgres` (raw SQL, sem ORM)
- **Auth**: NextAuth v5 (Auth.js) com credenciais
- **Deploy**: Vercel

## Setup

> **Documentação relacionada**:
> - **Workflow de banco**: [src/db/README.md](./src/db/README.md) e [src/db/MIGRATION_WORKFLOW.md](./src/db/MIGRATION_WORKFLOW.md)
> - **Convenções para agentes/IDE**: [CLAUDE.md](./CLAUDE.md), [.github/copilot-instructions.md](./.github/copilot-instructions.md), [AGENTS.md](./AGENTS.md)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Neon Database (via Vercel Integration)

1. Faça deploy inicial na Vercel
2. No dashboard da Vercel, vá em **Integrations**
3. Adicione a integração **Neon**
4. Isso vai criar automaticamente:
   - Um database no Neon
   - A variável `DATABASE_URL` no Vercel
   - Pull das env vars para desenvolvimento local

### 3. Pull das variáveis de ambiente

```bash
npx vercel env pull
```

Isso vai criar um arquivo `.env.local` com as variáveis do Vercel.

### 4. Rodar migrations

As migrations ficam em `src/db/migrations/` e são aplicadas pelo runner do
projeto, que registra o histórico em `public.schema_migrations`.

```bash
pnpm db:status                                       # lista pendentes + aplicadas
pnpm db:migrate -- --only 20260512_add_group_app_mode.sql
pnpm backup                                          # dump local em src/db/backups/
```

Use `--only <arquivo>.sql` para aplicar uma migration nova específica (preferido
por traceability). O baseline foi feito em 2026-05 — todas as migrations
existentes já estão registradas em `schema_migrations`.

Detalhes completos em [src/db/MIGRATION_WORKFLOW.md](./src/db/MIGRATION_WORKFLOW.md).

### 5. Configurar NextAuth

A autenticação usa NextAuth v5 (Auth.js) com credenciais (email e senha).

**Variáveis necessárias** (no `.env.local`):
- `NEXTAUTH_URL=http://localhost:3000`
- `AUTH_SECRET=` (gerar com `openssl rand -base64 32`)
  - Ou `NEXTAUTH_SECRET=` para compatibilidade

### 6. Criar usuário inicial

Acesse `http://localhost:3000/auth/signup` para criar a primeira conta.

### 7. Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── auth/          # Auth API (signup, NextAuth handler)
│   ├── auth/              # Auth pages (signin, signup)
│   ├── dashboard/         # Dashboard
│   └── groups/            # Grupos e eventos
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components (header, etc)
│   └── providers/        # React providers (SessionProvider)
├── db/                    # Database
│   ├── schema.sql        # SQL schema
│   └── client.ts         # Neon client
└── lib/                   # Utilities
    ├── auth.ts           # NextAuth configuration
    ├── auth-helpers.ts   # Auth helpers para APIs
    ├── stores/           # Zustand stores
    └── utils.ts          # Helpers
```

## Roadmap

### Fase 1 - MVP (6-8 semanas)
- ✅ Setup do projeto
- ✅ CRUD de grupos e eventos
- ✅ Sistema de RSVP
- ✅ Sorteio de times
- ✅ Registro de gols/assistências
- ✅ Rankings básicos

### Mobile (Capacitor)
- ✅ Android na Play Store (em análise)
- ✅ iOS TestFlight — login NextAuth + push FCM (v2.0.0 build 5, 2026-06-22)
- [ ] Deep links + App Store iOS

> **Playbook iOS (CI sem Mac, falhas e fixes):** [docs/playbooks/ios-ci-sem-mac/README.md](./docs/playbooks/ios-ci-sem-mac/README.md) — inclui cronologia F1–F10 (login, push, Vercel, pod install, crash ao abrir).
>
> **Checklist mobile:** [docs/mobile-convoca/CHECKLIST.md](./docs/mobile-convoca/CHECKLIST.md)

### Fase 2 - Realtime (6-10 semanas)
- [ ] Placar ao vivo
- [x] Notificações push (iOS TestFlight + backend FCM; Android via Play Store)
- [ ] Sorteio inteligente
- [ ] Financeiro/carteira

### Fase 3 - Pro (8-12 semanas)
- [ ] Assinaturas
- [ ] Estatísticas avançadas
- [ ] Gamificação
- [ ] Social features
