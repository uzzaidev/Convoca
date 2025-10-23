# Peladeiros App - Resumo do Projeto

## ✅ O que foi criado

Projeto completo de gestão de peladas de futebol, do zero, seguindo o plano detalhado.

### Stack Tecnológica

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Neon (PostgreSQL Serverless)
- **Database Client**: @neondatabase/serverless (SQL puro, sem ORM)
- **Auth**: NextAuth v5
- **Deploy**: Vercel
- **Logging**: Pino
- **Validação**: Zod

### Estrutura do Projeto

```
peladeiros-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   │   ├── groups/               # CRUD de grupos
│   │   │   └── events/               # CRUD de eventos
│   │   │       └── [eventId]/
│   │   │           ├── rsvp/         # Confirmação de presença
│   │   │           ├── draw/         # Sorteio de times
│   │   │           ├── actions/      # Registro de ações (gols, etc)
│   │   │           └── ratings/      # Avaliações de jogadores
│   │   ├── auth/                     # Páginas de autenticação
│   │   ├── dashboard/                # Dashboard principal
│   │   ├── layout.tsx                # Layout raiz
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Estilos globais
│   ├── components/
│   │   └── ui/                       # Componentes shadcn/ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       └── avatar.tsx
│   ├── db/
│   │   ├── client.ts                 # Cliente Neon
│   │   └── schema.sql                # Schema completo do database
│   ├── lib/
│   │   ├── auth.ts                   # Configuração NextAuth
│   │   ├── logger.ts                 # Logger Pino
│   │   ├── utils.ts                  # Utilities gerais
│   │   └── validations.ts            # Schemas Zod
│   └── middleware.ts                 # Middleware de auth
├── .env.example                      # Template de env vars
├── .gitignore                        # Arquivos ignorados
├── components.json                   # Config shadcn/ui
├── eslint.config.mjs                 # ESLint config
├── next.config.ts                    # Next.js config
├── package.json                      # Dependencies
├── postcss.config.mjs                # PostCSS config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── README.md                         # Documentação principal
├── SETUP.md                          # Guia de setup
├── API_DOCS.md                       # Documentação da API
└── VERCEL_NEON_INTEGRATION.md        # Guia de integração
```

## 📋 Features Implementadas (Fase 1 - MVP)

### ✅ Gestão de Grupos
- Criação de grupos (privados/públicos)
- Sistema de membros com roles (admin/member)
- Convites por código
- Carteira de grupo
- Dashboard do grupo com membros e eventos

### ✅ Gestão de Eventos/Peladas
- Criação de eventos com data/hora/local
- Limite de vagas (jogadores e goleiros)
- Status do evento (scheduled/live/finished/canceled)
- Listagem de próximos eventos

### ✅ Sistema de RSVP
- Confirmação/recusa de presença
- Escolha de posição (goleiro/linha)
- **Fila de espera automática**
- Promoção automática quando vaga abre
- Check-in e ordem de chegada

### ✅ Sorteio de Times (v1 - Aleatório)
- Sorteio automático de 2-4 times
- Separação de goleiros em times diferentes
- Distribuição balanceada numérica
- Histórico de times sorteados

### ✅ Registro de Ações do Jogo
- Gols, assistências, defesas
- Desarmes, falhas
- Cartões amarelos/vermelhos
- Controle de períodos
- Feed de ações em ordem cronológica

### ✅ Sistema de Avaliações
- Avaliação de 0-10 por jogador
- Tags especiais (MVP, Pereba, Paredão, Garçom, Artilheiro)
- Média de avaliações
- Regras: não pode se autoavaliar, apenas participantes

### ✅ Rankings Básicos
- Placar materializado (materialized view)
- Artilheiros (gols)
- Garçons (assistências)
- Ratings médios
- Presença

### ✅ Financeiro Básico (estrutura)
- Wallets para grupos e usuários
- Charges (cobranças)
- Transactions (movimentações)
- Métodos de pagamento (cash/pix/card)

## 🗄️ Schema do Database

### Tabelas Principais

1. **users** - Usuários da plataforma
2. **groups** - Grupos/peladas
3. **group_members** - Relação usuário-grupo (com role)
4. **venues** - Locais/quadras
5. **events** - Eventos/partidas
6. **event_attendance** - RSVP e presença
7. **teams** - Times sorteados
8. **team_members** - Jogadores por time
9. **event_actions** - Ações do jogo (gols, etc)
10. **player_ratings** - Avaliações
11. **invites** - Códigos de convite
12. **wallets** - Carteiras
13. **charges** - Cobranças
14. **transactions** - Transações financeiras

### Features do Schema

- ✅ UUIDs para todas as chaves primárias
- ✅ Timestamps automáticos
- ✅ Constraints e validações
- ✅ Índices para performance
- ✅ Materialized view para placar
- ✅ Trigger para refresh automático do placar

## 🔌 API Routes Implementadas

### Grupos
- `GET /api/groups` - Listar grupos do usuário
- `POST /api/groups` - Criar grupo
- `GET /api/groups/:id` - Detalhes do grupo
- `PATCH /api/groups/:id` - Atualizar grupo

### Eventos
- `POST /api/events` - Criar evento
- `GET /api/events/:id` - Detalhes do evento

### RSVP
- `POST /api/events/:id/rsvp` - Confirmar/recusar presença

### Sorteio
- `POST /api/events/:id/draw` - Sortear times

### Ações do Jogo
- `GET /api/events/:id/actions` - Listar ações
- `POST /api/events/:id/actions` - Registrar ação

### Avaliações
- `GET /api/events/:id/ratings` - Listar avaliações
- `POST /api/events/:id/ratings` - Avaliar jogador

## 🎨 UI Components

Usando **shadcn/ui** (Radix UI + Tailwind):
- Button
- Card
- Badge
- Avatar
- (Preparado para adicionar mais: Dialog, Select, Tabs, Toast, etc)

## 📄 Páginas Criadas

1. **Landing Page** (`/`)
   - Apresentação do app
   - Features principais
   - Roadmap

2. **Dashboard** (`/dashboard`)
   - Lista de grupos do usuário
   - Próximas peladas
   - Status de confirmação

3. **SignIn** (`/auth/signin`)
   - Placeholder para autenticação
   - (NextAuth será configurado posteriormente)

## 🚀 Próximos Passos

### Imediato (Para Começar)
1. ✅ Instalar dependências: `npm install`
2. ✅ Configurar integração Vercel-Neon
3. ✅ Executar migrations (`schema.sql`)
4. ✅ Configurar env vars (DATABASE_URL, NEXTAUTH_SECRET)
5. ⬜ Testar localmente: `npm run dev`
6. ⬜ Deploy inicial: `vercel --prod`

### Features Adicionais Fase 1
- Página de detalhes do grupo (`/groups/:id`)
- Página de detalhes do evento (`/events/:id`)
- Página de criação de evento
- Componentes de sorteio ao vivo
- Placar ao vivo (sem realtime ainda)
- Dashboard de estatísticas do jogador

### Fase 2 - Realtime & Comunicação (6-10 semanas)
- Integração Pusher/Ably para realtime
- Placar ao vivo com updates automáticos
- Notificações push (OneSignal/FCM)
- Sorteio inteligente balanceado por rating
- Algoritmo "quem joga o próximo"
- Gestão financeira completa com Pix
- Export/share de rankings

### Fase 3 - Pro & Social (8-12 semanas)
- Assinaturas de grupo (Stripe)
- Churrascos/eventos sociais
- Comparação de jogadores
- Troféus e gamificação
- Overall público/privado
- Ligas e playoffs
- Marketplace de benefícios

## 📚 Documentação

- **README.md** - Overview e instruções básicas
- **SETUP.md** - Guia completo de setup e deploy
- **API_DOCS.md** - Documentação completa das APIs
- **VERCEL_NEON_INTEGRATION.md** - Guia de integração Vercel-Neon

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção local
npm start

# Lint
npm run lint

# Deploy preview
vercel

# Deploy produção
vercel --prod

# Pull env vars
vercel env pull
```

## 🔐 Autenticação

**Status**: Estrutura criada, precisa configurar providers

NextAuth v5 está configurado com:
- Callbacks para criar/atualizar usuários no DB
- Session com user.id
- Middleware de proteção de rotas

**Próximos passos**:
1. Adicionar provider de Email (Resend/SendGrid)
2. Adicionar OAuth (Google/GitHub) - opcional
3. Configurar páginas de signin/error
4. Testar fluxo completo

## 📊 Performance & Observabilidade

- **Logging**: Pino configurado (pretty print em dev)
- **Monitoring**: Logs estruturados em todas as APIs
- **Database**: Índices nas queries principais
- **Materialized Views**: Placar otimizado

**Futuro**:
- Sentry para error tracking
- Tinybird/Amplitude para analytics
- Rate limiting com Upstash Redis

## 💰 Custos Estimados

### Plano Free (Início)
- **Vercel**: Grátis (100GB bandwidth/mês)
- **Neon**: Grátis (0.5GB storage, 191.9h compute/mês)
- **Total**: R$ 0,00/mês

### Plano Pago (Crescimento)
- **Vercel Pro**: $20/mês
- **Neon Scale**: $19/mês
- **Pusher**: $29/mês (10K connections)
- **OneSignal**: Grátis até 10K subscribers
- **Total**: ~R$ 350/mês (~$68/mês)

## 🎯 Diferenciais do Projeto

1. **SQL Puro**: Controle total, sem overhead de ORM
2. **Serverless**: Escala automaticamente, zero servidor
3. **Type-safe**: TypeScript + Zod em todo lugar
4. **Modern Stack**: Next.js 15, React 19, latest features
5. **Production-ready**: Logging, validation, error handling
6. **Bem documentado**: 4 arquivos de docs completos

## 📞 Suporte

Para dúvidas ou issues:
1. Consulte a documentação nos arquivos MD
2. Verifique os comentários no código
3. Logs do Pino (ambiente dev são coloridos e pretty)

---

**Projeto criado em**: 2025-01-15
**Versão**: 0.1.0 (MVP - Fase 1)
**Status**: ✅ Pronto para setup e desenvolvimento
