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
- [ ] Deep link `convoca://` abrindo o app

### Sprint iOS-S4 — App Store Connect e Submissao

- [ ] `apple-app-site-association` publicado (rota publica no Next.js)
- [ ] Screenshots iPhone 6.9" (1320x2868) preparadas
- [ ] Listing preenchido no App Store Connect
- [ ] App Privacy preenchido (sem venda de dados)
- [ ] Build selecionada na versao 1.0.0
- [ ] Regra de IAP analisada (Stripe = B2B externo, nao IAP)
- [ ] Conta demo informada nos Review Notes
- [ ] Submit for Review clicado

## Status: Android EM ANALISE na Google | iOS: TestFlight v2.0.0 build 5 — login + push OK — proximo: deep link + S4 App Store

Proximos passos enquanto aguarda / apos aprovacao:

1. Acompanhar status em Play Console -> Painel / Versoes (1-3 dias; conta nova pode demorar mais)
2. Se a Google pedir ajustes: corrigir e reenviar
3. Apos aprovado: app fica publico em `https://play.google.com/store/apps/details?id=com.uzzai.convoca`
4. [FEITO] Conta demo populada com grupo "Pelada dos Cracks" + 10 membros + evento (11 confirmacoes)
5. (Opcional) Testar o build de release assinado via Teste Interno
6. iOS: quando tiver Mac/Xcode (Fase 6)

## Commits desta etapa (na main, ja deployados)

- `ec59bae` feat: estruturar app mobile (Capacitor) + paginas de loja
- `f5e0f16` feat: backend de envio de push via FCM HTTP v1
- `72ec718` fix: paginas legais publicas + rename para com.uzzai.convoca
- `77ba861` feat(ios): fastlane match + CI workflows para build sem Mac (2026-06-22)

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
