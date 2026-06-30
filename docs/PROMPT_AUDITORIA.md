# PROMPT DE AUDITORIA E MAPEAMENTO COMPLETO - CONVOCA

Você é um analista de engenharia de software + arquiteto, especialista em "reverse engineering" de aplicações a partir do código-fonte e schema de banco de dados.

**Objetivo**: gerar um CHECKPOINT de documentação completo do dia 15/03/2026 (UTC-3) do app "Convoca", baseado EXCLUSIVAMENTE no repositório atual + schema do banco de dados PostgreSQL (Neon).

**IMPORTANTE**: A documentação existente pode estar DESATUALIZADA. Use o CÓDIGO e o SCHEMA DO BANCO como fonte de verdade. Qualquer doc antiga deve ser marcada como "LEGADO/possivelmente desatualizado".

## CONTEXTO TÉCNICO CONFIRMADO (do projeto)

### Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **Frontend**: React 19.2.0, TypeScript 5, Tailwind CSS 3.4.1
- **UI**: shadcn/ui (Radix UI primitives)
- **Database**: Neon PostgreSQL Serverless (raw SQL via `postgres@3.4.8`)
- **Auth**: NextAuth v5.0.0-beta.25 (Auth.js) com credentials provider
- **Validation**: Zod 3.24.1
- **State**: Zustand 5.0.8
- **Logging**: Pino 9.5.0
- **Email**: Resend 6.9.3
- **Package Manager**: pnpm@10.18.1
- **Deployment**: Vercel

### Padrões
- Server Components por padrão
- Client Components quando necessário (`'use client'`)
- API Routes no padrão App Router
- Raw SQL (SEM ORM - regra absoluta do projeto)

### Estrutura típica (App Router)
- `src/app/` (rotas/pages/layouts)
- `src/components/` (UI components)
- `src/lib/` (utilities, auth, validations)
- `src/db/` (database client e migrations)
- Rotas: `page.tsx` (pages), `layout.tsx` (layouts), `route.ts` (API Routes)
- Rotas dinâmicas: `[groupId]`, `[eventId]`, `[chargeId]`, etc.

### MÓDULOS FUNCIONAIS (core domain)
**Principais módulos de negócio**:
1. **Authentication** - Signup, Signin, Password Reset
2. **Groups** - Criação e gerenciamento de grupos de futebol
3. **Members** - Gestão de membros (admin/member, goleiro, ratings)
4. **Events** - Criação e gestão de peladas/eventos
5. **RSVP** - Sistema de confirmação de presença (waitlist, check-in)
6. **Teams** - Sorteio de times e swaps
7. **Match** - Ações de partida (gols, assistências, cartões)
8. **Voting** - Sistema de votação pós-jogo (MVP)
9. **Rankings** - Rankings e estatísticas de jogadores
10. **Payments** - Sistema financeiro (wallets, charges, transactions)
11. **Invites** - Sistema de convites para grupos
12. **Venues** - Locais de jogo

### BANCO DE DADOS (FUNDAMENTAL)
- Schema principal em `/src/db/migrations/schema.sql`
- Backups adicionais em `/backups/` (se existirem)
- Client configurado em `/src/db/client.ts` usando `postgres` package
- **VOCÊ DEVE ANALISAR TODO o schema para entender**: tabelas, relacionamentos, constraints, indexes, functions, triggers, views, materialized views

**Tabelas principais conhecidas**:
- users, groups, group_members, events, event_attendance
- teams, team_members, event_actions, votes
- wallets, charges, transactions
- invites, venues
- mv_event_scoreboard (materialized view)

### FLUXOS DE DADOS (alvo principal)
- Autenticação via NextAuth v5 (credentials provider)
- Fluxo principal: signup → criar/juntar grupo → criar evento → RSVP → sorteio → jogo → votação → ranking
- Password reset via Resend (email)
- Sistema de cron jobs (Vercel cron) para charges mensais e eventos recorrentes

## MISSÃO (o que você deve gerar)

Você vai produzir documentação completa "como o sistema realmente funciona", para que uma outra IA consiga sugerir melhorias com contexto 100% confiável.

### Regras de ouro
- ✅ Não invente nada. Se não achar no código/schema, escreva "NÃO ENCONTRADO".
- ✅ Tudo deve ser evidenciado com: caminho do arquivo + trecho/descrição do que foi observado.
- ✅ Preferir precisão e rastreabilidade (auditoria) a textos "bonitos".
- ✅ Separar claramente: "FATO (do código)" vs "INFERÊNCIA (provável)".

## ETAPAS OBRIGATÓRIAS (não pular)

### PASSADA 1 — INVENTÁRIO (rápida e completa)

#### 1) Varredura do repositório
- Gere árvore de diretórios ignorando: `node_modules`, `.next`, `dist`, `build`, `coverage`, `.git`
- Identifique pastas-chave: `src/app`, `src/components`, `src/lib`, `src/db`, `docs/`, `backups/`
- Leia e resuma (com evidências):
  - `package.json` (dependências, scripts, versões)
  - `tsconfig.json` (config TypeScript)
  - `next.config.ts` (config Next.js)
  - `tailwind.config.ts` (config Tailwind)
  - `components.json` (config shadcn/ui)
  - Arquivos env (somente nomes de variáveis, NUNCA valores)
- Liste scripts disponíveis (dev/build/start/lint/backup)

#### 2) Inventário de rotas (App Router)
Para cada `src/app/**/page.tsx`:
- Path final (incluindo params dinâmicos como `[groupId]`, `[eventId]`)
- Objetivo da tela (inferir pelo código e componentes usados)
- Se é Server ou Client Component (`'use client'` presente?)
- Cadeia de layouts aplicados (layout.tsx ascendentes)
- Guardas/middlewares (auth check via middleware.ts ou requireAuth)
- Dependências principais (hooks, components, API calls)

Gere um **mapa de navegação**: links e transições principais (use busca por `Link`, `router.push`, `redirect`, menus etc.).

#### 3) Inventário de endpoints (API Routes)
Para cada `src/app/api/**/route.ts`:
- Métodos implementados (GET/POST/PUT/PATCH/DELETE)
- Path final (com params dinâmicos)
- **Entradas**:
  - Query params
  - Body (shape esperado)
  - Headers necessários
  - Cookies
- **Saídas**:
  - Status codes possíveis (200, 201, 400, 401, 403, 404, 500)
  - Shape do response (success/error)
- **Validações**: Zod schemas usados
- **Autenticação/Autorização**:
  - `requireAuth()` usado?
  - Check de permissões (admin, member)?
  - Verificações de ownership (user owns resource)?
- **Tabelas/recursos afetados**: quais tabelas são lidas/escritas
- **Side effects**: wallets criados, emails enviados, etc.
- **Logging**: quais operações são logadas

### PASSADA 2 — PROFUNDA (mapeamento comportamental)

#### 4) Mapear interações com Database (código)
Descubra todos pontos de uso do cliente SQL:
- `import { sql } from "@/db/client"`
- Queries: `sql\`SELECT...\``, `sql\`INSERT...\``, `sql\`UPDATE...\``, `sql\`DELETE...\``

Para cada ponto:
- Arquivo + função/handler onde ocorre
- Operação (select/insert/update/delete/function call)
- Tabela(s) afetada(s)
- Filtros aplicados (WHERE clauses)
- JOINs realizados
- Ordenação/paginação
- Tratamento de erro/retry
- **Riscos**: queries sem WHERE apropriado, N+1 queries, missing indexes

Gere DOIS catálogos:
- **A) Por ROTA/PÁGINA**: `page.tsx` ou `route.ts` → queries/mutations executadas
- **B) Por TABELA**: tabela → arquivos que a acessam (read/write)

#### 5) Banco de dados a partir de schema SQL + migrations
Leia COMPLETAMENTE:
- `src/db/migrations/schema.sql` (schema principal)
- Qualquer arquivo em `/backups/` que contenha DDL
- Arquivos em `/docs/migrations/` (migration scripts adicionais)

Extraia e documente:
- **Schema**:
  - Tabelas, colunas, tipos, nullable, defaults
  - Primary keys, foreign keys, unique constraints
  - Check constraints
  - Índices (performance implications)
- **Functions/Procedures**: RPC, stored procedures
- **Triggers**: automações de banco
- **Views**: views normais e materialized views
  - Exemplo conhecido: `mv_event_scoreboard`
- **Sequences**: auto-increment configs

**Compare migrations vs schema atual**:
- Divergências (algo em migration files que não aparece no schema principal ou vice-versa)
- Possíveis motivos (migrations incompletas, scripts manuais, rollbacks)

#### 6) Sistema de Autenticação e Autorização
Mapeie o fluxo completo de auth:

**NextAuth v5 setup**:
- Config em `src/lib/auth.ts`
- Providers configurados (credentials)
- Session strategy (JWT vs database)
- Callbacks (jwt, session, signIn, etc.)
- Páginas customizadas

**Auth helpers**:
- `src/lib/auth-helpers.ts`
- `getCurrentUser()`: como funciona?
- `requireAuth()`: como funciona? O que retorna? Como trata erros?

**Middleware**:
- `src/middleware.ts`
- Rotas públicas vs protegidas
- Redirects (signin, error, etc.)
- Matcher config

**Fluxo ponta-a-ponta**:
1. User submits credentials → onde vai?
2. Validation → como é feito?
3. Password check → bcrypt rounds?
4. Session creation → JWT payload?
5. Cookie set → nome, httpOnly, secure?
6. Middleware check → como valida?
7. API route auth → `requireAuth()` implementation
8. Error handling → 401, redirect patterns

**Password reset flow**:
- Request reset → endpoint?
- Email sending → Resend integration?
- Token generation → como? onde armazena?
- Reset confirmation → validação?

#### 7) Sistema de Permissões e Ownership
Descubra e documente:

**Roles**: admin vs member
- Como é determinado? (coluna `role` em `group_members`?)
- Onde é checado? (listar todos os pontos)

**Ownership checks**:
- User owns group?
- User is member of group?
- User can edit event?
- User can manage charges?

**Padrões de enforcement**:
- No código (if statements)
- No banco (constraints, triggers)
- Listar invariantes:
  - "Todo evento pertence a um grupo"
  - "Todo membro tem um role"
  - etc.

#### 8) Webhooks, jobs, integrações, cron jobs
Procure e documente:

**Cron jobs** (Vercel cron):
- Arquivo `vercel.json` ou config em código
- Jobs configurados:
  - Monthly charges
  - Recurring events generation
- Schedule (quando rodam?)
- Endpoints que executam
- Side effects

**Email integration** (Resend):
- Onde é usado?
- Templates de email
- Remetente/destinatário
- Tratamento de falhas

**Imports/Exports**:
- Export de dados (PDF, CSV, etc.)?
- Import de jogadores?
- Formatos e payloads

**External APIs**:
- Integração com terceiros?

#### 9) Checklist por módulo (faça para TODOS módulos encontrados)

Para cada módulo (Authentication, Groups, Events, RSVP, Teams, Match, Voting, Rankings, Payments, Invites, Venues), produza seção detalhada contendo:

- [ ] **Estrutura de rotas**
  - Pages: listar todos `page.tsx` do módulo
  - API routes: listar todos `route.ts` do módulo
  - Navegação: como usuário acessa essas páginas

- [ ] **Componentes principais**
  - Listar componentes React do módulo
  - Hierarquia (parent → children)
  - Props interfaces
  - Client vs Server

- [ ] **Hooks + estado**
  - Custom hooks usados
  - Zustand stores (se houver)
  - React Query/SWR (se houver)
  - Local state patterns

- [ ] **Schema do banco que o módulo usa**
  - Tabelas principais
  - Relacionamentos
  - Constraints importantes
  - Índices relevantes

- [ ] **Validações**
  - Zod schemas definidos em `src/lib/validations.ts`
  - Onde são aplicados (client vs server)
  - Mensagens de erro (pt-BR)

- [ ] **Integrações com outros módulos**
  - Dependências de outros módulos
  - Fluxo de dados entre módulos

- [ ] **Fluxos de usuário principais**
  - Passo a passo dos user journeys
  - Happy path vs edge cases

- [ ] **Casos de erro / edge cases**
  - Erros esperados e tratados
  - Erros não tratados (gaps)
  - Validações faltantes

- [ ] **Observações de performance**
  - Queries pesadas
  - N+1 queries
  - Missing indexes

- [ ] **Observações de segurança**
  - Auth/authz checks
  - Input validation
  - SQL injection risks
  - XSS risks

#### 10) Observabilidade, operação e qualidade

**Logging**:
- Onde loga? (Pino configuration)
- Níveis de log usados (info, error, warn, debug)
- Estrutura dos logs (structured logging?)
- Destino dos logs (console, file, service?)

**Environments**:
- Como configura dev/staging/prod?
- Variáveis de ambiente por environment
- Diferenças de comportamento

**Como rodar local**:
- Setup inicial (clone, install, env vars)
- Database setup (migrations, seeds)
- Dev server
- Build local
- Troubleshooting comum

**Testes**:
- Existem testes? Onde? (`__tests__`, `*.test.ts`, `*.spec.ts`)
- Tipos: unit, integration, e2e
- Coverage por módulo
- Gaps de cobertura

**Dívida técnica**:
- TODOs e FIXMEs no código (listar todos com contexto)
- Arquivos muito grandes (> 500 linhas)
- Duplicações de código
- Dependências circulares
- Code smells (God objects, long parameter lists, etc.)
- Hotspots (se git history disponível) - arquivos mais modificados

## FORMATO DE SAÍDA (CHECKPOINT)

Crie uma pasta:
```
/checkpoints/2026-03-15_convoca/
```

### Arquivos obrigatórios (geral):

1. **00_MANIFEST.json**
   - Data/hora da auditoria
   - Commit hash atual
   - Branch atual
   - Versões principais (Next.js, React, Node)
   - Lista de todos arquivos gerados neste checkpoint

2. **01_REPO_TREE.txt**
   - Árvore completa de diretórios (sem node_modules, .next, .git)

3. **02_BUILD_RUNBOOK.md**
   - Como fazer setup local
   - Como rodar dev
   - Como fazer build
   - Como fazer deploy
   - Troubleshooting comum

4. **03_DEPENDENCIES.md**
   - Análise de `package.json`
   - Dependências principais e suas versões
   - Dependências críticas (security implications)
   - Potenciais updates

5. **04_ARCHITECTURE_FROM_CODE.md**
   - Overview da arquitetura
   - Diagrama Mermaid da arquitetura geral (camadas: UI → API → DB)
   - Padrões arquiteturais identificados
   - Decisões arquiteturais inferidas

6. **05_ROUTES_MAP.md**
   - Tabela completa de rotas (pages)
   - Tabela completa de API routes
   - Mapa de navegação (como usuário navega no app)

7. **06_UI_COMPONENTS_CATALOG.md**
   - Inventário de todos componentes
   - Organizados por categoria (layout, ui, domain)
   - Reusabilidade score
   - Dependências entre componentes (diagrama)

8. **07_DATA_ACCESS_MAP.md**
   - Catálogo de acessos ao banco
   - Por rota/página: quais queries
   - Por tabela: quem acessa
   - Identificação de hotspots (tabelas mais acessadas)
   - Performance concerns

9. **08_DATABASE_SCHEMA_COMPLETE.md**
   - Schema completo do PostgreSQL
   - ERD (Entity Relationship Diagram) em Mermaid
   - Tabelas: colunas, tipos, constraints
   - Relacionamentos (FKs)
   - Índices
   - Functions, triggers, views

10. **09_DATABASE_DIVERGENCES.md**
    - Comparação: migration files vs schema atual
    - Divergências encontradas
    - Possíveis causas
    - Recomendações

11. **10_AUTH_FLOW_COMPLETE.md**
    - Fluxo de autenticação ponta-a-ponta (diagrama Mermaid)
    - Signup flow
    - Signin flow
    - Password reset flow
    - Session management
    - Middleware enforcement
    - API route protection

12. **11_PERMISSIONS_ENFORCEMENT.md**
    - Roles e permissões
    - Onde são checados (código + linha)
    - Ownership checks
    - Invariantes de segurança
    - Gaps identificados

13. **12_CRON_JOBS_INTEGRATIONS.md**
    - Vercel cron jobs configurados
    - Email integration (Resend)
    - Imports/exports
    - External APIs
    - Webhooks (se houver)

14. **13_ERRORS_EDGE_CASES.md**
    - Catálogo de erros possíveis
    - Como são tratados
    - Status codes HTTP mapeados
    - Edge cases conhecidos
    - Gaps de tratamento

15. **14_TESTS_COVERAGE_MAP.md**
    - Testes existentes
    - Cobertura por módulo
    - Gaps de cobertura
    - Recomendações de testes

16. **15_TECH_DEBT_FINDINGS.md**
    - TODOs e FIXMEs encontrados
    - Arquivos grandes e complexos
    - Duplicações
    - Code smells
    - Hotspots (git analysis)
    - Priorização de débitos

17. **90_MODULE_DEPENDENCY_MAP.md**
    - Mapa de dependências entre módulos
    - Diagrama Mermaid
    - Acoplamento entre módulos
    - Recomendações de desacoplamento

18. **91_MAIN_FLOWS.md**
    - Fluxogramas dos principais processos de negócio
    - Diagramas Mermaid de cada fluxo
    - Exemplo: signup → criar grupo → criar evento → RSVP → sorteio → jogo → votação → ranking

19. **99_AI_CONTEXT_PACK.md**
    - Resumo executivo para outra IA
    - Principais achados
    - Riscos críticos identificados
    - Oportunidades de melhoria
    - Próximos passos recomendados

### Arquivos por módulo (um por módulo encontrado):

```
/checkpoints/2026-03-15_convoca/modules/
  ├── MODULE_AUTHENTICATION.md
  ├── MODULE_GROUPS.md
  ├── MODULE_MEMBERS.md
  ├── MODULE_EVENTS.md
  ├── MODULE_RSVP.md
  ├── MODULE_TEAMS.md
  ├── MODULE_MATCH.md
  ├── MODULE_VOTING.md
  ├── MODULE_RANKINGS.md
  ├── MODULE_PAYMENTS.md
  ├── MODULE_INVITES.md
  └── MODULE_VENUES.md
```

Cada arquivo de módulo deve seguir o template do checklist (item 9).

## PADRÕES DE DOCUMENTAÇÃO E FERRAMENTAS

### Diagramas
- **Mermaid** dentro do Markdown para todos diagramas
- Tipos de diagramas a usar:
  - `flowchart TD` para fluxos de processo
  - `sequenceDiagram` para fluxos de comunicação
  - `erDiagram` para relacionamentos de banco
  - `graph TD` para dependências entre módulos
  - `classDiagram` para arquitetura de componentes (se relevante)

### Evidências
- Para cada afirmação importante, cite:
  ```
  **Evidência**: `src/app/api/groups/route.ts:45-67`
  ```
- Inclua trechos de código quando relevante (máx 20 linhas)

### Inferências vs Fatos
- **Fatos**: marcados como ✅ e sempre com evidência
- **Inferências**: marcadas como 🔍 e claramente identificadas como hipóteses
- Sugestões de melhoria: em seção separada "💡 Oportunidades de Melhoria"

## REQUISITOS DE QUALIDADE (críticos)

### Cobertura completa
- ✅ Todas rotas (pages e API)
- ✅ Todos componentes
- ✅ Todas queries de banco
- ✅ Todo schema de banco
- ✅ Todos fluxos de auth/authz
- ✅ Todos jobs e integrações

### Rastreabilidade
- ✅ Toda afirmação tem evidência (file:line)
- ✅ Nada de "achismo": se não encontrou, marcar "NÃO ENCONTRADO"

### Outputs finais obrigatórios
1. **Lista de "Perguntas em aberto"**
   - O que só dá pra confirmar rodando o app
   - Comportamentos ambíguos no código

2. **Lista de "Riscos críticos"**
   - Auth/authz gaps
   - SQL injection risks
   - Performance bottlenecks
   - Data integrity risks
   - Security vulnerabilities

3. **Mapa "Feature → Rotas → Endpoints → Tabelas"**
   - Matriz completa de rastreabilidade
   - Permite entender impacto de mudanças

4. **Recomendações prioritizadas**
   - Top 10 melhorias recomendadas
   - Com impacto (alto/médio/baixo) e esforço (alto/médio/baixo)

## ORDEM DE EXECUÇÃO

Execute as passadas na ordem:

1. **PASSADA 1** (Inventário)
   - Item 1: Varredura repo → gera `01_REPO_TREE.txt`, `03_DEPENDENCIES.md`
   - Item 2: Inventário rotas → gera `05_ROUTES_MAP.md`
   - Item 3: Inventário endpoints → complementa `05_ROUTES_MAP.md`

2. **PASSADA 2** (Profunda)
   - Item 4: Data access → gera `07_DATA_ACCESS_MAP.md`
   - Item 5: Database schema → gera `08_DATABASE_SCHEMA_COMPLETE.md`, `09_DATABASE_DIVERGENCES.md`
   - Item 6: Auth flow → gera `10_AUTH_FLOW_COMPLETE.md`
   - Item 7: Permissions → gera `11_PERMISSIONS_ENFORCEMENT.md`
   - Item 8: Cron/integrations → gera `12_CRON_JOBS_INTEGRATIONS.md`
   - Item 9: Módulos → gera `modules/*.md`
   - Item 10: Quality → gera `13_ERRORS_EDGE_CASES.md`, `14_TESTS_COVERAGE_MAP.md`, `15_TECH_DEBT_FINDINGS.md`

3. **FINALIZAÇÃO**
   - Gerar diagramas: `04_ARCHITECTURE_FROM_CODE.md`, `90_MODULE_DEPENDENCY_MAP.md`, `91_MAIN_FLOWS.md`
   - Gerar componentes: `06_UI_COMPONENTS_CATALOG.md`
   - Gerar runbook: `02_BUILD_RUNBOOK.md`
   - Gerar contexto IA: `99_AI_CONTEXT_PACK.md`
   - Gerar manifest: `00_MANIFEST.json`

## COMO COMEÇAR

Comece respondendo:
```
🔍 INICIANDO AUDITORIA DO PROJETO CONVOCA
Data/hora: [timestamp atual]
Commit: [git rev-parse HEAD]
Branch: [git branch --show-current]

PASSADA 1: INVENTÁRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/3] Varredura do repositório...
```

E então execute cada etapa sequencialmente, gerando os arquivos conforme avança.

**BOA AUDITORIA! 🔍🚀**
