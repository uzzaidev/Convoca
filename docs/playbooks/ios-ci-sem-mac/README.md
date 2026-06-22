# Playbook — iOS sem Mac: GitHub Actions + fastlane

> **Objetivo:** publicar o Convoca na App Store sem possuir ou alugar um Mac.
> O build, assinatura e upload acontecem no runner `macos-26` do GitHub Actions,
> que tem Xcode 26.5 instalado — exatamente o que a Apple exige desde 28/04/2026.
>
> **Projeto:** Convoca · Bundle ID: `com.uzzai.convoca` · iOS target: 15.0
>
> **Pré-requisito único pago:** Apple Developer Program (US$ 99/ano) — já ativo ✅

---

## Visão Geral dos Sprints

```
iOS-S1 (1–2h)    Contas no Apple Developer + Firebase iOS  [manual: browser]  ✅ CONCLUÍDO 2026-06-22
iOS-S2 (1h)      fastlane match — certificados + provisioning  [GitHub Actions]  ✅ CONCLUÍDO 2026-06-22
iOS-S3 (30min)   GitHub secrets + disparar CI  [gh CLI automatizado]              ✅ secrets OK; build pendente
iOS-S4 (1–2h)    App Store Connect — screenshots + listing + submit  [manual]
```

Cada sprint pode ser executado **inteiro no Windows**, sem abrir o Xcode.

> **Lição aprendida (2026-06-22):** Ruby não está instalado no Windows por padrão.
> O S2 foi executado diretamente no GitHub Actions via workflow `ios-match-bootstrap.yml` — sem WSL, sem instalar Ruby localmente.

### Playbooks de apoio

| Playbook | Uso |
|---|---|
| `docs/playbooks/github-secrets-via-cli/README.md` | **S3**: configura os 6 secrets com 1 comando |
| `docs/playbooks/app-screenshots-headless/README.md` | **S4**: captura screenshots iPhone (1320×2868) via headless |
| `docs/playbooks/firebase-push-via-cli/README.md` | **S1**: registrar app iOS + APNs no Firebase via CLI |

### O que é 100% automatizado

| Etapa | Script / ferramenta |
|---|---|
| Configurar 6 secrets no GitHub | `node scripts/setup-ios-ci-secrets.mjs` |
| Build + archive + upload (TestFlight) | `.github/workflows/ios-release.yml` (GitHub Actions) |
| Screenshots Play Store | `node screenshots.mjs --play` |
| Screenshots App Store iPhone 6.9" | `node screenshots.mjs --appstore` |

### O que exige browser (Apple/Firebase — não tem API pública)

| Etapa | Onde | Tempo |
|---|---|---|
| Registrar App ID + capabilities | developer.apple.com | 5 min |
| Criar app no App Store Connect | appstoreconnect.apple.com | 5 min |
| Baixar API Key `.p8` | appstoreconnect.apple.com | 2 min |
| Aceitar ToS + criar projeto Firebase | console.firebase.google.com | 5 min |
| Criar APNs Auth Key `.p8` | developer.apple.com | 5 min |

---

## Sprint iOS-S1 — Contas e identidade

### Objetivo
Registrar o app no Apple Developer Portal, no App Store Connect e no Firebase,
e gerar a API Key que o CI vai usar (sem senha).

---

### S1-1 · Apple Developer Portal — registrar App ID

URL: https://developer.apple.com/account/resources/identifiers/list

1. **Certificates, Identifiers & Profiles → Identifiers → (+)**
2. Selecionar **App IDs → App**
3. Preencher:
   - Description: `Convoca`
   - Bundle ID: **Explicit** → `com.uzzai.convoca`
4. Capabilities a habilitar:
   - ✅ Push Notifications
   - ✅ Associated Domains
5. **Register** → anote o Team ID (formato `XXXXXXXXXX`, 10 chars)

> ⚠️ Bundle ID é **imutável após o 1º submit** — confirme `com.uzzai.convoca`.

---

### S1-2 · App Store Connect — criar o app

URL: https://appstoreconnect.apple.com/apps → **New App**

| Campo | Valor |
|---|---|
| Platforms | iOS |
| Name | Convoca |
| Primary Language | Portuguese (Brazil) |
| Bundle ID | `com.uzzai.convoca` (aparece após S1-1) |
| SKU | `convoca-ios-2026` (qualquer string única) |
| User Access | Full Access |

---

### S1-3 · App Store Connect API Key — para o CI não usar senha

URL: https://appstoreconnect.apple.com/access/integrations/api → **Generate API Key**

| Campo | Valor |
|---|---|
| Name | `convoca-ci-admin` |
| Access | **Admin** ⚠️ |

> ⚠️ **CRÍTICO:** a role precisa ser **Admin**, não Developer.
> Somente Admin pode criar Distribution Certificates via API.
> Se criar com role inferior, o fastlane match vai falhar com:
> `You do not have permission to create this certificate. Only Team Admins can create Distribution certificates.`

Após criar, **baixe imediatamente** o arquivo `.p8` — só aparece uma vez.

> ⚠️ **Segurança:** nunca coloque o `.p8` na pasta do repo. Salve em:
> `C:\Users\pedro\convoca-ios-setup\AuthKey_KEYID.admin.p8`
> O `.gitignore` raiz já tem `*.p8` para evitar commits acidentais.

Anote os três valores que vão para os secrets do GitHub:
```
APP_STORE_CONNECT_API_KEY_ID       → Key ID (ex.: Z9L9Q375UP)
APP_STORE_CONNECT_API_ISSUER_ID    → Issuer ID (UUID na parte de cima da página)
APP_STORE_CONNECT_API_KEY_CONTENT  → conteúdo do arquivo .p8 (todo, incluindo -----BEGIN...)
```

**Valores atuais do projeto (2026-06-22):**
```
APP_STORE_CONNECT_API_KEY_ID      = Z9L9Q375UP   (key "convoca-ci-admin", role Admin)
APP_STORE_CONNECT_API_ISSUER_ID   = 6d969582-c629-4d55-8fa1-66423afb1d88
```

---

### S1-4 · Firebase — registrar app iOS + APNs

> Firebase já existe para Android (`convoca-app-uzzai-2b530`). Só adicionar iOS.
>
> Partes via CLI: ver playbook `docs/playbooks/firebase-push-via-cli/README.md`
> (Seção 4 — registrar iOS app via API REST).

1. Firebase Console → projeto `convoca-app-uzzai-2b530` → ⚙️ Configurações do projeto
2. **Adicionar app → iOS+**
3. Bundle ID: `com.uzzai.convoca`
4. Baixar `GoogleService-Info.plist`
5. Salvar em `ios/App/App/GoogleService-Info.plist` (gitignored — ver S1-5)

**APNs Auth Key (.p8):**

1. Apple Developer → Certificates, IDs & Profiles → **Keys → (+)**
2. Key Name: `Convoca APNs`
3. Enable: **Apple Push Notifications service (APNs)**
4. Baixar a key `.p8` — só aparece uma vez
5. Firebase Console → Configurações → Cloud Messaging → **Apple app configuration**
6. Upload da APNs Auth Key (.p8) + Key ID + Team ID

---

### S1-5 · Proteger GoogleService-Info.plist no git

O arquivo não pode ir para o repo. Ele vai como secret no GitHub (base64).

```powershell
# Windows PowerShell
$bytes = [System.IO.File]::ReadAllBytes("ios\App\App\GoogleService-Info.plist")
[System.Convert]::ToBase64String($bytes) | Set-Clipboard
# Cola no secret GOOGLE_SERVICE_INFO_PLIST_BASE64
```

Confirmar que `.gitignore` tem:
```
ios/App/App/GoogleService-Info.plist
```

---

### Checklist S1

- [x] Team ID anotado: `2YRXNXGL8K` (Uzz.Ai Ltda)
- [x] App ID `com.uzzai.convoca` registrado no Apple Developer
- [x] Push Notifications + Associated Domains habilitados no App ID
- [x] App criado no App Store Connect
- [x] API Key Admin `.p8` baixada — Key ID `Z9L9Q375UP`, Issuer ID `6d969582-c629-4d55-8fa1-66423afb1d88`
- [x] App iOS `com.uzzai.convoca` registrado no Firebase (`convoca-app-uzzai-2b530`)
- [x] `GoogleService-Info.plist` baixado e salvo em `ios/App/App/` (gitignored)
- [x] APNs Auth Key `45G7QADN8Q` criada + uploadada no Firebase (Cloud Messaging)
- [x] `GoogleService-Info.plist` convertido para base64 e configurado como GitHub secret

---

## Sprint iOS-S2 — fastlane match (certificados sem Mac)

### Objetivo
Gerar o Distribution Certificate e o Provisioning Profile de App Store,
armazenar criptografados num repo Git privado, e disponibilizá-los ao CI.

> **Abordagem adotada (2026-06-22):** Ruby não existe no Windows sem WSL.
> Todo o S2 foi executado via GitHub Actions (`ios-match-bootstrap.yml`) — sem instalar nada localmente.

---

### S2-1 · Criar repo privado para os certs

```powershell
# Criar via gh CLI (automatico)
gh repo create convoca-certs --private --add-readme
```

Ou no browser: **github.com/new → Private → nome `convoca-certs`**.

> Nunca commite a senha (`MATCH_PASSWORD`) junto com os certs.
> Os arquivos no repo são criptografados pelo match — a senha fica só nos secrets.

---

### S2-2 · Arquivos fastlane (já criados no repo)

Os arquivos abaixo já existem no repo e estão corretos. Não é necessário rodar `fastlane init`.

**`Gemfile`** (raiz do projeto):
```ruby
source "https://rubygems.org"
gem "fastlane", "~> 2.225"
```

**`fastlane/Appfile`:**
```ruby
app_identifier "com.uzzai.convoca"
team_id "2YRXNXGL8K"
# Sem apple_id — autenticação é via API Key (.p8), não Apple ID/senha
```

**`fastlane/Matchfile`:**
```ruby
git_url "https://github.com/uzzaidev/convoca-certs.git"
storage_mode "git"
type "appstore"
app_identifier "com.uzzai.convoca"
team_id "2YRXNXGL8K"
# Sem username — autenticação é via git_basic_authorization (token)
```

> ⚠️ **Importante:** não adicione `apple_id` nem `username` nos arquivos.
> Com API Key, o fastlane não usa senha da Apple — apenas o token `.p8`.
> Adicionar `username` causa o erro `Missing username in non-interactive shell`.

---

### S2-3 · Fastfile com lanes setup_certs e beta

O `fastlane/Fastfile` tem duas lanes:

**`setup_certs`** — roda UMA VEZ para gerar e salvar os certs:
```ruby
lane :setup_certs do
  # CI não tem keychain interativo — cria um temporário
  create_keychain(
    name: "CI_KEYCHAIN", password: ENV["MATCH_PASSWORD"],
    default_keychain: true, unlock: true, timeout: 3600
  )

  # Autentica via .p8 (sem Apple ID/senha)
  api_key = app_store_connect_api_key(
    key_id:      ENV["APP_STORE_CONNECT_API_KEY_ID"],
    issuer_id:   ENV["APP_STORE_CONNECT_API_ISSUER_ID"],
    key_content: ENV["APP_STORE_CONNECT_API_KEY_CONTENT"],
    in_house:    false
  )

  match(
    type: "appstore", readonly: false,
    api_key: api_key,
    git_basic_authorization: ENV["MATCH_GIT_BASIC_AUTHORIZATION"],
    app_identifier: "com.uzzai.convoca", team_id: "2YRXNXGL8K",
    keychain_name: "CI_KEYCHAIN", keychain_password: ENV["MATCH_PASSWORD"]
  )
end
```

**`beta`** — build + TestFlight (roda em cada release):
```ruby
lane :beta do
  create_keychain(name: "CI_KEYCHAIN", password: ENV["MATCH_PASSWORD"],
    default_keychain: true, unlock: true, timeout: 3600)

  api_key = app_store_connect_api_key(
    key_id: ENV["APP_STORE_CONNECT_API_KEY_ID"],
    issuer_id: ENV["APP_STORE_CONNECT_API_ISSUER_ID"],
    key_content: ENV["APP_STORE_CONNECT_API_KEY_CONTENT"], in_house: false
  )

  match(type: "appstore", readonly: true, api_key: api_key,
    git_basic_authorization: ENV["MATCH_GIT_BASIC_AUTHORIZATION"],
    app_identifier: "com.uzzai.convoca", team_id: "2YRXNXGL8K",
    keychain_name: "CI_KEYCHAIN", keychain_password: ENV["MATCH_PASSWORD"])

  sh("cd ../.. && pnpm build:mobile")
  sh("cd ../.. && pnpm cap sync ios")
  cocoapods(clean_install: true, podfile: "../../ios/App/Podfile", use_bundle_exec: false)

  gym(workspace: "../../ios/App/App.xcworkspace", scheme: "App",
    configuration: "Release", export_method: "app-store",
    output_directory: "../../build", output_name: "Convoca.ipa")

  pilot(api_key: api_key, skip_waiting_for_build_processing: true)
end
```

---

### S2-4 · Gerar MATCH_GIT_BASIC_AUTHORIZATION

O CI precisa clonar `convoca-certs` sem interação. Use o token do `gh` CLI atual:

```powershell
# Extrair token do gh CLI e gerar o base64
$token = gh auth token
$b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("uzzaidev:$token"))
# Setar direto como secret
gh secret set MATCH_GIT_BASIC_AUTHORIZATION --repo uzzaidev/Convoca --body $b64
```

> O token precisa ter acesso de leitura ao repo `convoca-certs`.
> O token do `gh` CLI (autenticado com `gh auth login`) já tem escopo `repo` suficiente.

---

### S2-5 · Workflow de bootstrap (roda 1x)

O arquivo `.github/workflows/ios-match-bootstrap.yml` dispara o `fastlane setup_certs`
no runner `macos-26`, sem precisar de Ruby local.

```
GitHub Actions → iOS Match Bootstrap (roda 1x) → Run workflow
```

Resultado: Distribution Certificate + `AppStore_com.uzzai.convoca.mobileprovision`
aparecem criptografados no repo `uzzaidev/convoca-certs`.

> **Status atual:** ✅ Executado com sucesso em 2026-06-22 (1m14s).

---

### Checklist S2

- [x] Repo `convoca-certs` criado no GitHub (privado) — `uzzaidev/convoca-certs`
- [x] `Gemfile` criado com fastlane
- [x] `fastlane/Appfile` configurado (sem apple_id — usa API Key)
- [x] `fastlane/Matchfile` configurado (sem username — usa git_basic_authorization)
- [x] `fastlane match appstore` executado via `ios-match-bootstrap.yml` ✅ 2026-06-22
- [x] Distribution Certificate criado no Apple Developer Portal
- [x] Provisioning Profile `AppStore_com.uzzai.convoca.mobileprovision` no `convoca-certs`
- [x] `fastlane/Fastfile` com lanes `setup_certs` + `beta` criadas
- [x] `MATCH_PASSWORD` configurado como GitHub secret
- [x] `MATCH_GIT_BASIC_AUTHORIZATION` configurado como GitHub secret

---

## Sprint iOS-S3 — Workflow GitHub Actions

### Objetivo
Pipeline CI que roda no runner `macos-26` (Xcode 26.5), faz build + archive + upload
ao TestFlight, disparado manualmente ou em push para `main`.

---

### S3-1 · Secrets no GitHub — AUTOMATIZADO ⚡

> **Não precisa clicar no GitHub.** Um script configura os 6 secrets via `gh` CLI.
>
> Playbook completo: `docs/playbooks/github-secrets-via-cli/README.md`

```powershell
# Na raiz do projeto — pede os valores interativamente
node scripts/setup-ios-ci-secrets.mjs
```

O script vai pedir:
- Caminho do `.p8` da App Store Connect (de S1-3)
- Key ID + Issuer ID (de S1-3)
- Caminho do `GoogleService-Info.plist` iOS (de S1-4)
- `MATCH_PASSWORD` (de S2-6)
- GitHub user + PAT para `convoca-certs` (de S2-8)

E vai setar automaticamente:

| Secret | Status |
|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | ✅ automático |
| `APP_STORE_CONNECT_API_ISSUER_ID` | ✅ automático |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | ✅ automático (lê o .p8) |
| `MATCH_PASSWORD` | ✅ automático |
| `MATCH_GIT_BASIC_AUTHORIZATION` | ✅ automático (gera base64) |
| `GOOGLE_SERVICE_INFO_PLIST_BASE64` | ✅ automático (base64 do plist) |

---

### S3-2 · Criar o workflow

Arquivo: `.github/workflows/ios-release.yml` (criado automaticamente neste playbook).

O workflow:
1. Roda em `macos-26` (Xcode 26.5, Sequoia)
2. Instala pnpm + node + ruby + bundler
3. Restaura `GoogleService-Info.plist` via secret (base64)
4. Escreve a App Store Connect API Key em disco (temporário)
5. Executa `bundle exec fastlane beta`
6. Limpa arquivos sensíveis

---

### S3-3 · Testar o workflow

```bash
# Disparar manualmente no GitHub
# Actions → "iOS Release" → Run workflow → branch main
```

Tempo esperado: **20–35 minutos** (maioria em `pod install` + `xcodebuild`).

Com caching de CocoaPods e derivedData: **12–20 minutos**.

> **Custo:** ~20–35 min macOS × 10 (multiplicador) = 200–350 min da cota mensal.
> Plano Free: 2.000 min → 200 min macOS → ~1 build grátis/mês no pior caso.
> **Recomendação:** disparar só quando for enviar para revisão — não em todo push.

---

### S3-4 · Validar no TestFlight

1. App Store Connect → TestFlight → aguardar processamento (~10–30 min)
2. Instalar no iPhone via TestFlight (link de teste interno)
3. Testar: login, push, deep link, biometria

---

### Checklist S3

- [x] 6 secrets configurados no GitHub Actions via `gh secret set` (2026-06-22)
- [x] `.github/workflows/ios-release.yml` commitado
- [x] `.github/workflows/ios-match-bootstrap.yml` commitado (bootstrap executado ✅)
- [ ] Workflow `ios-release` disparado manualmente (Run workflow)  ← **PRÓXIMO PASSO**
- [ ] Build verde no GitHub Actions (sem erro de signing)
- [ ] Build aparecendo no App Store Connect → TestFlight
- [ ] App instalado no iPhone via TestFlight
- [ ] Login funcionando na WebView (cookie NextAuth)
- [ ] Push notification recebida no device
- [ ] Deep link `convoca://` abrindo o app

---

## Sprint iOS-S4 — App Store Connect e Submissão

### Objetivo
Preencher o listing, screenshots, compliance e submeter para revisão da Apple.

---

### S4-1 · Corrigir entitlements para produção

> ✅ **Já feito em 2026-06-22.** O arquivo `ios/App/App/App.entitlements` já está com `production`.

Verificar que está correto:
```xml
<key>aps-environment</key>
<string>production</string>   <!-- ← deve ser production, nunca development -->
```

> A Apple rejeita apps com `aps-environment: development` em produção.

---

### S4-2 · Publicar apple-app-site-association

No Convoca (Next.js), criar a rota que serve o JSON de Universal Links.

URL que a Apple vai validar: `https://convoca.uzzai.com.br/.well-known/apple-app-site-association`

Substituir `TEAM_ID` pelo Team ID real em `docs/mobile-convoca/templates/apple-app-site-association.template.json`
e criar a rota pública no Next.js:

```
src/app/.well-known/apple-app-site-association/route.ts
```

(rota pública — sem autenticação no middleware)

---

### S4-3 · Screenshots iPhone para App Store — AUTOMATIZADO ⚡

> Playbook completo: `docs/playbooks/app-screenshots-headless/README.md`

A App Store exige screenshots em resoluções específicas:

| Dispositivo | Resolução | Obrigatório |
|---|---|---|
| **iPhone 6.9"** | **1320 × 2868** | ✅ **SIM (obrigatório)** |
| iPhone 6.7" | 1290 × 2796 | opcional se 6.9" presente |
| iPad Pro 13" | 2064 × 2752 | opcional |

> ⚠️ As screenshots Android (1236×2196, ratio 1.78) **não servem** — a Apple exige 1320×2868 (ratio 2.17).

Gerar via headless com 1 comando:

```powershell
# Instalar puppeteer-core (só 1ª vez)
pnpm add -D puppeteer-core

# Capturar screenshots iPhone 6.9" (1320×2868)
node screenshots.mjs --appstore
# Saída: C:/Users/pedro/app-screenshots/appstore/
```

O script loga na conta demo (`demo.review@convoca.uzzai.com.br`) e percorre as páginas automaticamente.

---

### S4-4 · Preencher App Store Connect

URL: https://appstoreconnect.apple.com/apps → Convoca → Distribution → App Store

**Informações obrigatórias:**

| Campo | Valor |
|---|---|
| Name | Convoca |
| Subtitle | Organize sua pelada |
| Category | Sports |
| Age Rating | 4+ |
| Privacy Policy URL | `https://convoca.uzzai.com.br/privacidade` |
| Support URL | `https://convoca.uzzai.com.br/suporte` |

**Descrição (reuse do STORE_LISTING_DRAFT.md):**

Copiar de `docs/mobile-convoca/STORE_LISTING_DRAFT.md` → seção "App Store - description".

**Keywords:** `pelada,futebol,futsal,society,times,ranking,convocacao,esporte`

**Demo account:**
- Email: `demo.review@convoca.uzzai.com.br`
- Senha: `ConvocaDemo2026`

---

### S4-5 · App Privacy (Data Safety)

Dados coletados (baseado no `STORE_LISTING_DRAFT.md`):

| Dado | Coletado | Vinculado ao usuário | Rastreamento |
|---|---|---|---|
| Email | Sim | Sim | Não |
| Nome | Sim | Sim | Não |
| Identificador do usuário | Sim | Sim | Não |
| Push tokens | Sim | Sim | Não |
| Conteúdo do usuário (grupos, eventos) | Sim | Sim | Não |

Venda de dados: **Não**.

---

### S4-6 · Confirmar regra de In-App Purchase (Stripe)

> ⚠️ **Ponto crítico:** a Apple exige que apps com compras digitais usem In-App Purchase (30% de comissão).
>
> **O Convoca está seguro** porque:
> - O Stripe cobra **grupos esportivos** (B2B/serviço externo), não compras de conteúdo digital no app.
> - O fluxo de pagamento abre uma WebView/Safari para o Stripe Checkout — não é compra dentro do app.
>
> Classificar como: **"não vende conteúdo digital dentro do app"**.
> Base: [App Store Review Guidelines 3.1.1](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)

---

### S4-7 · Submeter para revisão

1. App Store Connect → Convoca → + Version → `1.0.0`
2. Adicionar build (vinda do TestFlight de S3-4)
3. Adicionar screenshots (de S4-3)
4. Preencher todos os campos de S4-4
5. App Privacy de S4-5
6. **Submit for Review**

Prazo de revisão Apple: **24h–7 dias** (nova conta = pode demorar mais).

---

### Checklist S4

- [x] `App.entitlements` com `aps-environment: production` ✅ 2026-06-22
- [ ] `apple-app-site-association` publicado e acessível sem autenticação
- [ ] Screenshots iPhone 6.9" (1320×2868) preparadas
- [ ] App Store Connect — todos os campos obrigatórios preenchidos
- [ ] Build do TestFlight selecionada na versão 1.0.0
- [ ] App Privacy preenchido (sem venda de dados)
- [ ] Regra de IAP analisada e justificada (Stripe = B2B externo)
- [ ] Conta demo informada nos Review Notes
- [ ] **Submit for Review** clicado

---

## Secrets consolidados (referência rápida)

> **Todos os 6 foram configurados via `gh secret set` em 2026-06-22** — ver playbook `docs/playbooks/github-secrets-via-cli/README.md`.
> Para reconfigurar: `node scripts/setup-ios-ci-secrets.mjs` ou `gh secret set` diretamente.

| Secret | Valor / Fonte | Status |
|---|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | `Z9L9Q375UP` (API Key Admin "convoca-ci-admin") | ✅ |
| `APP_STORE_CONNECT_API_ISSUER_ID` | `6d969582-c629-4d55-8fa1-66423afb1d88` | ✅ |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | conteúdo de `AuthKey_Z9L9Q375UP.admin.p8` | ✅ |
| `MATCH_PASSWORD` | `Uzzai2025@` (criptografia dos certs no convoca-certs) | ✅ |
| `MATCH_GIT_BASIC_AUTHORIZATION` | base64 de `uzzaidev:gh_token` | ✅ |
| `GOOGLE_SERVICE_INFO_PLIST_BASE64` | base64 do `GoogleService-Info.plist` iOS | ✅ |

> ⚠️ **Arquivos locais sensíveis** (fora do repo, em `C:\Users\pedro\convoca-ios-setup\`):
> - `AuthKey_Z9L9Q375UP.admin.p8` — API Key Admin (App Store Connect)
> - `AuthKey_45G7QADN8Q.apns.p8` — APNs Auth Key (Firebase)
> - `match-git-auth.txt` — MATCH_GIT_BASIC_AUTHORIZATION em texto claro
> - `GoogleService-Info.plist` — plist iOS do Firebase

---

## Custos consolidados

| Item | Custo |
|---|---|
| Apple Developer Program | US$ 99/ano ✅ já pago |
| GitHub Actions (builds de release, ~1-2x/mês) | Grátis (dentro dos 200 min macOS/mês) |
| Repo `convoca-certs` (privado) | Grátis |
| Mac ou Hackintosh | **Não necessário** |

---

## Referências

- [GitHub Actions runner-images — macos-26](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md)
- [Apple — SDK minimum requirements](https://developer.apple.com/news/upcoming-requirements/?id=02032026a)
- [fastlane match docs](https://docs.fastlane.tools/actions/match/)
- [fastlane gym docs](https://docs.fastlane.tools/actions/gym/)
- [fastlane pilot (TestFlight) docs](https://docs.fastlane.tools/actions/pilot/)
