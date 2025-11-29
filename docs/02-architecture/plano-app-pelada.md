perfeito, Luis! Vou fazer em duas partes: (1) inventário das features do
Chega+ (para a gente se basear) e (2) um plano de produto/tech completo
para o teu app (Next.js + TS + Neon/Postgres + Vercel), com fases e um
esboço de schema de dados.

# 1) Tudo que o Chega+ oferece (feature inventory)

**Pré-jogo** - Criação de grupos e convite por link/WhatsApp; gestão de
mensalistas e convidados. citeturn0search1turn0search9\
- Confirmação de presença (separando goleiros e linha), com limite de
vagas e **fila de espera automática**. citeturn0search1turn0search9\
- Notificações push lembrando do jogo. citeturn0search1\
- Cartão/perfil do jogador com estatísticas, troféus, notas e "overall".
citeturn0search16

**Ao vivo (durante o jogo)** - Controle de **ordem de chegada**.
citeturn0search1\
- **Sorteio inteligente de times**, equilibrando posições/notas.
citeturn0search1turn0search9\
- Cronômetro/tempo de jogo. citeturn0search1\
- Registro de **gols, assistências, desarmes, falhas, defesas
difíceis**. citeturn0search1\
- Algoritmo de "quem joga o próximo" baseado em participação.
citeturn0search1

**Pós-jogo** - **Avaliação** dos jogadores (mercado de notas).
citeturn0search17\
- **Destaques do dia**: craque, artilheiro, garçom, paredão, pereba etc.
citeturn0search1turn0search13\
- **Rankings** (semanais, mensais, semestrais, anuais) por estatística.
citeturn0search1\
- Estatísticas por jogador/jogo, transparência de placares/times.
citeturn0search1\
- Tela "Sócio Jogador": evolução, comparação entre jogadores.
citeturn0search7\
- Exportação de listas/rankings para redes sociais. citeturn0search1

**Administração & \$\$\$** - **Financeiro completo**: entradas/saídas,
carteira individual; visão de quem está em dia/devendo.
citeturn0search11turn0search1\
- Organização de **churrascos** (quem vai, divisão, valores).
citeturn0search1\
- Canal "Fale Conosco"; clube de vantagens/descontos.
citeturn0search1\
- Plano **GrupoPRO** com recursos extras para admins (menos stress, mais
controle). citeturn0search12

*(Observações de contexto: 500k+ downloads Android, nota alta;
atualizações recentes; teste grátis 30 dias.)*
citeturn0search2turn0search5turn0search9

------------------------------------------------------------------------

# 2) Plano para o teu app (Next.js + TypeScript + Neon + Vercel)

## Visão técnica

-   **Frontend/SSR**: Next.js (App Router), React, TypeScript,
    **Tailwind**.\
-   **API**: Route Handlers do Next (REST)
-   **DB**: Neon (Postgres serverless).
-   **Auth**: Auth.js (NextAuth) com Email Magic Link + OAuth opcional.\
-   **Realtime** (fase 2): Pusher/Ably (pub/sub) para placar ao vivo; ou
    Postgres → Webhooks.\
-   **Notificações**: OneSignal ou Firebase Cloud Messaging (FCM).\
-   **Pagamentos** (fase 2/3): Stripe (carteira e recorrência) ---
    Brasil: considerar Pix via PSP (p.ex. Stripe/Pagar.me) em fase 3.\
-   **Deploy**: Vercel (Node Server/Edge misto), domínio via DNS da tua
    zona.\
-   **Observabilidade**: Logging (pino), métricas (Tinybird/Amplitude),
    Sentry.

## Roadmap por Fases

### Fase 1 --- **MVP jogável** (6--8 semanas)

Objetivo: colocar o grupo para **criar jogos, confirmar presença,
sortear times e registrar gols**, com ranking básico.

**Escopo** - Onboarding, criação de perfil e grupos; convite por link.\
- CRUD de partidas (data, local, formato, limite de vagas, **fila de
espera**).\
- RSVP (confirmar/recusar) com papéis: goleiro/jogador de linha.\
- Sorteio simples de times (aleatório com fix de goleiros).\
- Registro de gols/assistências e **placar ao vivo** (admin).\
- Pós-jogo: votação **MVP & Pereba**, notas 0--10; ranking
**artilheiro** e **presença**.\
- Financeiro **mínimo**: registrar pagamento de mensalidade/manual (sem
integração).\
- Admin web: visão de presença e pendências.\
- Autenticação e autorização por grupo (admin, membro).\
- Design responsivo simples com Tailwind (dark/light).

**Critérios de sucesso** - Fluxo completo de uma pelada
(criar→confirmar→jogar→registrar→votar→ver ranking).\
- Até 100 usuários sem gargalos; p95 \< 300ms em páginas críticas.

### Fase 2 --- **Ao vivo + comunicação + financeiro** (6--10 semanas)

Objetivo: aumentar retenção e reduzir trabalho do admin.

**Escopo** - **Realtime** (Pusher/Ably): placar, cronômetro, eventos em
tempo real.\
- **Sorteio inteligente** (balanceado por posição/nota histórica).\
- Algoritmo "**quem joga o próximo**" (fila baseada em presença).\
- Notificações push (reminder de jogo, confirmados, fila, pendência
financeira).\
- **Carteira individual** + extrato; categorias de movimentos
(mensalidade, diária).\
- Export/Share: cards de ranking/destaques para redes sociais.\
- Painéis de estatísticas (jogador/grupo/temporada).\
- Suporte a **quadros**/locais; anexos (foto do placar).\
- Integração **Pix/Stripe** (início: checkout simples de mensalidade).

### Fase 3 --- **Pro/Monetização + social** (8--12 semanas)

**Escopo** - **Assinatura do grupo (Pro)**: limites maiores, automações,
templates de sorteio, auditoria.\
- **Churrasco/Encontros**: RSVP, rateio, itens, pagamentos.\
- **Comparar jogadores**, troféus, temporadas/ligas, playoffs e
torneios.\
- Gamificação: níveis, conquistas, **overall** público/privado.\
- **Marketplace** (parcerias/benefícios): vouchers e descontos.\
- Moderação/abuso, relatórios e trilhas de auditoria.\
- Internacionalização e multi-modalidades (futuro).

------------------------------------------------------------------------

## Modelo de dados (Neon/Postgres) --- esqueleto inicial

**Entidades principais** - `users` (id, name, email, avatar_url,
role_global, created_at)\
- `groups` (id, name, description, privacy, photo_url, created_at)\
- `group_members` (user_id, group_id, role_in_group \[admin\|member\],
is_goalkeeper, base_rating, joined_at)\
- `events` (id, group_id, starts_at, venue_id, max_players,
max_goalkeepers, status \[scheduled\|live\|finished\|canceled\],
waitlist_enabled, created_by)\
- `event_attendance` (event_id, user_id, role \[gk\|line\], status
\[yes\|no\|waitlist\], checked_in_at, order_of_arrival)\
- `teams` (id, event_id, name, seed, is_winner)\
- `team_members` (team_id, user_id, position, starter_bool)\
- `event_actions` (id, event_id, actor_user_id, action_type
\[goal\|assist\|save\|tackle\|error\|card\|period_start\|period_end\],
subject_user_id, team_id, minute_ts, metadata jsonb)\
- `event_scores` (event_id, team_id, goals) --- ou materializado de
`event_actions`\
- `player_ratings` (event_id, rater_user_id, rated_user_id, score, tags
\[mvp\|pereba\|paredao\|garcom...\])\
- `leaderboards` (group_id, season_id, metric
\[goals\|assists\|presence\|rating_avg\], period
\[weekly\|monthly\|season\|all_time\], value, rank, computed_at)\
- `seasons` (id, group_id, name, starts_at, ends_at)\
- `venues` (id, group_id, name, address, geo)\
- **Financeiro**\
- `wallets` (id, owner_type \[group\|user\], owner_id, balance_cents)\
- `charges` (id, group_id, user_id, type
\[monthly\|daily\|fine\|other\], amount_cents, due_date, status)\
- `transactions` (id, wallet_id, charge_id?, type \[credit\|debit\],
amount_cents, method \[cash\|pix\|card\], created_by, created_at,
notes)\
- **Sistema**\
- `invites` (group_id, code, created_by, expires_at, max_uses,
used_count)\
- `notifications` (id, user_id, type, payload jsonb, sent_at, channel
\[push\|email\|inapp\])\
- `audit_logs` (id, actor_user_id, action, target_type, target_id,
metadata jsonb, created_at)

**Índices & constraints chave** - Uniques: (`group_members.user_id`,
`group_members.group_id`), (`event_attendance.event_id`, `user_id`)\
- Índices: `event_actions(event_id, action_type)`,
`player_ratings(event_id, rated_user_id)`,
`charges(user_id, status, due_date)`\
- Views/Materialized: `mv_event_scoreboard`,
`mv_group_leaderboards_monthly`.

> Dica: com **Drizzle**, mantém as migrações versionadas e tipadas. O
> Neon lida muito bem com WebSocket; para cargas ao vivo, considere
> **queue** de escrita (p.ex. Upstash QStash) para não bloquear
> request/resposta.

------------------------------------------------------------------------

## API (Next.js Route Handlers) --- sketch

`/api/auth/*` -- Auth.js\
`/api/groups` \[POST, GET\] -- criar/listar\
`/api/groups/:id` \[GET, PATCH, DELETE\]\
`/api/groups/:id/invites` \[POST, GET\]\
`/api/events` \[POST\]\
`/api/events/:id` \[GET, PATCH\]\
`/api/events/:id/rsvp` \[POST\] (yes/no/waitlist)\
`/api/events/:id/checkin` \[POST\] (ordem de chegada)\
`/api/events/:id/draw` \[POST\] (sorteio de times)\
`/api/events/:id/actions` \[POST\] (gols/assistências/etc), \[GET\]
(feed ao vivo)\
`/api/events/:id/ratings` \[POST\], \[GET\]\
`/api/groups/:id/leaderboards` \[GET\] (com query params `period`,
`metric`)\
`/api/finance/charges` \[POST, GET\]\
`/api/finance/transactions` \[POST, GET\]\
`/api/notifications/subscribe` \[POST\] (tokens push)

------------------------------------------------------------------------

## Lógica de sorteio & fila (resumo)

-   **Sorteio v1** (Fase 1): aleatório com **locks** para fixar goleiros
    em times diferentes.\
-   **Sorteio v2** (Fase 2): algoritmo guloso balanceando score
    histórico (rating médio + ELO simples) e posições informadas.\
-   **Fila "próximo"**: prioridade por (a) quem menos jogou na
    sessão, (b) presença em jogos recentes, (c) tie-break por ordem de
    chegada.

------------------------------------------------------------------------

## UX rápida (Tailwind + TS)

-   Dashboard do grupo: próximos jogos, confirmados, pendências (\$),
    ranking.\
-   Tela do jogo: **tabs** "Pré-jogo", "Ao vivo", "Pós-jogo".\
-   "Botão do Admin" flutuante: iniciar cronômetro, registrar gol,
    sorteio.\
-   Share cards (OG images) para placar/fotos e "Destaques da Rodada".

------------------------------------------------------------------------

## Segurança & privacidade

-   RBAC por grupo; endpoints idempotentes.\
-   Rate-limit por IP/usuário (Upstash Redis).\
-   Soft-delete + audit trail.\
-   LGPD: consentimento para notificações, política de dados, export de
    histórico.

------------------------------------------------------------------------

## Próximos passos (práticos)

1)  **Escolher ORM** (sugiro Drizzle) e subir **schema inicial** no
    Neon.\
2)  Scaffold do projeto (Next 14+, App Router, Tailwind, Auth.js).\
3)  Implementar **Fase 1** conforme escopo (começar por RSVP → sorteio →
    ações de jogo → votação → rankings).\
4)  Medir e iterar (event log + Sentry + métricas de funil).

Se quiser, já te entrego um **boilerplate** com Next + Drizzle + Neon +
Auth + rotas básicas (grupos/eventos/RSVP) e os **migrations** iniciais
prontos --- é só falar que eu gero aqui.
