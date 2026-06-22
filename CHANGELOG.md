# Changelog

Gerado aautomaticamente por IA a cada push no `main`.

## 2026-06-22

### fix
- Separou o comando `pod install` como etapa distinta no workflow do iOS para evitar conflito entre Ruby 3.3 e Ruby 3.4. Essa mudança previne contaminação do ambiente do CocoaPods pelo Ruby utilizado pelo fastlane.
  - Arquivos: `.github/workflows/ios-release.yml`, `fastlane/Fastfile`
  - Evidência: adição de etapa específica para `pod install` no workflow e comentários explicativos
  - Confiança: alta

## 2026-06-22

### fix
- Automatizado o processo de instalação de pods via shell no Fastfile, incluindo a criação da pasta build e a instalação do pod com repositórios atualizados.
  - Arquivos: `fastlane/Fastfile`
  - Evidência: adição do comando `pod install --repo-update` e ajustes na sequência de passos
  - Confiança: alta

## 2026-06-22

### fix
- Alterado comando de sincronização de assets e plugins nativos iOS de `cap sync ios` para `cap copy ios` para evitar conflito de Ruby no pod install.
  - Arquivos: `fastlane/Fastfile`
  - Evidência: mudança na linha de comando e comentários explicativos
  - Confiança: alta

## 2026-06-22

### fix
- Corrigido uso de caminhos relativos no arquivo `fastlane/Fastfile` para evitar erro de path em CI, usando `File.expand_path` com caminho absoluto.
  - Arquivos: `fastlane/Fastfile`
  - Evidência: alteração de variáveis ROOT e paths relativos para caminhos absolutos
  - Confiança: alta

## 2026-06-22

### fix
- Ajustado workflow de CI para chamar `fastlane beta` ao invés de `xcodebuild` direto, incluindo a instalação do xcpretty no Gemfile.
  - Arquivos: `.github/workflows/ios-release.yml`
  - Evidência: alteração na configuração do workflow e comentários indicando o uso de `fastlane beta`.
  - Confiança: alta

## 2026-06-22

### fix
- Adicionado a gem "xcpretty" ao Gemfile para melhorar a saída do Fastlane.
- Atualizado o Fastfile para definir constantes de ID do bundle, ID da equipe e nome do perfil de provisionamento.
- Alterada a configuração do Fastlane para usar variáveis constantes em vez de valores hardcoded, facilitando manutenção.
- Incluída a etapa de atualização das configurações de assinatura de código para usar assinatura manual antes do archive, garantindo compatibilidade em CI.
- Melhorada a configuração do `gym` para passar argumentos de build e opções de exportação, incluindo o método de assinatura e perfil de provisionamento.
- Confiança: alta

## 2026-06-22

### docs
- Atualizado o playbook de CI para iOS sem Mac, incluindo lições aprendidas em 2026-06-22, como a não instalação do Ruby no Windows e execução do fastlane via GitHub Actions.
  - Arquivos: `docs/playbooks/ios-ci-sem-mac/README.md`
  - Evidência: comentários e alterações no texto do playbook
  - Confiança: alta

## 2026-06-22

### chore
- Concluído o bootstrap do fastlane match para iOS, gerando certificados e profiles de provisionamento
  - Arquivos: `docs/mobile-convoca/CHECKLIST.md`
  - Evidência: mensagem de commit indicando execução bem-sucedida
  - Confiança: alta

### feat
- Atualizado status do processo de release iOS na checklist, indicando que os certificados foram gerados e o próximo passo é rodar o workflow de release
  - Arquivos: `docs/mobile-convoca/CHECKLIST.md`
  - Confiança: alta

## 2026-06-22

### fix
- Adicionado `*.p8` ao arquivo `.gitignore` para evitar o commit de chaves privadas Apple.
  - Arquivos: `.gitignore`
  - Evidência: alteração na linha do `.gitignore` para ignorar arquivos `.p8`
  - Confiança: alta

## 2026-06-22

### fix
- Adicionada configuração de `api_key` nas lanes `setup_certs` e `beta` para autenticação no Apple Developer Portal e App Store Connect usando API Key (.p8). Também foi criado um keychain temporário não interativo para CI.
  - Arquivos: `fastlane/Fastfile`
  - Evidência: adição de `api_key` e `create_keychain` nas lanes
  - Confiança: alta

## 2026-06-22

### fix
- Ajustado o comando de instalação do bundle para ser explícito e com verbose, devido à ausência de Gemfile.lock.
  - Arquivos: `.github/workflows/ios-match-bootstrap.yml`
  - Evidência: alteração na linha de comando `bundle install --jobs 4 --retry 3` e uso de `--verbose` na execução do fastlane
  - Confiança: alta

## 2026-06-22

### chore
- Atualizado o CHECKLIST iOS com o progresso de 2026-06-22, incluindo configurações de secrets, workflows de CI e etapas de bootstrap do fastlane match.
  - Arquivos: `docs/mobile-convoca/CHECKLIST.md`
  - Confiança: alta

## 2026-06-22

### feat
- Adiciona workflows para build e gerenciamento de certificados iOS usando Fastlane match e automação no GitHub Actions.
  - Arquivos: `.github/workflows/ios-match-bootstrap.yml`, `.github/workflows/ios-release.yml`, `Gemfile`
  - Confiança: alta

## 2026-06-22

### refactor
- Reorganização e consolidação do conteúdo da documentação de arquitetura, banco de dados, fatos, segurança e contexto de fatos.
  - Arquivos: `.brv/context-tree/_index.md`, `.brv/context-tree/facts/_index.md`, `.brv/context-tree/_manifest.json`
  - Confiança: alta

## 2026-06-22

### feat
- Documentou estratégias de gerenciamento de temporadas, arquitetura móvel e fatos de extração de projeto.
  - Arquivos: `.brv/_queue_status.json`, `.brv/context-tree/convoca/season_management/season_management.md`, `.brv/context-tree/mobile/architecture/convoca_mobile_architecture.md`, `.brv/context-tree/facts/project/project_facts_extraction.md`
  - Evidência: adição de novos arquivos de documentação e atualização de status de fila
  - Confiança: alta

### feat
- Incluiu novos arquivos de abstração e overview para gerenciamento de temporadas, arquitetura móvel e fatos do projeto.
  - Arquivos: `.brv/context-tree/convoca/season_management/season_management.abstract.md`, `.brv/context-tree/convoca/season_management/season_management.overview.md`, `.brv/context-tree/mobile/architecture/convoca_mobile_architecture.abstract.md`, `.brv/context-tree/mobile/architecture/convoca_mobile_architecture.overview.md`, `.brv/context-tree/facts/project/project_facts_extraction.abstract.md`, `.brv/context-tree/facts/project/project_facts_extraction.overview.md`
  - Confiança: alta

### fix
- Atualizado o estado do dream com aumento no número de curadorias desde o último sonho.
  - Arquivos: `.brv/dream-state.json`
  - Evidência: incremento de `curationsSinceDream` de 2 para 6
  - Confiança: alta

## 2026-06-22

### feat
- Melhorada a gestão de temporadas com normalização e validação de datas
  - Arquivos: `src/lib/season-dates.ts`, `src/app/api/groups/[groupId]/seasons/[seasonId]/route.ts`, `src/app/api/groups/[groupId]/seasons/route.ts`, `src/components/seasons/season-manager.tsx`
  - Confiança: alta

## 2026-06-22

### chore
- Removidos os arquivos de documentação desatualizados sobre configuração do Capacitor e recursos nativos.
  - Arquivos: `docs/universal-mobile-app/01-CAPACITOR-SETUP.md`, `docs/universal-mobile-app/04-NATIVE-FEATURES.md`
  - Confiança: alta

## 2026-06-20

### chore
- Alterado nomes de pacotes, IDs de aplicativos e configurações relacionadas para refletir a mudança de domínio para "com.uzzai.convoca". Inclui atualizações em arquivos Android (`build.gradle`, `strings.xml`, `release.properties`), Capacitor (`capacitor.config.ts`), templates de configuração de deep links (`apple-app-site-association.template.json`, `assetlinks.template.json`), iOS (`project.pbxproj`, `Info.plist`) e código (`proxy.ts`).  
  - Arquivos: `android/app/build.gradle`, `android/app/src/main/res/values/strings.xml`, `android/release.properties.example`, `capacitor.config.ts`, `docs/mobile-convoca/templates/*.json`, `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/App/Info.plist`, `src/proxy.ts`  
  - Confiança: alta

## 2026-06-19

### feat
- Implementado backend para envio de push notifications via FCM HTTP v1.
  - Arquivos: `src/app/api/mobile/push/send/route.ts`, `src/lib/mobile/fcm.ts`
  - Confiança: alta

## 2026-06-19

### feat
- Estruturou o app mobile híbrido usando Capacitor para Android, incluindo configuração do projeto Android, scripts de build, e organização de arquivos.
  - Arquivos: `capacitor.config.ts`, `package.json`, `android/`, `src/lib/mobile/`, `scripts/build-mobile.js`
  - Confiança: alta

### feat
- Criou plano detalhado de desenvolvimento para adaptação do Convoca em app Android, incluindo etapas de setup, configuração visual, navegação e funcionalidades nativas.
  - Arquivos: `MOBILE_ANDROID_PLAN.md`
  - Confiança: alta

## 2026-06-05

### feat
- Atualizada a lógica de troca de jogadores para lidar com `currentTeamId` opcional e melhorar o gerenciamento de estado no componente TeamEditor
  - Arquivos: `src/app/api/events/[eventId]/teams/swap/route.ts`, `src/components/events/team-editor.tsx`
  - Evidência: alterações na validação, consulta e atualização de times e membros
  - Confiança: alta

## 2026-05-28

### feat
- Aprimorada a lógica de cálculo de MVP nos endpoints de estatísticas, rankings e finalização de temporada, incluindo seleção de vencedores claros e resolvidos por tiebreaker.
  - Arquivos: `src/app/api/groups/[groupId]/my-stats/route.ts`, `src/app/api/groups/[groupId]/rankings/route.ts`, `src/app/api/groups/[groupId]/seasons/[seasonId]/finish/route.ts`
  - Confiança: alta

## 2026-05-17

### chore
- Consolidada a atualização do arquivo de fatos e do workflow de curadoria RLM, eliminando duplicações e incluindo regras de verificação e pré-computação de recon. Além disso, foram limpos caminhos obsoletos de sumários e resetado o estado de sonho após merges bem-sucedidos.
  - Arquivos: `.brv/context-tree/_index.md`
  - Confiança: alta

## 2026-05-16

### feat
- Atualizado o arquivo `.brv/_queue_status.json` para refletir o aumento no processamento de 3 para 18 itens.
  - Arquivos: `.brv/_queue_status.json`
  - Evidência: alteração no valor de "processed"
  - Confiança: alta

### feat
- Adicionada a nova abstração de contexto `facts/project/curate_workflow_rlm_approach.abstract.md` descrevendo o fluxo de trabalho de curadoria RLM, incluindo recon, extração, deduplication, agrupamento, verificação e gravação de histórico.
  - Arquivos: `.brv/context-tree/facts/project/curate_workflow_rlm_approach.abstract.md`
  - Confiança: alta

### feat
- Criada a documentação `facts/project/curate_workflow_rlm_approach.md` detalhando o fluxo de trabalho de curadoria RLM, incluindo decisões de modo, extração em chunks, verificação de resultados e dependências.
  - Arquivos: `.brv/context-tree/facts/project/curate_workflow_rlm_approach.md`
  - Confiança: alta

### feat
- Atualizado o arquivo `.brv/_manifest.json` para incluir as novas abstrações e documentos relacionados ao fluxo de curadoria RLM.
  - Arquivos: `.brv/_manifest.json`
  - Confiança: alta

### feat
- Atualizado o arquivo `.brv/facts/project/project_facts.abstract.md` para refletir fatos mais atuais sobre o stack, incluindo uso de PostgreSQL, Stripe, NextAuth, e organização de documentação.
  - Arquivos: `.brv/context-tree/facts/project/project_facts.abstract.md`
  - Evidência: alteração no texto de resumo
  - Confiança: alta

### feat
- Atualizado o arquivo `.brv/facts/project/project_facts.md` para consolidar fatos do projeto, incluindo stack, billing, autenticação, banco de dados e organização de documentação.
  - Arquivos: `.brv/context-tree/facts/project/project_facts.md`
  - Evidência: mudança no conteúdo de resumo
  - Confiança: alta

## 2026-05-16

### refactor
- Atualizado tokens de design e estilos para o sistema de design Convoca
  - Arquivos: `/.brv/_queue_status.json`, `/.brv/context-tree/_manifest.json`
  - Confiança: alta

### feat
- Documentação de fatos duráveis do projeto Convoca, incluindo configurações de sorteio, configurações de evento, rankings, finanças, convites, papéis de membros, RSVP, votação, ações de partida, busca de usuários e ciclo de vida do evento
  - Arquivos: `/.brv/context-tree/facts/project/project_facts.md`, `/.brv/context-tree/facts/project/project_facts.abstract.md`, `/.brv/context-tree/facts/project/project_facts.overview.md`
  - Confiança: alta

### feat
- Documentação de fatos do projeto relacionados a Stripe, PostgreSQL, autenticação e backups
  - Arquivos: `/.brv/review-backups/facts/project/project_facts.md`
  - Confiança: alta

### feat
- Atualização de cores e estilos na página do dashboard
  - Arquivos: `src/app/(app)/dashboard/page.tsx`
  - Confiança: alta

## 2026-05-16

### feat
- Melhoria na página do grupo com detalhes do próximo evento e controles de administrador
  - Arquivos: `src/app/(app)/groups/[groupId]/page.tsx`, `src/app/(app)/dashboard/page.tsx`
  - Confiança: alta

## 2026-05-14

### feat
- Melhorada a lógica de filtragem por temporada e atualização da UI para seleção de temporada. Agora, o sistema trata o valor "all" para exibir todas as temporadas e ajusta o nome exibido na interface. Arquivos: `page.tsx`, `rankings-card.tsx`, `route.ts`. Confiança: alta

### refactor
- Simplificado o código para manipulação do parâmetro `seasonId`, consolidando o tratamento do valor "all" e removendo redundâncias. Arquivos: `route.ts`, `rankings-card.tsx`. Confiança: alta

## 2026-05-14

### fix
- Corrigido erro de digitação na seção de arquitetura do README
  - Arquivos: `docs/README.md`
  - Evidência: correção de texto na seção "02. Architecture"
  - Confiança: alta

## 2026-05-14

### feat
- Adicionado configuração de critérios de desempate (tiebreakers) na classificação e rankings, permitindo personalização da ordem de critérios como vitórias, saldo, gols, jogos, assistências e MVPs.
  - Arquivos: `src/app/api/groups/[groupId]/rankings/route.ts`, `src/app/api/groups/[groupId]/scoring-config/route.ts`, `src/components/group/rankings-card.tsx`, `src/components/groups/scoring-config-form.tsx`
  - Evidência: implementação de lógica de ordenação com critérios configuráveis e novos campos de configuração.
  - Confiança: alta

## 2026-05-13

### docs
- Atualizadas as instruções de migração para maior clareza e rastreabilidade
  - Arquivos: `.github/copilot-instructions.md`, `AGENTS.md`, `README.md`, `src/db/MIGRATION_WORKFLOW.md`, `src/db/README.md`, `src/db/migrations/README.md`
  - Confiança: alta

## 2026-05-13

### feat
- Adicionadas scripts iniciais de setup e verificação para gerenciamento de usuários no banco de dados
  - Arquivos: `.github/copilot-instructions.md`, `src/db/migrations/schema.sql`
  - Evidência: commit e alterações nos scripts de setup
  - Confiança: alta

## 2026-05-13

### feat
- Melhorias no componente ChargesDataTable com design responsivo e opções de filtragem aprimoradas
  - Arquivos: `src/components/payments/charges-data-table.tsx`
  - Confiança: alta

### refactor
- Ajustes no componente UpcomingEventsCard para melhorar layout e responsividade
  - Arquivos: `src/components/group/upcoming-events-card.tsx`
  - Confiança: alta

## 2026-05-13

### chore
- Limpeza na estrutura de código e remoção de blocos de código não utilizados
  - Arquivos: `migration.log`
  - Evidência: commit "chore: clean up code structure and remove unused code blocks"
  - Confiança: alta

## 2026-05-13

### feat
- Implementado componente FloatingAgentBubble com chat flutuante para grupos, incluindo store de chat do agente.
  - Arquivos: `src/components/agent/FloatingAgentBubble.tsx`, `src/lib/stores/agent-chat-store.ts`
  - Confiança: alta

## 2026-05-13

### feat
- Adicionada ferramenta `query_data` para execução de consultas SQL SELECT personalizadas com filtro por `group_id`.
  - Arquivos: `src/lib/agent/tools/read-query.ts`, `src/lib/agent/tools/index.ts`
  - Confiança: alta

## 2026-05-13

### feat
- Melhorada a responsividade das abas de configurações do grupo, ajustando layout e estilos no componente `group-settings-tabs.tsx`. As abas agora usam flex-wrap e classes de tamanho ajustável para melhor adaptação em diferentes tamanhos de tela.
  - Arquivos: `src/components/groups/group-settings-tabs.tsx`
  - Confiança: alta

### fix
- Atualizado o carregamento do contexto do grupo para incluir cálculo de pontuação, resultados de partidas e estatísticas de jogadores, com melhorias na consulta SQL para maior clareza e desempenho.
  - Arquivos: `src/lib/agent/context-loader.ts`
  - Evidência: adição de novas subconsultas e ajustes na lógica de pontuação e resultados
  - Confiança: alta

## 2026-05-13

### feat
- Implementada carga e formatação do contexto do grupo para uso na prompt do sistema.
  - Arquivos: `src/app/api/agent/chat/route.ts`, `src/lib/agent/context-loader.ts`, `src/lib/agent/system-prompt.ts`
  - Evidência: adição de funções para carregar e formatar o contexto do grupo, além de injetar os dados no prompt.
  - Confiança: alta

## 2026-05-13

### feat
- Implementada lógica de timeout de 90 segundos na chamada OpenAI para evitar streams pendurados. Inclui logs de aviso ao atingir o timeout.
  - Arquivos: `src/app/api/agent/chat/route.ts`
  - Evidência: adição de `AbortController`, `setTimeout`, e logs relacionados
  - Confiança: alta

### feat
- Adicionados logs de informações durante o fluxo de chat, incluindo autenticação, acesso ao grupo, quota, início de chamada OpenAI, chamadas de ferramentas e conclusão da stream.
  - Arquivos: `src/app/api/agent/chat/route.ts`
  - Evidência: múltiplas chamadas a `logger.info` ao longo do código
  - Confiança: alta

### feat
- Incluído controle de evento "done" na interface de chat para detectar encerramentos inesperados da stream e exibir mensagem de erro ao usuário.
  - Arquivos: `src/components/agent/ChatInterface.tsx`
  - Evidência: adição da variável `receivedDone` e lógica de verificação após o loop de streaming
  - Confiança: alta

## 2026-05-12

### feat
- Melhorada a visualização de resultados com componentes de tabela do shadcn/ui para exibição de dados em formato tabular
  - Arquivos: `src/components/agent/ToolCallCard.tsx`
  - Confiança: alta

## 2026-05-12

### feat
- Adicionadas páginas de pagamentos, configurações, participação e nova página de grupo
  - Arquivos: `app/groups/[groupId]/payments/page.tsx`, `app/groups/[groupId]/settings/page.tsx`, `app/groups/join/page.tsx`, `app/groups/[groupId]/page.tsx`
  - Confiança: alta

### chore
- Incluído o pacote `@radix-ui/react-tooltip` na dependência do projeto
  - Arquivos: `package.json`, `pnpm-lock.yaml`
  - Evidência: adição explícita na configuração de dependências
  - Confiança: alta

### refactor
- Removidas referências ao componente `DashboardHeader` de várias páginas, incluindo admin, dashboard, eventos, grupos e chat
  - Arquivos: múltiplos, como `src/app/admin/agent/page.tsx`, `src/app/admin/page.tsx`, `src/app/dashboard/loading.tsx`, `src/app/groups/[groupId]/page.tsx`, entre outros
  - Confiança: alta

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
