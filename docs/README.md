# Documentação - Peladeiros

Documentação completa do projeto Peladeiros, organizada por categoria.

## Índice Geral

### 01. Getting Started
Guias para começar com o projeto.

- [Setup Completo](01-getting-started/SETUP.md) - Configuração inicial do projeto
- [Configuração de Ambiente](01-getting-started/ENV_SETUP_GUIDE.md) - Variáveis de ambiente
- [Quick Start - Autenticação](01-getting-started/QUICK_START_AUTH.md) - Início rápido com auth
- [Guia de Correções Rápidas](01-getting-started/QUICK_FIX_GUIDE.md) - Soluções rápidas

### 02. Architecture
Arquitetura e estrutura do projeto.

- [Resumo do Projeto](02-architecture/PROJECT_SUMMARY.md) - Visão geral completa
- [Estrutura de Componentes](02-architecture/COMPONENT_STRUCTURES.md) - Organização dos componentes
- [Plano Original](02-architecture/plano-app-pelada.md) - Planejamento inicial
- [Fase 1 Completa](02-architecture/FASE1_COMPLETE.md) - Status da primeira fase
- [Resumo de Implementação](02-architecture/IMPLEMENTATION_SUMMARY.md) - Resumo das implementações
- [Resumo de Migrações](02-architecture/MIGRATION_SUMMARY.md) - Migrações realizadas
- [Migração de Draw Configs](02-architecture/MIGRATION_SUMMARY_DRAW_CONFIGS.md) - Configs de sorteio

### 03. API
Documentação das APIs.

- [API Docs](03-api/API_DOCS.md) - Documentação completa das rotas de API

### 04. Database
Estrutura e migrações do banco de dados.

- [Migração de Database](04-database/DATABASE_MIGRATION.md) - Processo de migração
- [Guia de Migrações](04-database/MIGRATIONS_GUIDE.md) - Como fazer migrações

### 05. Authentication
Sistema de autenticação.

- [Guia Neon Auth](05-authentication/NEON_AUTH_GUIDE.md) - Autenticação com Neon
- [Guia de Autenticação](05-authentication/GUIA_AUTENTICACAO.md) - Guia completo (PT-BR)
- [Fix: Erro de Sessão](05-authentication/FIX_AUTH_SESSION_ERROR.md) - Correção de problemas

### 06. Features
Documentação de features específicas.

- [Separação Admin/Member](06-features/ADMIN_MEMBER_SEPARATION.md) - Sistema de roles
- [Link de Participação](06-features/FEATURE_LINK_PARTICIPACAO.md) - Convites e participação
- [Sistema de Pagamentos](06-features/PAYMENTS_GUIDE.md) - Gestão financeira
- [Lógica de Rankings](06-features/RANKING_LOGIC.md) - Como funcionam os rankings

### 07. Deployment
Deploy e integração.

- [Checklist de Deploy](07-deployment/DEPLOYMENT_CHECKLIST.md) - Lista de verificação
- [Build Success](07-deployment/BUILD_SUCCESS.md) - Garantindo builds bem-sucedidos
- [Vercel Fix](07-deployment/VERCEL_FIX.md) - Correções específicas da Vercel
- [Integração Vercel + Neon](07-deployment/VERCEL_NEON_INTEGRATION.md) - Setup de integração

### 08. Guides
Guias gerais e boas práticas.

- [Code Review](08-guides/CODE_REVIEW.md) - Guia de revisão de código

### 09. Troubleshooting
Soluções de problemas comuns.

- [Fix: 404 Persistente](09-troubleshooting/FIX_404_PERSISTENTE.md) - Resolução de 404s
- [Resumo Fix 404](09-troubleshooting/RESUMO_FIX_404.md) - Resumo da solução
- [Quick Fix](09-troubleshooting/QUICK_FIX.md) - Correções rápidas
- [Solução Dashboard](09-troubleshooting/SOLUCAO_DASHBOARD.md) - Problemas do dashboard
- [Solução Erro Login](09-troubleshooting/SOLUCAO_ERRO_LOGIN.md) - Erros de login

### 10. Improvements
Melhorias planejadas e implementadas.

- [Melhorias Futuras](10-improvements/FUTURE_IMPROVEMENTS.md) - Roadmap de melhorias
- [UX Improvements](10-improvements/UX_IMPROVEMENTS.md) - Melhorias de UX
- [Rankings UX](10-improvements/RANKINGS_UX_IMPROVEMENTS.md) - Melhorias no ranking
- [Campo Visual Futuro](10-improvements/CAMPO_VISUAL_FUTURO.md) - Recursos visuais planejados
- [Visual Demo](10-improvements/VISUAL_DEMO.md) - Demonstrações visuais
- [Resumo Visual](10-improvements/RESUMO_VISUAL_SOLUCAO.md) - Soluções visuais
- [Frequência Ranking](10-improvements/FREQUENCIA-RANKING-UPDATE.md) - Updates de frequência

### 11. App Mobile
Documentação para desenvolvimento de aplicativos iOS e Android.

- [Estratégia Mobile](11-app/MOBILE_STRATEGY.md) - Visão geral e decisões arquiteturais
- [Setup Capacitor](11-app/CAPACITOR_SETUP.md) - Guia completo de implementação
- [API Helper](11-app/API_HELPER.md) - Cliente de API para mobile

### Branding
Identidade visual do projeto.

- [Cores](branding/colors.md) - Paleta de cores e guia de estilo

### Migrations
Arquivos SQL de migração do banco de dados.

- `migration-add-dm-status.sql`
- `migration-admin-member-separation.sql`
- `migration-charges-event-link.sql`
- `migration-draw-configs.sql`
- `migration-event-settings.sql`

### Deprecated
Documentação antiga mantida para referência histórica.

- Vários guias da autenticação Stack Auth (substituída por NextAuth)
- Documentação de Magic Link (removido)

## Navegação Rápida

**Novo no projeto?** Comece por:
1. [Setup Completo](01-getting-started/SETUP.md)
2. [Resumo do Projeto](02-architecture/PROJECT_SUMMARY.md)
3. [API Docs](03-api/API_DOCS.md)

**Desenvolvendo?** Consulte:
- [Code Review](08-guides/CODE_REVIEW.md)
- [API Docs](03-api/API_DOCS.md)
- [Guia de Migrações](04-database/MIGRATIONS_GUIDE.md)

**Deploy?** Veja:
- [Checklist de Deploy](07-deployment/DEPLOYMENT_CHECKLIST.md)
- [Integração Vercel + Neon](07-deployment/VERCEL_NEON_INTEGRATION.md)

**Problemas?** Procure em:
- [Troubleshooting](09-troubleshooting/)
- [Soluções de Autenticação](05-authentication/FIX_AUTH_SESSION_ERROR.md)

**Desenvolvendo Mobile?** Comece por:
1. [Estratégia Mobile](11-app/MOBILE_STRATEGY.md)
2. [Setup Capacitor](11-app/CAPACITOR_SETUP.md)
3. [API Helper](11-app/API_HELPER.md)

## Convenções

- Todos os arquivos seguem nomenclatura em UPPERCASE para documentação
- Código e comments em inglês
- UI e documentação de usuário em português (pt-BR)
- Migrações SQL numeradas sequencialmente

## Contribuindo

Ao adicionar nova documentação:
1. Coloque na pasta apropriada (01-11)
2. Use formato Markdown
3. Atualize este README.md se adicionar seções importantes
4. Mantenha links relativos funcionando
