# Peladeiros App

App para gestão de peladas de futebol - criação de grupos, organização de partidas, sorteio de times, estatísticas e rankings.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Neon (Postgres Serverless)
- **Auth**: Stack Auth (Neon Auth) + Zustand
- **Deploy**: Vercel

## Setup

> **🔧 Resolvendo Problemas**:
> - **Erro 403 ao fazer login?** Veja [SOLUCAO_ERRO_LOGIN.md](./SOLUCAO_ERRO_LOGIN.md) para resolver
> - **Configurar Stack Auth?** Veja [STACK_AUTH_DASHBOARD_CONFIG.md](./STACK_AUTH_DASHBOARD_CONFIG.md)
> - **Erro 404 no Vercel?** Veja [FIX_404_PERSISTENTE.md](./FIX_404_PERSISTENTE.md) para a solução completa
> - **Guia Rápido**: [QUICK_FIX_GUIDE.md](./QUICK_FIX_GUIDE.md)
> - **Primeira Correção**: [VERCEL_FIX.md](./VERCEL_FIX.md)

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

Execute o arquivo SQL de migrations no Neon Console ou via CLI:

```bash
# Opção 1: Copie o conteúdo de src/db/schema.sql e execute no Neon Console
# Opção 2: Use o Neon CLI
neon sql < src/db/schema.sql
```

### 5. Configurar Stack Auth (Neon Auth)

A autenticação é fornecida pelo Stack Auth, integrado com o Neon Database.

**Variáveis necessárias** (já configuradas no `.env`):
- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`

Veja o guia completo em [STACK_AUTH_GUIDE.md](./STACK_AUTH_GUIDE.md)

### 6. Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Auth pages (Stack Auth)
│   ├── dashboard/         # Dashboard
│   └── groups/            # Grupos e eventos
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── providers/        # React providers (Stack Auth)
├── db/                    # Database
│   ├── schema.sql        # SQL schema
│   └── client.ts         # Neon client
└── lib/                   # Utilities
    ├── stack.ts          # Stack Auth (server)
    ├── stack-client.ts   # Stack Auth (client)
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
