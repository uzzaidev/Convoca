# Checklist - Convoca Android / Play Store primeiro

Ultima atualizacao: 2026-06-10.

Escopo atual: preparar e validar o app Android para Google Play Store. iOS fica planejado, mas bloqueado por macOS/Xcode.

Regra importante: nenhuma migration foi aplicada ainda. A migration `20260610_add_push_tokens.sql` foi criada, mas esta pendente ate existir `DATABASE_URL` ou `POSTGRES_URL_NON_POOLING` no ambiente local.

Identidade:

- App ID / package: `com.convoca.app`
- Nome: `Convoca`
- WebView de producao: `https://convoca.uzzai.com.br`
- Estrategia: Capacitor com `server.url` ao vivo e `webDir: out` como fallback
- Atualizacoes web/API: deploy em `convoca.uzzai.com.br`; nova Play Store release so para mudancas nativas/Capacitor/Android/iOS.

## Fase 0 - Contas e decisoes

- [x] Estrategia Android definida: `server.url` + fallback local
- [x] App ID definido: `com.convoca.app`
- [x] Dominio da WebView definido: `https://convoca.uzzai.com.br`
- [ ] Politica de Privacidade publicada em URL publica
- [ ] Termos de Uso publicados em URL publica
- [x] Pagina `/privacidade` criada no app
- [x] Pagina `/termos` criada no app
- [x] Pagina `/suporte` criada no app
- [x] Pagina `/lgpd` criada no app
- [x] Pagina `/excluir-conta` criada no app
- [x] Link de exclusao de conta adicionado em `/profile`
- [x] Rascunho de listing criado em `docs/mobile-convoca/STORE_LISTING_DRAFT.md`
- [ ] Conta Google Play Console criada
- [ ] Usuario demo criado com grupo/evento populado para revisao da loja

## Fase 1 - Setup Capacitor

- [x] Dependencias Capacitor instaladas (`@capacitor/core`, `android`, `ios`)
- [x] Plugins nativos instalados (`app`, `status-bar`, `network`, `splash-screen`, `push-notifications`, `camera`, `share`, `biometric-auth`)
- [x] Dev deps instaladas (`@capacitor/cli`, `@capacitor/assets`, `cross-env`)
- [x] `capacitor.config.ts` criado
- [x] `capacitor.config.ts` com `appId`, `appName`, `webDir` e `server.url`
- [x] `CapacitorCookies` e `CapacitorHttp` habilitados
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
- [x] APK debug compila com `gradlew assembleDebug`
- [x] AAB release tecnico compila com `gradlew bundleRelease`
- [x] Templates de App Links criados em `docs/mobile-convoca/templates/`
- [ ] App testado em device fisico/emulador carregando `convoca.uzzai.com.br`
- [ ] Login testado dentro do app em device fisico

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
- [ ] Migration `20260610_add_push_tokens.sql` aplicada no banco
- [ ] Firebase criado e app Android `com.convoca.app` registrado
- [ ] `android/app/google-services.json` adicionado localmente
- [ ] Push validado em device fisico

## Fase 4 - Config Android para Play Store

- [x] `applicationId "com.convoca.app"`
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
- [x] `android/release.properties.example` criado
- [x] `build.gradle` le `release.properties` quando existir
- [ ] Keystore de producao gerado
- [ ] Backup do keystore feito em pelo menos 2 locais seguros
- [ ] `android/release.properties` criado localmente com senhas reais
- [ ] AAB final assinado gerado com o keystore de producao

## Fase 5 - Play Console

- [ ] App criado no Google Play Console
- [ ] Categoria definida como Esportes
- [ ] Nome curto e descricao preenchidos
- [ ] Icone 512x512 preparado para a loja
- [ ] Feature graphic 1024x500 preparado
- [ ] Screenshots Android preparadas
- [ ] URL da Politica de Privacidade informada
- [ ] URL de suporte informada na loja
- [ ] URL de exclusao de conta informada no Data Safety
- [ ] Data Safety preenchido
- [ ] Content Rating preenchido
- [ ] Target audience / Ads declaration preenchido
- [ ] Conta demo informada para revisao
- [ ] AAB enviado para Teste Interno
- [ ] Login, push e deep links validados pelo Teste Interno
- [ ] AAB promovido para Producao

## Fase 6 - iOS depois

- [x] Projeto iOS base gerado em `ios/App`
- [x] `Info.plist` configurado com URL scheme e permissoes
- [x] `App.entitlements` criado com Push Notifications e Associated Domains
- [x] Assets iOS atualizados
- [x] Runbook iOS criado em `docs/mobile-convoca/IOS_MAC_RUNBOOK.md`
- [ ] Mac/Xcode 26+ ou CI macOS disponivel
- [ ] Conta Apple Developer ativa
- [ ] Signing/capabilities configurados no Xcode
- [ ] Push APNs/Firebase configurado
- [ ] URL de suporte informada no App Store Connect
- [ ] URL de privacidade informada no App Store Connect
- [ ] Fluxo de exclusao de conta testado dentro do app
- [ ] Archive enviado ao App Store Connect

## Comandos ja validados

```powershell
pnpm build:mobile
pnpm cap:sync
pnpm exec tsc --noEmit
```

Para Gradle no Windows desta maquina, usar JDK 21 do Android Studio e SDK local:

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
- AAB tecnico: `android/app/build/outputs/bundle/release/app-release.aab`

Observacao: o AAB tecnico compila, mas o AAB de loja ainda precisa do keystore de producao.
