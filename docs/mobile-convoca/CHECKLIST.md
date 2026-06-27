# Checklist - Convoca Android / Play Store primeiro

Ultima atualizacao: 2026-06-22.

Escopo atual: Android em analise na Google Play (enviado 2026-06-19). iOS em progresso via GitHub Actions (sem Mac) — secrets configurados, aguardando bootstrap do fastlane match.

Status geral: ENVIADO PARA ANALISE da Google em 2026-06-19 (release ConvocaR01). Push validado de ponta a ponta, paginas legais publicas, formularios de compliance preenchidos. Aguardando aprovacao (1-3 dias).

Identidade:

- App ID / package: `com.uzzai.convoca`  (ALTERADO de `com.convoca.app` — nome estava reservado/em uso na Play; namespace interno Java segue `com.convoca.app`)
- Nome: `Convoca`
- WebView de producao: `https://convoca.uzzai.com.br`
- Estrategia: Capacitor com `server.url` ao vivo e `webDir: out` como fallback
- Atualizacoes web/API: deploy em `convoca.uzzai.com.br`; nova Play Store release so para mudancas nativas/Capacitor/Android/iOS.
- Vercel de producao: projeto `convoca` (nao `peladeiros`); secrets via Doppler prd -> sync Vercel
- Firebase: projeto `convoca-app-uzzai-2b530`

## Fase 0 - Contas e decisoes

- [x] Estrategia Android definida: `server.url` + fallback local
- [x] App ID definido: `com.uzzai.convoca`
- [x] Dominio da WebView definido: `https://convoca.uzzai.com.br`
- [x] Politica de Privacidade publicada em URL publica (`/privacidade` retorna 200 sem login)
- [x] Termos de Uso publicados em URL publica (`/termos` 200)
- [x] Pagina `/privacidade` criada no app
- [x] Pagina `/termos` criada no app
- [x] Pagina `/suporte` criada no app
- [x] Pagina `/lgpd` criada no app
- [x] Pagina `/excluir-conta` criada no app
- [x] Link de exclusao de conta adicionado em `/profile`
- [x] **Paginas legais tornadas PUBLICAS no `proxy.ts`** (antes davam HTTP 307 -> login; era bloqueador da loja)
- [x] Rascunho de listing criado em `docs/mobile-convoca/STORE_LISTING_DRAFT.md`
- [x] Conta Google Play Console criada (org Uzz.Ai Ltda)
- [x] Usuario demo criado e POPULADO para revisao (`demo.review@convoca.uzzai.com.br` / `ConvocaDemo2026`) — grupo "Pelada dos Cracks" (ativo) + 10 membros + evento futuro com 11 confirmacoes

## Fase 1 - Setup Capacitor

- [x] Dependencias Capacitor instaladas (`@capacitor/core`, `android`, `ios`)
- [x] Plugins nativos instalados (`app`, `status-bar`, `network`, `splash-screen`, `push-notifications`, `camera`, `share`, `biometric-auth`)
- [x] Dev deps instaladas (`@capacitor/cli`, `@capacitor/assets`, `cross-env`)
- [x] `capacitor.config.ts` criado (appId `com.uzzai.convoca`)
- [x] `capacitor.config.ts` com `appId`, `appName`, `webDir` e `server.url`
- [x] `CapacitorCookies` e `CapacitorHttp` habilitados no **Android**; desligados no **iOS** (`CAPACITOR_PLATFORM=ios`) — ver playbook iOS login
- [x] Splash/status bar configurados com verde Convoca
- [x] `next.config.ts` com `output: "export"` condicional via `CAPACITOR_BUILD=true`
- [x] `images.unoptimized` condicional ao build mobile
- [x] Scripts mobile adicionados no `package.json`
- [x] Fallback mobile gerado em `out/index.html`
- [x] Projeto Android gerado em `android/`
- [x] Projeto iOS gerado em `ios/` (build/archive ainda exigem macOS)

## Fase 2 - Assets e build local

- [x] `assets/icon.png` criado
- [x] `assets/splash.png` criado
- [x] Recursos Android de icone/splash atualizados manualmente
- [x] `pnpm build:mobile` gera `out/index.html`
- [x] `pnpm cap:sync` sincroniza Android
- [x] TypeScript validado com `pnpm exec tsc --noEmit`
- [x] `pnpm build` (producao SSR via Doppler) valida igual a Vercel
- [x] APK debug compila com `gradlew assembleDebug`
- [x] AAB compila com `gradlew bundleRelease`
- [x] Templates de App Links criados em `docs/mobile-convoca/templates/`
- [x] App testado em device fisico (instalou APK debug e carregou `convoca.uzzai.com.br`)
- [x] Login testado dentro do app em device fisico (cookie/sessao NextAuth funcionando na WebView)

## Fase 3 - Features nativas MVP

- [x] Detector de plataforma criado em `src/lib/mobile/platform-detector.ts`
- [x] Inicializador nativo criado em `src/lib/mobile/native-shell.ts`
- [x] Deep link `convoca://` implementado no JS
- [x] Android App Links configurados para `convoca.uzzai.com.br` e `convoca.app`
- [x] Cliente de push criado em `src/lib/mobile/push-notifications.ts`
- [x] `AuthProvider` inicializa shell nativo e push quando autenticado
- [x] API route para salvar token criada em `src/app/api/mobile/push-token/route.ts`
- [x] Migration `push_tokens` criada em `src/db/migrations/20260610_add_push_tokens.sql`
- [x] `src/db/migrations/schema.sql` atualizado com `push_tokens`
- [x] Migration `20260610_add_push_tokens.sql` aplicada no banco (via `doppler run -p convoca -c prd`)
- [x] Firebase criado e app Android `com.uzzai.convoca` registrado (projeto `convoca-app-uzzai-2b530`)
- [x] `android/app/google-services.json` adicionado localmente (gitignored)
- [x] **Backend de envio criado**: `src/lib/mobile/fcm.ts` (FCM HTTP v1 via jose) + `/api/mobile/push/send`
- [x] Credenciais FCM no Doppler prd (`FIREBASE_SERVICE_ACCOUNT` + `FIREBASE_PROJECT_ID`, sync Vercel)
- [x] Push validado em device fisico (FCM HTTP 200 -> notificacao recebida)

## Fase 4 - Config Android para Play Store

- [x] `applicationId "com.uzzai.convoca"`
- [x] `versionCode 1`
- [x] `versionName "1.0.0"`
- [x] `minSdkVersion 23`
- [x] `compileSdkVersion 35`
- [x] `targetSdkVersion 35`
- [x] Permissoes Android: `INTERNET`, `CAMERA`, `POST_NOTIFICATIONS`, `USE_BIOMETRIC`
- [x] Intent filter `convoca://`
- [x] Intent filter HTTPS para `convoca.uzzai.com.br`
- [x] Intent filter HTTPS para `convoca.app`
- [x] `strings.xml` com `custom_url_scheme=convoca`
- [x] `.gitignore` protege keystore, `release.properties` e `google-services.json`
- [x] `android/release.properties.example` criado (storeFile corrigido para `release.keystore`)
- [x] `build.gradle` le `release.properties` quando existir
- [x] Keystore de producao gerado (`android/app/release.keystore`, alias `convoca`, SHA-256 `03:EB:03:BA:4E:A6:F9:7B:70:90:53:31:5C:23:66:FF:72:6D:42:0D:3C:01:F8:1B:4C:60:58:DA:4C:3F:29:A5`)
- [x] Backup do keystore preparado (`C:\Users\pedro\convoca-keystore-backup` + `.zip`) — usuario guarda em 2+ locais
- [x] `android/release.properties` criado localmente com senhas reais
- [x] AAB final assinado gerado com o keystore de producao (verificado: package `com.uzzai.convoca`, assinatura bate)

## Fase 5 - Play Console

- [x] App criado no Google Play Console (Convoca)
- [x] Categoria definida como Esportes
- [x] Nome curto e descricao preenchidos
- [x] Icone 512x512 preparado para a loja
- [x] Feature graphic 1024x500 preparado
- [x] Screenshots Android preparadas (geradas em `C:\Users\pedro\convoca-screenshots\SELECIONADAS`, 1236x2196)
- [x] URL da Politica de Privacidade informada (`https://convoca.uzzai.com.br/privacidade`)
- [x] URL de suporte informada na loja (`https://convoca.uzzai.com.br/suporte`)
- [x] URL de exclusao de conta informada no Data Safety (`https://convoca.uzzai.com.br/excluir-conta`)
- [x] Data Safety preenchido
- [x] Content Rating preenchido
- [x] Target audience / Ads declaration preenchido
- [x] Conta demo informada para revisao (`demo.review@convoca.uzzai.com.br` / `ConvocaDemo2026`)
- [x] AAB enviado para a Play (release ConvocaR01, faixa Producao)
- [x] **Versao ENVIADA PARA ANALISE (2026-06-19)** — aguardando revisao da Google (1-3 dias)
- [ ] Login/push/deep links validados via build de release assinado (testado so no APK debug ate agora)
- [ ] App APROVADO e publicado na Google Play

## Fase 6 - iOS via GitHub Actions (sem Mac)

Estrategia: GitHub Actions runner `macos-26` (Xcode 26.5) + fastlane match.
Playbook completo: `docs/playbooks/ios-ci-sem-mac/README.md`
Workflow CI: `.github/workflows/ios-release.yml`

### Sprint iOS-S1 — Contas e identidade

- [x] Projeto iOS base gerado em `ios/App` (bundle id `com.uzzai.convoca`)
- [x] `Info.plist` configurado com URL scheme e permissoes
- [x] `App.entitlements` com Push Notifications + Associated Domains + `aps-environment: production`
- [x] Assets iOS atualizados
- [x] Team ID anotado: `2YRXNXGL8K` (Uzz.Ai Ltda — Apple Developer → Membership)
- [x] App ID `com.uzzai.convoca` registrado no Apple Developer Portal
- [x] Push Notifications + Associated Domains habilitados no App ID
- [x] App criado no App Store Connect
- [x] API Key `.p8` baixada — Key ID `F2L7RBKMZ7`, Issuer ID `6d969582-c629-4d55-8fa1-66423afb1d88`
- [x] App iOS `com.uzzai.convoca` registrado no Firebase (projeto `convoca-app-uzzai-2b530`)
- [x] `GoogleService-Info.plist` baixado e salvo em `ios/App/App/` (gitignored)
- [x] APNs Auth Key `.p8` criada (`45G7QADN8Q`) e uploadada no Firebase (Cloud Messaging)
- [x] `GoogleService-Info.plist` convertido para base64 e salvo como GitHub secret

### Sprint iOS-S2 — fastlane match

- [x] Repo `convoca-certs` criado no GitHub (privado) — `uzzaidev/convoca-certs`
- [x] `Gemfile` com fastlane criado no projeto
- [x] `fastlane/Appfile` configurado (`com.uzzai.convoca`, Team ID `2YRXNXGL8K`)
- [x] `fastlane/Matchfile` configurado (tipo `appstore`, url `uzzaidev/convoca-certs`)
- [x] `fastlane match appstore` executado — Distribution Cert + Provisioning Profile gerados e salvos em `uzzaidev/convoca-certs` (2026-06-22, 1m14s ✅)
- [x] `MATCH_PASSWORD` definido como GitHub secret (`Uzzai2025@`)
- [x] `MATCH_GIT_BASIC_AUTHORIZATION` (base64 user:token) configurado como GitHub secret

### Sprint iOS-S3 — CI GitHub Actions

- [x] 6 secrets configurados no GitHub Actions via `gh secret set` (2026-06-22):
  - `APP_STORE_CONNECT_API_KEY_ID` / `APP_STORE_CONNECT_API_ISSUER_ID` / `APP_STORE_CONNECT_API_KEY_CONTENT`
  - `MATCH_PASSWORD` / `MATCH_GIT_BASIC_AUTHORIZATION` / `GOOGLE_SERVICE_INFO_PLIST_BASE64`
- [x] `.github/workflows/ios-release.yml` commitado e no ar
- [x] `.github/workflows/ios-match-bootstrap.yml` commitado (workflow de setup 1x)
- [x] Bootstrap disparado e concluído com sucesso (2026-06-22 ✅)
- [x] Workflow `ios-release` disparado manualmente — **BUILD VERDE ✅ 4m06s (2026-06-22)**
- [x] Build verde no GitHub Actions (signing OK) ✅ 4m06s
- [x] Build aparecendo no App Store Connect → TestFlight ✅ v1.0.0 build 1 "Pronta para envio"
- [x] App instalado no iPhone via TestFlight ✅
- [x] Login na WebView funcionando (NextAuth, build 2 + `CAPACITOR_PLATFORM=ios`) ✅ 2026-06-22
- [x] Push notification recebida no device iOS ✅ v2.0.0 build 5 (2026-06-22)
- [x] Deep link `convoca://` abrindo o app ✅ (2026-06-23)
- [x] Universal Link `https://convoca.uzzai.com.br/*` abrindo o app ✅ (AASA publicado, 2026-06-23)

### Sprint iOS-S4 — App Store Connect e Submissao

- [x] `apple-app-site-association` publicado (rota publica no Next.js) ✅ 2026-06-23
- [x] Screenshots iPhone 6.5" (1284x2778) capturadas — 6 curadas em `C:\Users\pedro\convoca-screenshots\APP_STORE\SELECIONADAS\` ✅ 2026-06-23
- [x] Screenshots iPad 13" (2048x2732) capturadas — 5 em `C:\Users\pedro\convoca-screenshots\APP_STORE_IPAD\` ✅ 2026-06-23
- [x] Material completo do listing preparado em `docs/mobile-convoca/APP_STORE_CONNECT_SUBMISSION.md` ✅ 2026-06-23
- [x] App Privacy mapeado (§5 do submission doc — sem venda de dados, sem tracking) ✅ 2026-06-23
- [x] Content Rating mapeado (§6 — resultado esperado 4+) ✅ 2026-06-23
- [x] Review Notes + conta demo preparados (§4) ✅ 2026-06-23
- [x] Listing preenchido no App Store Connect ✅ 2026-06-23
- [x] App Privacy preenchido e PUBLICADO no App Store Connect ✅ 2026-06-23
- [x] Screenshots iPhone + iPad enviadas no App Store Connect ✅ 2026-06-23
- [x] Build selecionada (v2.0.0 build 5) ✅ 2026-06-23
- [x] Submit for Review clicado ✅ 2026-06-23

### Sprint iOS-S4.1 — Rejeicoes e correcoes da Apple

#### Rejeicao 1 — Guideline 5.1.2(i) Privacy: Data Use and Sharing (2026-06-24)

**Problema:** App Privacy no App Store Connect marcava dados como "usados para tracking" (rastreamento). O Convoca nao faz tracking.

**Causa raiz:** Preenchimento incorreto do App Privacy — na pergunta "Os dados sao usados para rastrear o usuario?" estava marcado "Sim" em vez de "Nao".

**Correcao:** Editar App Privacy → para cada tipo de dado (Nome, Email, User ID, etc.) → marcar "Nao" em tracking → Publicar → Resubmeter (mesma build, sem alteracao de codigo).

**Licao para futuros apps:** "Tracking" na definicao da Apple = cruzar dados do app com dados de terceiros para publicidade OU compartilhar com data brokers. Apps que so usam dados para funcionalidade propria devem SEMPRE marcar tracking = Nao.

#### Rejeicao 2 — Guideline 5.1.1(v) Account Deletion (2026-06-26)

**Problema:** A exclusao de conta exigia que o usuario enviasse email. Apple exige exclusao direta no app, sem passos extras.

**Causa raiz:** A pagina `/excluir-conta` so tinha um botao "mailto:" e nao fazia a exclusao de verdade.

**Correcao (requer novo build):**
1. Criar endpoint `DELETE /api/users/me` — deleta o user do banco (FKs com ON DELETE CASCADE cuidam das tabelas filhas)
2. Adicionar botao no perfil (`/profile`) com fluxo: "Excluir minha conta" → confirmacao "Tem certeza?" → chama DELETE → signOut → redireciona ao login
3. Commit `165968f`, push, disparar workflow `ios-release` no GitHub Actions para gerar nova build
4. No App Store Connect → selecionar a nova build → resubmeter

**Licao para futuros apps:** A Apple NAO aceita exclusao por email (exceto industrias altamente reguladas como bancos/saude). O app DEVE ter um botao que exclui a conta diretamente, com no maximo uma tela de confirmacao. Implementar `DELETE /api/users/me` + botao com confirmacao ANTES de submeter.

**Quando precisa de novo build vs. apenas resubmeter:**
- Mudanca so no App Store Connect (labels, textos, screenshots, App Privacy) → **mesma build**, apenas resubmeter
- Mudanca no codigo (nova API, novo botao, fix de bug) → **novo build obrigatorio** (disparar CI → esperar TestFlight → selecionar nova build → resubmeter)

#### Rejeicao 3 — Guideline 4 Design: layout iPad (2026-06-27)

**Problema:** Botao "Sair" cortado na parte inferior esquerda no iPad Air 11-inch (M3), iPadOS 26.5.

**Causa raiz:** O sidebar fixo (`h-screen`) nao respeitava safe area insets do iPadOS. O bloco inferior (perfil + Sair) nao tinha `shrink-0` nem padding para safe areas.

**Correcao (requer novo build):**
1. Adicionar `viewport-fit: cover` no meta viewport (`layout.tsx`)
2. Adicionar `padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))` no bloco inferior do sidebar
3. Adicionar `min-h-0` no flex container do sidebar e `shrink-0` no bloco inferior
4. Mudar `<aside>` de `overflow-y-auto` para `overflow-hidden` (scroll fica no `<nav>` interno que ja tem `overflow-y-auto`)

**Licao para futuros apps:** Apps Capacitor no iPad devem usar `viewport-fit=cover` + `env(safe-area-inset-*)` em areas fixas. Testar layout em iPad ANTES de submeter. A Apple testa em iPads reais.

#### Rejeicao 3b — Guideline 2.1(b) Information Needed: modelo de negocio (2026-06-27)

**Problema:** Apple pediu esclarecimento sobre funcionalidades financeiras (cobrancas, carteira). Quer saber se precisa IAP (In-App Purchase).

**Causa raiz:** O Convoca tem funcionalidades de cobranca de grupo (rateio de quadra, mensalidade), que a Apple pode interpretar como "conteudo digital pago".

**Correcao:** Responder via Reply no App Store Connect explicando que:
- As cobrancas sao para gestao financeira de grupos esportivos (rateio de custos reais: quadra, bola, coletes)
- O pagamento e feito fora do app (PIX, dinheiro) — o app so registra quem pagou
- Nao ha conteudo digital desbloqueavel, assinatura premium ou moeda virtual
- E um modelo B2B/group-management, isento de IAP conforme App Review Guidelines 3.1.3(e) e (f)

**Licao para futuros apps:** Se o app tem qualquer funcionalidade de "pagamento" ou "cobranca", mesmo que seja apenas registro/controle (sem processar pagamento), incluir uma nota preemptiva nos Review Notes explicando que nao ha compra digital e que o app nao processa pagamentos.

## Status: Android EM ANALISE na Google | iOS: fix iPad layout + reply business model (build nova via CI)

Proximos passos:

1. Disparar workflow `ios-release` no GitHub Actions
2. Nova build aparece no TestFlight (~5-10 min apos CI verde)
3. No App Store Connect → versao 1.0 → selecionar nova build → Reply com esclarecimento de business model → resubmeter
4. Acompanhar revisao (1-3 dias)
5. Android: acompanhar Play Console

## Commits desta etapa (na main, ja deployados)

- `ec59bae` feat: estruturar app mobile (Capacitor) + paginas de loja
- `f5e0f16` feat: backend de envio de push via FCM HTTP v1
- `72ec718` fix: paginas legais publicas + rename para com.uzzai.convoca
- `77ba861` feat(ios): fastlane match + CI workflows para build sem Mac (2026-06-22)
- `165968f` fix(ios): exclusao de conta in-app + paginas legais com conteudo juridico (2026-06-26)
- `e48722f` fix(ios): botao Sair cortado no iPad + safe area insets (2026-06-27)

## Comandos ja validados

```powershell
pnpm build:mobile
pnpm cap:sync
pnpm exec tsc --noEmit
doppler run -p convoca -c prd -- pnpm build          # build SSR igual a Vercel
doppler run -p convoca -c prd -- pnpm db:migrate -- --only 20260610_add_push_tokens.sql
```

Para Gradle no Windows desta maquina, usar JDK do Android Studio e SDK local:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease
```

Artefatos gerados:

- APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- AAB de loja (assinado): `android/app/build/outputs/bundle/release/app-release.aab` (package `com.uzzai.convoca`)
```
