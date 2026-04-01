# Changelog

Gerado automaticamente por IA a cada push no `main`.

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
