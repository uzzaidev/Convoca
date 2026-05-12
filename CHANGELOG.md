# Changelog

Gerado aautomaticamente por IA a cada push no `main`.

## 2026-05-12

### chore
- Atualizado plataforma de deployment de Vercel para Vercel2 no README.md
  - Arquivos: `README.md`
  - Confiança: alta

## 2026-05-12

### feat
- Adicionou ferramentas para gerenciamento de eventos, finanças e interações de membros
  - Arquivos: `.env.example`, `AGENTS.md`
  - Confiança: alta

## 2026-05-12

### feat
- Adicionada documentação de Pull Request Summary e novas funcionalidades de participação em eventos
  - Arquivos: `PR_SUMMARY.md`
  - Confiança: alta

### chore
- Removidos arquivos de debug e scripts de migração antigos, incluindo `debug-check-db.js`, `debug-game-results.sql`, `debug-pedro-stats.sql`, `run-migration-seasons.mjs`, `run-password-reset-migration.mjs`, e outros
  - Arquivos: vários
  - Confiança: alta

## 2026-04-13

### fix
- Corrigida a função handleMonthlyChargesCron para remover comentários desnecessários e ajustar a verificação de autorização na rota de geração de cobranças mensais. Arquivos: `src/app/api/cron/generate-monthly-charges/route.ts`
- Corrigida a mensagem de retorno ao verificar cobranças existentes, ajustando para português correto. Arquivos: `src/app/api/cron/generate-monthly-charges/route.ts`
- Corrigida a duplicidade na exportação das funções POST na rota de cobranças mensais, consolidando para evitar conflito. Arquivos: `src/app/api/cron/generate-monthly-charges/route.ts`

### feat
- Implementada a função `generateUpcomingEventsForRecurrence` no arquivo `src/lib/recurrences.ts` para gerar eventos futuros com base em recorrências, considerando diferentes frequências e dias da semana. Arquivos: `src/lib/recurrences.ts`
- Melhorada a manipulação de datas na geração de eventos recorrentes, usando fuso horário de São Paulo e funções de formatação específicas. Arquivos: `src/lib/recurrences.ts`

### refactor
- Refatorada a lógica de cálculo de próximas ocorrências na geração de eventos recorrentes, separando funções de formatação e cálculo de datas para maior clareza e manutenção. Arquivos: `src/lib/recurrences.ts`
- Alterada a estrutura de importação e uso de funções auxiliares para manipulação de datas, garantindo consistência com o fuso horário local. Arquivos: `src/lib/recurrences.ts`

## 2026-04-11

### feat
- Adicionada documentação de checkpoint completo do projeto UzzOPS para reverse engineering.
  - Arquivos: `docs/PROMPT_CHECKPOINT_UZZOPS.md`
  - Confiança: alta

## 2026-04-01

### feat
- Atualizada a função de sincronização de status de assinatura para tratar o status 'past_due' e definir uma mensagem de motivo adequada.
  - Arquivos: `src/lib/subscription.ts`
  - Confiança: alta

## 2026-04-01

### feat
- Adicionadas convenções e diretrizes para rotas Stripe, incluindo assinatura de webhooks, uso de singleton `getStripe()`, SQL parametrizado, tratamento de erros e compatibilidade com Stripe v21
  - Arquivos: `.github/instructions/stripe-routes.instructions.md`
  - Confiança: alta

## 2026-04-01

### refactor
- Reestruturou a documentação de arquitetura, incluindo tópicos de infraestrutura, faturamento, banco de dados, fatos do projeto e segurança.
  - Arquivos: `.brv/context-tree/_index.md`
  - Evidência: alteração significativa na estrutura e conteúdo de documentação
  - Confiança: alta

## 2026-04-01

### fix
- Atualizada a recuperação de faturas próximas para usar o método `createPreview` do Stripe
  - Arquivos: `src/app/api/groups/[groupId]/billing/route.ts`
  - Evidência: alteração na chamada de `stripe.invoices.retrieveUpcoming` para `stripe.invoices.createPreview`
  - Confiança: alta

## 2026-04-01

### feat
- Implementada gestão de assinaturas e cobranças para grupos, incluindo visualização de planos, assinatura, faturas e cobrança.  
  - Arquivos: `src/app/api/groups/[groupId]/billing/route.ts`, `src/app/api/admin/plans/route.ts`, `src/app/api/admin/plans/[planId]/route.ts`, `src/app/api/admin/groups/require-payment/route.ts`, `src/app/admin/page.tsx`  
  - Confiança: alta

## 2026-04-01

### fix
- Atualizado URLs de sucesso e cancelamento na sessão de checkout do Stripe para apontar para `/groups/` ao invés de `/dashboard/groups/`.
  - Arquivos: `src/app/api/groups/route.ts`, `src/app/api/stripe/checkout/route.ts`
  - Evidência: alteração nas linhas de `success_url` e `cancel_url`
  - Confiança: alta

## 2026-04-01

### feat
- Implementado painel financeiro no dashboard de administração, incluindo métricas de saldo, receita mensal, assinaturas, cupons e clientes vinculados.  
  - Arquivos: `src/components/admin/admin-finance-tab.tsx`, `src/components/admin/admin-dashboard.tsx`  
  - Confiança: alta

### feat
- Adicionado botão de pagamento na página do grupo para ativar assinatura pendente, visível para administradores.  
  - Arquivos: `src/app/groups/[groupId]/page.tsx`  
  - Confiança: alta

### feat
- Criada rota API para dashboard financeiro, agregando dados do Stripe e do banco, incluindo assinaturas, próximas renovações, clientes, faturas, saldo, cupons e receita mensal.  
  - Arquivos: `src/app/api/admin/stripe-dashboard/route.ts`  
  - Evidência: implementação completa da rota com múltiplas consultas e chamadas Stripe  
  - Confiança: alta

## 2026-04-01

### feat
- Implementada gestão de cupons e promotion codes no sistema, incluindo criação, listagem e ativação/desativação via API Stripe.
  - Arquivos: `src/app/api/admin/coupons/route.ts`, `src/app/api/admin/coupons/[couponId]/route.ts`, `src/components/admin/admin-coupons-tab.tsx`
  - Confiança: alta

## 2026-04-01

### feat
- Implementada gestão de assinaturas Stripe para grupos, incluindo criação de sessões de checkout, portal de pagamento e sincronização de status
  - Arquivos: `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/portal/route.ts`, `src/app/api/stripe/subscription/[groupId]/route.ts`, `src/app/api/stripe/webhook/route.ts`
  - Confiança: alta

## 2026-04-01

### feat
- Adicionados arquivos de contexto e sumário para os domínios de arquitetura, fatos e segurança, incluindo detalhes sobre arquitetura de banco de dados, fluxo de autenticação, portabilidade e riscos operacionais.
  - Arquivos: `.brv/context-tree/_index.md`, `.brv/context-tree/architecture/_index.md`, `.brv/context-tree/facts/_index.md`, `.brv/context-tree/security/_index.md`
  - Confiança: alta

## 2026-03-25

### fix
- Reduzido o valor de `MAX_DIFF_CHARS` para 16.000 para evitar ultrapassar limites de tokens ao gerar o changelog
  - Arquivos: `.github/scripts/generate-changelog.mjs`
  - Evidência: alteração direta na constante `MAX_DIFF_CHARS`
  - Confiança: alta

## 2026-03-20

### feat
- Implementada geração automática de changelog via IA no push para branch main
  - Arquivos: `.github/scripts/generate-changelog.mjs`, `.github/workflows/ai-changelog.yml`, `.github/changelog-instructions.md`, `CHANGELOG.md`
  - Confiança: alta
