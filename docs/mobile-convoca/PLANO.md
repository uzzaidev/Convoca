# Plano - App Convoca para Android / Play Store primeiro

Ultima atualizacao: 2026-06-10.

Objetivo: transformar o Convoca em app Android publicado na Google Play Store usando Capacitor, mantendo o app web Next.js como fonte principal. iOS permanece planejado, mas so deve entrar depois porque exige macOS/Xcode ou CI macOS.

## Estado atual

Ja foi executado no projeto:

- Capacitor 7 instalado.
- Projeto Android gerado em `android/`.
- Projeto iOS gerado em `ios/App` (sem `pod install`/build, pois isso exige Mac).
- `capacitor.config.ts` criado com:
  - `appId: "com.convoca.app"`
  - `appName: "Convoca"`
  - `webDir: "out"`
  - `server.url: "https://convoca.uzzai.com.br"`
  - `CapacitorCookies` e `CapacitorHttp` habilitados.
- `next.config.ts` atualizado com export estatico condicional via `CAPACITOR_BUILD=true`.
- `package.json` atualizado com scripts mobile/Capacitor.
- Fallback estatico criado em `scripts/build-mobile-fallback.mjs`.
- Assets base criados em `assets/icon.png` e `assets/splash.png`.
- Recursos Android de icone/splash atualizados.
- Recursos iOS de icone/splash atualizados.
- Android configurado com `compileSdkVersion 35` e `targetSdkVersion 35`.
- Android Manifest atualizado com permissoes e deep links.
- Base de push criada no app:
  - `src/lib/mobile/platform-detector.ts`
  - `src/lib/mobile/native-shell.ts`
  - `src/lib/mobile/push-notifications.ts`
  - `src/app/api/mobile/push-token/route.ts`
- Migration de push criada, mas nao aplicada:
  - `src/db/migrations/20260610_add_push_tokens.sql`
- `src/db/migrations/schema.sql` atualizado para refletir `push_tokens`.
- Paginas publicas criadas:
  - `/privacidade`
  - `/termos`
  - `/suporte`
  - `/lgpd`
  - `/excluir-conta`
- Link interno de exclusao de conta adicionado ao perfil (`/profile`).
- Runbook iOS criado em `docs/mobile-convoca/IOS_MAC_RUNBOOK.md`.
- Rascunho de listing criado em `docs/mobile-convoca/STORE_LISTING_DRAFT.md`.
- Templates de App Links criados em `docs/mobile-convoca/templates/`.

URLs publicas preparadas para as lojas:

- Politica de Privacidade: `https://convoca.uzzai.com.br/privacidade`
- Termos de Uso: `https://convoca.uzzai.com.br/termos`
- Suporte: `https://convoca.uzzai.com.br/suporte`
- Direitos LGPD / escolhas de privacidade: `https://convoca.uzzai.com.br/lgpd`
- Exclusao de conta e dados: `https://convoca.uzzai.com.br/excluir-conta`

Validacoes ja feitas:

- `pnpm build:mobile` passou.
- `pnpm cap:sync` passou.
- `pnpm exec tsc --noEmit` passou.
- `gradlew assembleDebug` passou.
- `gradlew bundleRelease` passou.

Validacao iOS feita no Windows:

- `pnpm exec cap add ios` passou.
- `pnpm cap:sync` pode sincronizar arquivos, mas `pod install`, build e archive exigem Mac.

Artefatos locais gerados:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

Importante: o AAB gerado valida a cadeia tecnica, mas ainda nao deve ser considerado o pacote final da Play Store porque falta keystore de producao.

## Nao fazer ainda

Nao aplicar migrations ate o ambiente local ter `DATABASE_URL` ou `POSTGRES_URL_NON_POOLING` corretamente configurado.

Comando que falhou por falta de env:

```powershell
pnpm db:status
```

Erro observado:

```text
FALTA DATABASE_URL/POSTGRES_URL_NON_POOLING no ambiente ou .env.local.
```

Quando as envs estiverem prontas, aplicar especificamente:

```powershell
pnpm db:status
pnpm db:migrate -- --only 20260610_add_push_tokens.sql
```

## Arquitetura escolhida

Estrategia: Capacitor com WebView apontando para o deploy web vivo.

```text
Android app
  -> Capacitor WebView
    -> https://convoca.uzzai.com.br
  -> fallback local em out/index.html
```

Motivo: o Convoca depende de Next.js SSR/API routes/NextAuth/cookies. Nao e seguro transformar o app inteiro em export estatico. O fallback local existe so como rede de seguranca; o uso normal do app carrega o dominio de producao.

## Atualizacoes feitas no app

### Config mobile

Arquivos:

- `capacitor.config.ts`
- `next.config.ts`
- `package.json`
- `scripts/build-mobile-fallback.mjs`

O `server.url` aponta para `https://convoca.uzzai.com.br`. Quando o dominio final `convoca.app` estiver pronto, a troca principal sera em `capacitor.config.ts`, seguida de:

```powershell
pnpm build:mobile
pnpm cap:sync
```

### Runtime nativo

Arquivos:

- `src/lib/mobile/platform-detector.ts`
- `src/lib/mobile/native-shell.ts`
- `src/lib/mobile/push-notifications.ts`
- `src/components/providers/auth-provider.tsx`

Comportamento:

- Inicializa splash/status bar apenas em plataforma nativa.
- Escuta deep links (`convoca://`, `https://convoca.uzzai.com.br`, `https://convoca.app`).
- Registra push apenas quando o usuario estiver autenticado.
- Salva token de push via `/api/mobile/push-token`.

### Backend de push

Arquivos:

- `src/app/api/mobile/push-token/route.ts`
- `src/db/migrations/20260610_add_push_tokens.sql`
- `src/db/migrations/schema.sql`

Status:

- Codigo criado.
- Migration criada.
- Migration ainda nao aplicada.
- Firebase ainda nao configurado.

## Proximas atualizacoes que devem ser feitas no app

1. Configurar Firebase Android.

   Criar projeto no Firebase, registrar app `com.convoca.app`, baixar `google-services.json` e colocar localmente em `android/app/google-services.json`. Esse arquivo esta no `.gitignore` e nao deve ser commitado.

2. Aplicar a migration `push_tokens`.

   Fazer somente depois de configurar `DATABASE_URL` ou `POSTGRES_URL_NON_POOLING`. Nao usar DDL manual no Neon Console como fluxo normal.

3. Testar login dentro do app Android.

   Prioridade alta, porque o Convoca usa NextAuth com cookie. O teste precisa confirmar que login, sessao e rotas autenticadas funcionam dentro da WebView.

4. Testar push em device fisico.

   Emulador pode ajudar, mas device fisico reduz falso positivo. Validar permissao `POST_NOTIFICATIONS`, registro no Firebase e envio real de mensagem.

5. Gerar keystore de producao.

   Criar `android/app/release.keystore` e `android/release.properties`. Fazer backup do keystore em pelo menos dois locais seguros.

6. Gerar AAB final assinado.

   Depois do keystore:

   ```powershell
   pnpm build:mobile
   pnpm cap:sync
   cd android
   .\gradlew.bat bundleRelease
   ```

7. Preparar materiais da Play Store.

   Politica de privacidade, termos, screenshots, icone 512x512, feature graphic 1024x500, descricao, conta demo, Data Safety e Content Rating.

   A URL de exclusao de conta ja esta preparada para o Data Safety:

   ```text
   https://convoca.uzzai.com.br/excluir-conta
   ```

8. Publicar App Links.

   Depois de gerar o keystore final, preencher `docs/mobile-convoca/templates/assetlinks.template.json` com o SHA-256 do certificado de release e publicar como:

   ```text
   https://convoca.uzzai.com.br/.well-known/assetlinks.json
   ```

## Comandos operacionais

Build/sync web mobile:

```powershell
pnpm build:mobile
pnpm cap:sync
```

TypeScript:

```powershell
pnpm exec tsc --noEmit
```

Gradle no Windows desta maquina:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease
```

Observacao: o Java global da maquina esta em versao 25 e quebrou o Gradle com `Unsupported class file major version 69`. Usar o JDK 21 que vem no Android Studio.

## Status de Play Store

Pronto tecnicamente:

- Projeto Android compila.
- APK debug gera.
- AAB release gera.
- Package id correto.
- SDK alvo correto para a Play atual: API 35.
- Deep links e permissoes configurados.
- Base de push no codigo criada.

Ainda pendente para envio real:

- Conta Google Play Console.
- Politica de Privacidade.
- Termos de Uso.
- Conta demo.
- Firebase.
- Migration aplicada.
- Keystore de producao.
- AAB final assinado.
- Screenshots e ficha da loja.

## Plano iOS depois

iOS ja tem projeto base em `ios/App`, mas este ambiente e Windows. Para finalizar sera necessario:

- Mac com Xcode 26+ ou CI macOS equivalente.
- Conta Apple Developer.
- Rodar `pod install`.
- Configurar signing/capabilities, APNs/Firebase e App Store Connect.
- Publicar `apple-app-site-association` nos dominios usando o template em `docs/mobile-convoca/templates/`.

Antes de submeter iOS, o app precisa entregar valor nativo real (push, deep links, biometria/camera/share) para reduzir risco de rejeicao por ser "apenas um site empacotado".
