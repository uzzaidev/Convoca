# Convoca App

App para gestão de peladas de futebol - criação de grupos, organização de partidas, sorteio de times, estatísticas e rankings.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Neon (Postgres Serverless)
- **Auth**: NextAuth v5 (Auth.js) com credenciais
- **Deploy**: Vercel2

## Setup

> **🔧 Documentação Importante**:
> - **Autenticação**: Veja [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md) para o guia completo
> - **Migração do Banco**: Veja [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)
> - **Documentação antiga**: Arquivos com prefixo `DEPRECATED_` são mantidos apenas para referência

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

As migrations ficam em `src/db/migrations/` e devem ser aplicadas pelo runner do
projeto, que registra o historico em `public.schema_migrations`.

```bash
pnpm db:status
pnpm db:migrate -- --only 20260512_add_group_app_mode.sql
```

Use `--only <arquivo>.sql` para aplicar uma migration nova especifica. Nao use
`--all` sem preparar um baseline, porque o projeto tem migrations antigas que
foram criadas antes da tabela de historico.

O runner le `.env.local` e usa `POSTGRES_URL_NON_POOLING` quando disponivel,
com fallback para `POSTGRES_URL` ou `DATABASE_URL`.

**Importante:** Se voce esta migrando de uma versao anterior com Stack Auth, veja [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md).

### 5. Configurar NextAuth

A autenticação usa NextAuth v5 (Auth.js) com autenticação por credenciais (email e senha).

**Variáveis necessárias** (adicionar no `.env.local`):
- `NEXTAUTH_URL=http://localhost:3000`
- `AUTH_SECRET=` (gerar com `openssl rand -base64 32`) - NextAuth v5 recomendado
  - Ou `NEXTAUTH_SECRET=` para compatibilidade

Veja o guia completo em [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)

### 6. Criar usuário inicial

Para criar seu primeiro usuário, acesse:

```
http://localhost:3000/auth/signup
```

Ou use a API diretamente (veja [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md) para detalhes).

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

### Fase 2 - Realtime (6-10 semanas)
- [ ] Placar ao vivo
- [ ] Notificações push
- [ ] Sorteio inteligente
- [ ] Financeiro/carteira

### Fase 3 - Pro (8-12 semanas)
- [ ] Assinaturas
- [ ] Estatísticas avançadas
- [ ] Gamificação
- [ ] Social features
