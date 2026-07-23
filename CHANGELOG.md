# Changelog

Gerado aautomaticamente por IA a cada push no `main`.

## 2026-07-23

### feat
- Implementada funcionalidade de exportação de PDF no componente RankingsCard para plataformas nativas usando Capacitor Filesystem e Share. Agora, o arquivo é salvo no dispositivo e compartilhado via sistema nativo em iOS/Android.
  - Arquivos: `src/components/group/rankings-card.tsx`
  - Evidência: uso de Capacitor Filesystem e Share para manipulação e compartilhamento de arquivos em plataformas nativas.
  - Confiança: alta

## 2026-07-23

### fix
- Adicionada rota `/download` como rota pública no middleware
  - Arquivos: `src/proxy.ts`
  - Evidência: inclusão de "/download" na lista de rotas públicas
  - Confiança: alta

## 2026-07-23

### fix
- Corrigido redirecionamento server-side por User-Agent na página de download para dispositivos iOS e Android
  - Arquivos: `src/app/download/page.tsx`
  - Evidência: alteração do método de detecção de dispositivo de client-side para server-side usando headers
  - Confiança: alta

## 2026-07-22

### fix
- Corrigido alias `AppTheme` no arquivo `styles.xml` do Android para garantir compatibilidade com o AndroidManifest.xml
  - Arquivos: `android/app/src/main/res/values/styles.xml`
  - Evidência: adição do alias `<style name="AppTheme" ... />`
  - Confiança: alta

## 2026-07-22

### fix
- Ajustes na configuração do Android para compatibilidade com a versão 2.3, incluindo habilitação de minificação e atualização do arquivo ProGuard.
  - Arquivos: `android/app/build.gradle`, `android/app/proguard-rules.pro`
  - Evidência: modificação de `minifyEnabled` para true e atualização das regras de ProGuard
  - Confiança: alta

### refactor
- Inclusão da chamada `EdgeToEdge.enable(this)` na `MainActivity` para suporte a layout edge-to-edge.
  - Arquivos: `android/app/src/main/java/com/convoca/app/MainActivity.java`
  - Confiança: alta

### style
- Atualização do tema `AppTheme.NoActionBar` para tornar as barras do sistema transparentes, suportando layout edge-to-edge.
  - Arquivos: `android/app/src/main/res/values/styles.xml`
  - Confiança: alta

## 2026-07-22

### chore
- Atualizado `compileSdkVersion` e `targetSdkVersion` para 36 no projeto Android
  - Arquivos: `android/variables.gradle`
  - Confiança: alta

## 2026-07-21

### feat
- Adicionados badges oficiais do App Store e Google Play no hero da landing, abaixo do placar. As mudanças envolvem ajustes na estrutura do layout e inclusão dos componentes de badges, garantindo maior visibilidade no primeiro viewport.
  - Arquivos: `src/app/page.tsx`, `src/components/marketing/store-download-cards.tsx`
  - Evidência: inclusão do componente `<StoreDownloadCards />` na seção do hero e alterações na estrutura do layout
  - Confiança: alta

## 2026-07-21

### fix
- Excluído `docs/contexto-visual` do typecheck do Next para melhorar o desempenho da compilação
  - Arquivos: `tsconfig.json`
  - Evidência: alteração na configuração de `exclude`
  - Confiança: alta

## 2026-07-21

### fix
- Removido `</section>` duplicado que causava erro na build no arquivo `src/app/page.tsx`  
  - Evidência: remoção do trecho duplicado no diff  
  - Confiança: alta

## 2026-07-21

### feat
- Adicionado banner de cookies e cards de download App Store / Play Store na landing page
  - Arquivos: `.gitignore`
  - Confiança: alta

## 2026-07-18

### feat
- Implementada página de Central de Ajuda com documentação completa, incluindo seções de perguntas frequentes e contato. Arquivos: `src/app/(app)/ajuda/page.tsx`. Confiança: alta

## 2026-07-17

### feat
- Adicionados tours de onboarding no dashboard e na página de evento para usuários com ou sem grupos.  
  - Arquivos: `src/components/tour/DashboardTour.tsx`, `src/components/tour/EventTour.tsx`  
  - Confiança: alta

## 2026-07-17

### fix
- Corrigida violação das Rules of Hooks ao usar hooks condicionalmente em `FloatingAgentBubble`. Agora o hook `useEffect` é chamado apenas em renderizações válidas, evitando erro de hooks.
  - Arquivos: `src/components/agent/FloatingAgentBubble.tsx`
  - Evidência: uso condicional do hook `useEffect` foi removido, garantindo sua chamada incondicional
  - Confiança: alta

## 2026-07-17

### fix
- Movido o import do CSS do driver.js para o arquivo `globals.css` para evitar erro no React.
  - Arquivos: `src/app/globals.css`, `src/components/tour/GroupTour.tsx`
  - Evidência: alteração na importação do CSS, removendo do componente e adicionando ao global
  - Confiança: alta

## 2026-07-17

### feat
- Implementou um tour de onboarding para a página de grupo usando driver.js, com passos específicos para administradores e membros.
  - Arquivos: `src/components/tour/GroupTour.tsx`, `src/components/tour/group-tour-theme.css`, `src/app/(app)/groups/[groupId]/page.tsx`
  - Evidência: adição do componente GroupTour, configuração dos passos e integração na página
  - Confiança: alta

## 2026-07-17

### feat
- Adicionou textos e botões explicativos em várias telas vazias para melhorar a orientação do usuário, incluindo componentes como `groups-card.tsx`, `upcoming-events-card.tsx`, `match-timeline.tsx`, `stats-tab.tsx`, `teams-tab.tsx`, `rankings-card.tsx`, `group/upcoming-events-card.tsx` e `invites-manager.tsx`.
  - Arquivos: `src/components/dashboard/groups-card.tsx`, `src/components/dashboard/upcoming-events-card.tsx`, `src/components/events/match-timeline.tsx`, `src/components/events/stats-tab.tsx`, `src/components/events/teams-tab.tsx`, `src/components/group/rankings-card.tsx`, `src/components/group/upcoming-events-card.tsx`, `src/components/groups/invites-manager.tsx`
  - Confiança: alta

## 2026-07-17

### feat
- Corrigidos contratos de tracking e adicionados novos funis de analytics em várias páginas e componentes, incluindo cadastro, convite, chat, entrada do agente e formulário de RSVP.
  - Arquivos: `src/lib/mobile/analytics.ts`, `src/app/auth/signup/page.tsx`, `src/app/invite/[code]/invite-tracker.tsx`, `src/app/invite/[code]/page.tsx`, `src/components/agent/ChatInterface.tsx`, `src/components/agent/FloatingAgentBubble.tsx`, `src/components/events/event-rsvp-form.tsx`, `src/components/groups/join-group-form.tsx`
  - Confiança: alta

## 2026-07-17

### feat
- Implementada coluna de `idempotency_key` na tabela `charges` para prevenir duplicatas na criação de cobranças pelo agente.
  - Arquivos: `src/db/migrations/20260717_charges_idempotency_key.sql`, `src/lib/agent/tools/write-finance.ts`
  - Evidência: adição de coluna e índice único com condição de não nulos
  - Confiança: alta

### fix
- Preservado código de convite no fluxo de login e cadastro na página de signin/signup.
  - Arquivos: `src/app/auth/signin/page.tsx`, `src/app/auth/signup/page.tsx`
  - Evidência: ajustes no uso de `callbackUrl` e redirecionamentos
  - Confiança: alta

### feat
- Adicionado componente `GroupStatusNotice` com mensagens específicas para grupos em análise, incluindo ações para administradores.
  - Arquivos: `src/components/groups/group-status-notice.tsx`
  - Evidência: implementação de condição para status "pending" com conteúdo diferenciado
  - Confiança: alta

### fix
- Atualizado componente de página de convite para exibir links de login ou cadastro com callback para a URL de entrada.
  - Arquivos: `src/app/invite/[code]/page.tsx`
  - Evidência: alteração na estrutura de links de navegação
  - Confiança: alta

### refactor
- Modificado o componente de SignInPage para usar `Suspense` e separar o conteúdo de renderização.
  - Arquivos: `src/app/auth/signin/page.tsx`
  - Evidência: introdução de componente `SignInContent` envolvido por `Suspense`
  - Confiança: alta

### refactor
- Modificado o componente de SignUpPage para usar `Suspense` e separar o conteúdo de renderização.
  - Arquivos: `src/app/auth/signup/page.tsx`
  - Evidência: introdução de componente `SignUpContent` envolvido por `Suspense`
  - Confiança: alta

## 2026-07-16

### feat
- Implementada deep linking via Universal Links e App Links, incluindo configurações em `next.config.ts` e rotas específicas para arquivos `apple-app-site-association` e `assetlinks.json`. Arquivos afetados: `next.config.ts`, `src/app/api/well-known/aasa/route.ts`, `src/app/api/well-known/assetlinks/route.ts`. Confiança: alta

### feat
- Adicionado suporte a links de convite com código na URL, incluindo página de convite em `src/app/invite/[code]/page.tsx` e atualização de componentes relacionados para usar o padrão `/invite/{code}`. Arquivos afetados: `src/app/invite/[code]/page.tsx`, `src/components/groups/invites-manager.tsx`, `src/components/groups/join-group-form.tsx`. Confiança: alta

## 2026-07-16

### fix
- Tornou a constraint `chk_player_identity` idempotente na tabela `championship_team_players`, garantindo que a restrição seja aplicada apenas uma vez.  
  - Arquivos: `src/db/migrations/20260716_championship_guest_players.sql`  
  - Evidência: uso de bloco PL/pgSQL com tratamento de exceção para `duplicate_object`  
  - Confiança: alta

## 2026-07-16

### feat
- Adiciona jogadores avulsos ao campeonato "FUTLIPPE + CHURRASCO" criando três times com jogadores predefinidos
  - Arquivos: `src/db/migrations/20260716_futlippe_players.sql`
  - Confiança: alta

## 2026-07-16

### feat
- Implementada funcionalidade para vincular jogadores avulsos (sem cadastro) a times em campeonatos. Arquivos: `route.ts`, `championship-detail.tsx`. Confiança: alta

## 2026-07-16

### feat
- Implementada funcionalidade para registrar gols individuais com artilheiro e assistência em partidas de campeonato
  - Arquivos: `src/app/api/groups/[groupId]/championships/[championshipId]/matches/[matchId]/goals/route.ts`, `src/components/championships/championship-detail.tsx`
  - Evidência: adição de endpoint POST para registro de gols e atualização do componente de detalhes do campeonato
  - Confiança: alta

## 2026-07-16

### feat
- Implementada página /download com redirecionamento inteligente para App Store ou Play Store
  - Arquivos: `src/app/download/page.tsx`
  - Confiança: alta

## 2026-07-16

### feat
- Implementada exclusão de grupo por admin com confirmação de nome
  - Arquivos: `src/app/api/groups/[groupId]/route.ts`, `src/components/groups/group-settings-tabs.tsx`
  - Evidência: adição da rota DELETE com validação de permissão e lógica de soft delete; interface de confirmação na UI
  - Confiança: alta

## 2026-07-16

### feat
- Implementada nova tela de loading para páginas de campeonato, evento e grupo, com skeletons animados para melhorar a experiência do usuário durante carregamentos pesados.
  - Arquivos: `src/app/(app)/groups/[groupId]/championships/loading.tsx`, `src/app/(app)/groups/[groupId]/events/loading.tsx`, `src/app/(app)/groups/[groupId]/loading.tsx`, `src/app/(app)/groups/[groupId]/page.tsx`
  - Confiança: alta

## 2026-07-15

### chore
- Atualizado o valor padrão da versão do aplicativo para 5.1.0 na configuração do fluxo de trabalho de release do iOS
  - Arquivos: `.github/workflows/ios-release.yml`
  - Confiança: alta

## 2026-07-15

### fix
- Corrigido crash na página de standings, melhorias de performance no SSR, e implementação do cancelamento de partidas e campeonatos.
  - Arquivos: `src/app/(app)/groups/[groupId]/championships/[championshipId]/page.tsx`, `src/app/api/groups/[groupId]/championships/[championshipId]/matches/[matchId]/route.ts`, `src/app/api/groups/[groupId]/championships/[championshipId]/route.ts`, `src/app/api/groups/[groupId]/championships/[championshipId]/generate-rounds/route.ts`, `src/components/championships/championship-detail.tsx`
  - Evidência: alterações nos métodos de consulta, inclusão de ações de cancelamento e melhorias de performance
  - Confiança: alta

## 2026-07-14

### chore
- Atualizado o valor padrão de `APP_VERSION` para 5.0.0 na configuração do fluxo de trabalho de release do iOS.
  - Arquivos: `.github/workflows/ios-release.yml`
  - Evidência: alteração no default e na descrição do input `app_version`
  - Confiança: alta

## 2026-07-14

### fix
- Corrigidos bugs críticos relacionados às partidas de campeonato, incluindo validações na confirmação de presença e na exclusão de times que já disputaram partidas
  - Arquivos: `src/app/api/events/[eventId]/rsvp/route.ts`, `src/app/api/groups/[groupId]/championships/[championshipId]/teams/[teamId]/route.ts`, `src/app/api/groups/[groupId]/championships/[championshipId]/matches/[matchId]/route.ts`
  - Evidência: adição de validações específicas para partidas de campeonato e restrições na exclusão de times
  - Confiança: alta

### feat
- Melhorias de UX na página de detalhes do campeonato, incluindo a adição de componentes para exibição de status ao vivo, classificação, artilheiros, meus jogos e campeões
  - Arquivos: `src/components/championships/championship-detail.tsx`
  - Confiança: alta

## 2026-07-13

### fix
- Impedida a criação de eventos duplicados para a mesma recorrência e data, ajustando a lógica de cancelamento e atualização de recurrence_id nos eventos. Além disso, foi criado um índice único para garantir a integridade dos dados.
  - Arquivos: `src/db/migrations/20260713_unique_recurring_event_per_date.sql`, `src/lib/recurrences.ts`
  - Evidência: alteração na query de atualização e criação de índice único
  - Confiança: alta

## 2026-07-11

### fix
- Ajustada a lógica de redirecionamento do checkout Stripe para plataformas móveis usando deep links, garantindo melhor integração com aplicativos nativos.
  - Arquivos: `src/app/api/stripe/checkout/route.ts`, `src/components/groups/payment-button.tsx`
  - Evidência: modificação na geração de URLs de sucesso e cancelamento com base na plataforma
  - Confiança: alta

## 2026-07-11

### feat
- Separou as lanes de build e upload do Android em lanes distintas no Fastlane, com descrições específicas para cada uma.
  - Arquivos: `fastlane/Fastfile`
  - Confiança: alta

## 2026-07-11

### fix
- Corrigido o script de criação do arquivo `release.properties` para usar `printf` sem BOM ou indentação, garantindo maior compatibilidade e clareza no arquivo gerado.
  - Arquivos: `.github/workflows/android-release.yml`
  - Evidência: alteração na geração do arquivo com `printf`
  - Confiança: alta

## 2026-07-11

### fix
- Atualizado a versão do Java para 21 no workflow de Android, devido ao requisito do capacitor-android >= 7.
  - Arquivos: `.github/workflows/android-release.yml`
  - Evidência: alteração na configuração do Java de 17 para 21
  - Confiança: alta

## 2026-07-11

### fix
- Ajustado o script de CI para garantir permissão de execução no arquivo `gradlew` antes do build Android
  - Arquivos: `.github/workflows/android-release.yml`
  - Evidência: adição do comando `chmod +x android/gradlew` antes do passo de build
  - Confiança: alta

## 2026-07-11

### fix
- Removido o uso do `cross-env` no comando de sincronização do Android no Fastfile, ajustando para usar sintaxe nativa do Linux.
  - Arquivos: `fastlane/Fastfile`
  - Evidência: alteração do comando `sh("cd #{ROOT} && cross-env CAPACITOR_PLATFORM=android npx cap sync android")` para `sh("cd #{ROOT} && CAPACITOR_PLATFORM=android npx cap sync android")`
  - Confiança: alta

## 2026-07-11

### feat
- Adicionado workflow de release Android para build AAB e upload na Play Store (internal testing). Arquivos: `.github/workflows/android-release.yml`, `fastlane/Fastfile`
  - Evidência: novo arquivo de workflow e alteração no Fastfile indicam implementação de pipeline de release
  - Confiança: alta

## 2026-07-11

### feat
- Implementada a página de configurações com habilitação de notificações push no app.
  - Arquivos: `src/app/(app)/settings/page.tsx`, `src/components/settings/notification-settings.tsx`, `src/components/layout/AppSidebar.tsx`
  - Confiança: alta

## 2026-07-11

### feat
- Implementado módulo de eliminatórias (single_elimination) para geração de fases e partidas, incluindo lógica para BYEs e avanço automático de times.  
  - Arquivos: `src/app/api/groups/[groupId]/championships/[championshipId]/generate-rounds/route.ts`, `src/lib/single-elimination.ts`  
  - Confiança: alta

### fix
- Ajustada ordenação e agrupamento de dados em páginas de detalhes de campeonato e rodadas, incluindo adição de campo `matchPosition` para melhor ordenação.  
  - Arquivos: `src/app/(app)/groups/[groupId]/championships/[championshipId]/page.tsx`, `src/app/api/groups/[groupId]/championships/[championshipId]/rounds/route.ts`  
  - Confiança: alta

### refactor
- Melhorias na lógica de geração de rounds para suportar formato de eliminação simples, separando etapas de criação de rounds, partidas e slots de vencedores.  
  - Arquivos: `src/app/api/groups/[groupId]/championships/[championshipId]/generate-rounds/route.ts`  
  - Confiança: alta

### fix
- Corrigido comportamento de atualização automática de vencedores em partidas de eliminação simples após pontuação, incluindo avanço de times e atualização de partidas subsequentes.  
  - Arquivos: `src/app/api/groups/[groupId]/championships/[championshipId]/matches/[matchId]/route.ts`  
  - Evidência: lógica de avanço automático implementada e testada  
  - Confiança: alta

## 2026-07-11

### feat
- Adicionado endpoint GET /api/mobile/push-token para inspecionar tokens registrados
  - Arquivos: `src/app/api/mobile/push-token/route.ts`
  - Evidência: implementação da função GET que consulta tokens do usuário autenticado
  - Confiança: alta

## 2026-07-11

### feat
- Implementado módulo completo de campeonatos, incluindo fases 1 e 2, e UI da fase 3
  - Arquivos: `src/app/(app)/groups/[groupId]/championships/page.tsx`, `src/app/(app)/groups/[groupId]/championships/[championshipId]/page.tsx`
  - Confiança: alta

### feat
- Adicionado disparo de notificações para os 5 eventos faltantes e endpoint de teste
  - Arquivos: `src/app/api/events/[eventId]/admin-rsvp/route.ts`, `src/app/api/events/[eventId]/draw/route.ts`, `src/app/api/events/[eventId]/rsvp/route.ts`
  - Evidência: inclusão de chamadas para `sendPushToUser` e logs de notificação
  - Confiança: alta

## 2026-07-08

### fix
- Tornou o `measurementId` opcional até que o GA4 seja conectado, ajustando o arquivo `src/lib/mobile/analytics.ts`.
  - Arquivos: `src/lib/mobile/analytics.ts`
  - Evidência: alteração na leitura da variável de ambiente e na lógica de inicialização do Firebase
  - Confiança: alta

## 2026-07-08

### feat
- Implementada integração do Firebase Analytics para atribuição de marketing e eventos de uso na plataforma.
  - Arquivos: `src/lib/mobile/analytics.ts`, `src/components/auth/signup/page.tsx`, `src/components/groups/create-group-form.tsx`, `src/components/groups/group-billing-tab.tsx`, `src/components/groups/invites-manager.tsx`, `src/components/groups/payment-button.tsx`, `src/components/providers/auth-provider.tsx`
  - Confiança: alta

## 2026-07-07

### fix
- Corrigidas verificações de autenticação nos endpoints de rotas cron para evitar erros de autorização quando a variável de ambiente `CRON_SECRET` estiver indefinida
  - Arquivos: `src/app/api/cron/generate-monthly-charges/route.ts`, `src/app/api/cron/generate-recurring-events/route.ts`, `src/app/api/cron/notify-event-reminders/route.ts`, `src/app/api/cron/notify-payment-reminders/route.ts`
  - Evidência: alteração na condição de verificação de `authHeader` e `auth`
  - Confiança: alta

### feat
- Adicionado validação de status ao atualizar evento na rota `[eventId]`, permitindo apenas valores válidos (`scheduled`, `live`, `finished`, `canceled`)
  - Arquivo: `src/app/api/events/[eventId]/route.ts`
  - Confiança: alta

### fix
- Melhorada a segurança na consulta de cobranças de grupo, restringindo o acesso de membros comuns às suas próprias cobranças
  - Arquivo: `src/app/api/groups/[groupId]/charges/route.ts`
  - Evidência: validação adicional de `userId` na resposta
  - Confiança: alta

### feat
- Geração de senha padrão para novos membros do grupo agora utiliza `randomBytes` para maior segurança
  - Arquivo: `src/app/api/groups/[groupId]/members/create-user/route.ts`
  - Confiança: alta

## 2026-07-07

### feat
- Implementado sistema completo de notificações push com 7 tipos diferentes, acionados por cron jobs via Vercel. Arquivos principais: `src/app/api/cron/notify-event-reminders/route.ts`, `src/app/api/cron/notify-payment-reminders/route.ts`, `src/app/api/events/[eventId]/route.ts`. Confiança: alta

## 2026-07-01

### feat
- Adiciona suporte internacional para mercados DE (Alemanha) e AU (Austrália), incluindo novas listagens de loja, textos de ficha de loja e instruções de publicação.
  - Arquivos: `docs/mobile-convoca/STORE_LISTINGS_INTERNATIONAL.md`, `src/app/impressum/page.tsx`, `src/app/privacidade/page.tsx`
  - Confiança: alta

## 2026-06-30

### feat
- Adicionada uma descrição detalhada do sistema de faturamento e portabilidade de banco de dados na documentação de arquitetura.
  - Arquivos: `.brv/context-tree/architecture/billing-system-and-database-portability.md`, `.brv/context-tree/_index.md`, `.brv/context-tree/_manifest.json`
  - Confiança: alta

## 2026-06-27

### fix
- Atualizada a seção de notas de revisão na documentação de submissão para a App Store, incluindo instruções de exclusão de conta e detalhes sobre funcionalidades financeiras. Alterações no arquivo `APP_STORE_CONNECT_SUBMISSION.md`.
  - Arquivos: `docs/mobile-convoca/APP_STORE_CONNECT_SUBMISSION.md`
  - Confiança: alta

### feat
- Implementada opção de exclusão de conta direta no app na página de exclusão, com mensagem de confirmação e instruções claras para o usuário. Arquivo `src/app/excluir-conta/page.tsx`.
  - Arquivos: `src/app/excluir-conta/page.tsx`
  - Confiança: alta

## 2026-06-27

### fix
- Atualizado checklist de rejeições da Apple para incluir correções de layout no iPad (Guideline 4) e esclarecimento sobre o modelo de negócio (Guideline 2.1b). 
  - Arquivos: `docs/mobile-convoca/CHECKLIST.md`, `docs/playbooks/app-store-review-rejeicoes/README.md`
  - Evidência: inclusão de detalhes técnicos e orientações para evitar rejeições relacionadas a layout e informações de negócio
  - Confiança: alta

## 2026-06-27

### fix
- Corrigido botão de sair cortado no iPad ajustando safe area insets e viewport fit
  - Arquivos: `src/app/layout.tsx`, `src/components/layout/AppSidebar.tsx`
  - Evidência: alterações em safe area insets e estilos de layout
  - Confiança: alta

## 2026-06-26

### fix
- Remove conta in-app e páginas legais com conteúdo jurídico na plataforma iOS.
  - Arquivos: `docs/mobile-convoca/APP_STORE_CONNECT_SUBMISSION.md`
  - Evidência: commit que adiciona o arquivo de submissão e mensagem de correção
  - Confiança: alta

## 2026-06-23

### feat
- Melhorada a rota de finalização de temporada com tipos TypeScript mais precisos e compatibilidade com PostgreSQL
  - Arquivos: `src/app/api/groups/[groupId]/seasons/[seasonId]/finish/route.ts`
  - Evidência: alteração do tipo `RankingRow` para uma definição concreta e tipagem explícita do `sql<RankingRow[]>`
  - Confiança: alta

### chore
- Atualizado arquivo `.brv/dream-state.json` para refletir incremento no contador de curadorias desde o último sonho
  - Arquivos: `.brv/dream-state.json`
  - Confiança: alta

### docs
- Documentação do fix na rota de finalização de temporada, detalhando melhorias na tipagem e compatibilidade com PostgreSQL
  - Arquivos: `.brv/context-tree/facts/project/season_finish_route_fix.md`
  - Confiança: alta

## 2026-06-23

### feat
- Atualizou a lógica de ranking e cálculos de estatísticas para goleiros, incluindo a mudança de ordenação para por gols sofridos. Também adicionou documentação de fatos curados.
  - Arquivos: `.brv/_queue_status.json`, `.brv/context-tree/_manifest.json`, `.brv/context-tree/facts/project/curated_facts.md`, `.brv/context-tree/facts/project/curated_facts.abstract.md`, `.brv/context-tree/facts/project/curated_facts.overview.md`, `src/app/(app)/groups/[groupId]/page.tsx`, `src/app/api/groups/[groupId]/rankings/route.ts`, `src/app/api/groups/[groupId]/stats/route.ts`, `src/app/api/groups/[groupId]/seasons/[seasonId]/finish/route.ts`
  - Confiança: alta

## 2026-06-23

### feat
- Adicionado suporte a deep links, AASA, assetlinks e proxy público para /.well-known
  - Arquivos: `README.md`
  - Confiança: alta

## 2026-06-22

### fix
- Corrigido crash ao abrir o app iOS devido à ausência do arquivo GoogleService-Info.plist no bundle. Agora, o arquivo é referenciado corretamente em `project.pbxproj`, evitando o crash na configuração do Firebase.  
  - Arquivos: `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/App/AppDelegate.swift`, `src/lib/mobile/push-notifications.ts`  
  - Evidência: inclusão do arquivo no projeto Xcode e remoção do `FirebaseApp.configure()` no código  
  - Confiança: alta

## 2026-06-22

### fix
- Ajustado o Podfile do iOS para usar paths hoisted padrão do pnpm e Firebase
  - Arquivos: `ios/App/Podfile`, `.github/workflows/ios-release.yml`, `scripts/fix-ios-podfile-paths.mjs`, `package.json`
  - Evidência: alteração na requisição do Podfile e na execução do script de normalização de paths
  - Confiança: alta

## 2026-06-22

### fix
- Removido stub do Firebase Messaging para builds web no Vercel, garantindo que o app iOS carregue o JS da Vercel corretamente.
  - Arquivos: `next.config.ts`, `src/lib/mobile/stubs/capacitor-firebase-messaging.ts`
  - Evidência: exclusão do arquivo de stub e ajuste na configuração do Next.js
  - Confiança: alta

## 2026-06-22

### fix
- Stub do Firebase Messaging foi configurado para evitar resolução no deploy Vercel, afetando arquivos `next.config.ts` e `webpack`.  
  - Arquivos: `next.config.ts`  
  - Evidência: adição de alias de stub para Firebase Messaging  
  - Confiança: alta

### feat
- Inclusão da dependência `firebase` na versão `11.10.0` no `package.json` e lockfile, preparando o projeto para uso do Firebase Messaging.  
  - Arquivos: `package.json`, `pnpm-lock.yaml`  
  - Confiança: alta

## 2026-06-22

### fix
- Implementado uso do Firebase Messaging para obter o token FCM no iOS, substituindo o plugin antigo `@capacitor/push-notifications`.
  - Arquivos: `ios/App/App/AppDelegate.swift`, `capacitor.config.ts`, `src/lib/mobile/push-notifications.ts`
  - Evidência: alterações no AppDelegate.swift para configurar Firebase e passar o token ao Capacitor, além da remoção do plugin de push antigo.
  - Confiança: alta

### feat
- Atualizado o projeto para remover o plugin de push notifications antigo e incluir o Firebase Messaging para suporte a tokens FCM no iOS.
  - Arquivos: `android/app/capacitor.build.gradle`, `android/capacitor.settings.gradle`, `capacitor.config.ts`, `package.json`, `pnpm-lock.yaml`
  - Confiança: alta

### docs
- Incluído no checklist a necessidade de testar push no iOS após o fix do token FCM, com build ≥ 3.
  - Arquivos: `docs/mobile-convoca/CHECKLIST.md`
  - Confiança: alta

## 2026-06-22

### chore
- Atualizado status do checklist do iOS para "TestFlight build 2 + login OK"
  - Arquivos: `docs/mobile-convoca/CHECKLIST.md`
  - Confiança: alta

## 2026-06-22

### fix
- Ajustado o workflow de build iOS para usar o `run_number` do CI como `build_number` quando este estiver vazio, evitando duplicação do `CFBundleVersion`.
  - Arquivos: `.github/workflows/ios-release.yml`
  - Evidência: alteração na lógica de definição do `BUILD_NUMBER` para usar `github.run_number` se `build_number` não for fornecido
  - Confiança: alta

## 2026-06-22

### fix
- Desabilitado CapacitorHttp e CapacitorCookies no iOS para login NextAuth na WKWebView, evitando conflito com o cookie jar nativo (`HTTPCookieStorage`). Essa alteração garante que o login funcione corretamente no iOS usando a WebView pura.
  - Arquivos: `capacitor.config.ts`, `fastlane/Fastfile`, `package.json`
  - Evidência: alteração na configuração de plugins e comandos de build
  - Confiança: alta

### docs
- Atualizado checklist de build no TestFlight para indicar que o login na WebView com cookie NextAuth foi corrigido após o commit de desabilitação do CapacitorHttp/Cookies no iOS.
  - Arquivos: `docs/mobile-convoca/CHECKLIST.md`
  - Confiança: alta

### docs
- Incluído no README do playbook de CI a instrução de desligar CapacitorHttp/CapacitorCookies no iOS durante o processo de build, usando a variável `CAPACITOR_PLATFORM=ios` para garantir o funcionamento do login.
  - Arquivos: `docs/playbooks/ios-ci-sem-mac/README.md`
  - Confiança: alta

## 2026-06-22

### chore
- Atualizado o checklist de build iOS para o release 1.0.0 no TestFlight
  - Arquivos: `docs/mobile-convoca/CHECKLIST.md`
  - Confiança: alta

## 2026-06-22

### docs
- Documentadas lições aprendidas ao configurar o Fastfile para iOS CI, incluindo uso de caminhos absolutos, assinatura manual, separação de pod install, e requisitos de API Key.
  - Arquivos: `docs/playbooks/ios-ci-sem-mac/README.md`
  - Confiança: alta

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
