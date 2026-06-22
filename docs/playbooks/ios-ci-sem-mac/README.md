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
iOS-S1 (1–2h)    Contas no Apple Developer + Firebase iOS  [manual: browser]
iOS-S2 (1–2h)    fastlane match — certificados + provisioning  [WSL/terminal]
iOS-S3 (30min)   GitHub secrets + disparar CI  ← AUTOMATIZADO via script
iOS-S4 (1–2h)    App Store Connect — screenshots + listing + submit  [manual]
```

Cada sprint pode ser executado **inteiro no Windows**, sem abrir o Xcode.

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
| Name | `convoca-ci` |
| Access | **Developer** |

Após criar, **baixe imediatamente** o arquivo `.p8` — só aparece uma vez.

Anote os três valores que vão para os secrets do GitHub:
```
APP_STORE_CONNECT_API_KEY_ID       → Key ID (ex.: ABCD1234EF)
APP_STORE_CONNECT_API_ISSUER_ID    → Issuer ID (UUID na parte de cima da página)
APP_STORE_CONNECT_API_KEY_CONTENT  → conteúdo do arquivo .p8 (todo, incluindo -----BEGIN...)
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

- [ ] Team ID anotado (`XXXXXXXXXX`)
- [ ] App ID `com.uzzai.convoca` registrado no Apple Developer
- [ ] Push Notifications + Associated Domains habilitados no App ID
- [ ] App criado no App Store Connect
- [ ] API Key `.p8` baixada + Key ID + Issuer ID anotados
- [ ] App iOS registrado no Firebase
- [ ] `GoogleService-Info.plist` baixado e salvo em `ios/App/App/`
- [ ] APNs Auth Key criada + uploadada no Firebase
- [ ] `GoogleService-Info.plist` em base64 pronto para secret

---

## Sprint iOS-S2 — fastlane match (certificados sem Mac)

### Objetivo
Gerar o Distribution Certificate e o Provisioning Profile de App Store,
armazenar criptografados num repo Git privado, e disponibilizá-los ao CI.

> fastlane match roda em qualquer máquina com Ruby — incluindo Windows com WSL,
> ou diretamente no próprio GitHub Actions pela 1ª vez.

---

### S2-1 · Criar repo privado para os certs

No GitHub: **New repository → Private** → nome: `convoca-certs`

> Nunca commite a senha (`MATCH_PASSWORD`) junto com os certs.

---

### S2-2 · Instalar fastlane (WSL ou GitHub Actions)

**Opção A — WSL no Windows (recomendado para 1ª vez interativa):**

```bash
# No WSL (Ubuntu)
sudo apt-get update && sudo apt-get install -y ruby ruby-dev build-essential
gem install bundler
```

**Opção B — diretamente no GitHub Actions** (ver S3 — workflow de bootstrap).

---

### S2-3 · Inicializar fastlane no projeto

No WSL, dentro do repo do Convoca:

```bash
cd /mnt/c/Projetos\ Uzz.Ai/Convoca/Convoca
bundle init
bundle add fastlane
bundle exec fastlane init
# Escolher: 4 (manual setup)
```

Isso cria `fastlane/Appfile` e `fastlane/Fastfile`.

---

### S2-4 · Configurar fastlane/Appfile

```ruby
# fastlane/Appfile
app_identifier "com.uzzai.convoca"
apple_id "SEU_EMAIL@DOMINIO.COM"         # email da conta Apple Developer
itc_team_id "XXXXXXXXXX"                 # Team ID de S1-1
team_id "XXXXXXXXXX"
```

---

### S2-5 · Inicializar fastlane match

```bash
bundle exec fastlane match init
# Storage mode: git
# URL do repo: https://github.com/uzzaidev/convoca-certs.git
```

Isso cria `fastlane/Matchfile`:

```ruby
# fastlane/Matchfile
git_url "https://github.com/uzzaidev/convoca-certs.git"
storage_mode "git"
type "appstore"
app_identifier "com.uzzai.convoca"
username "SEU_EMAIL@DOMINIO.COM"
```

---

### S2-6 · Gerar certificado e provisioning profile

```bash
# Defina a senha que vai criptografar os certs (guarde no Doppler/1Password)
export MATCH_PASSWORD="uma-senha-forte-aqui"

bundle exec fastlane match appstore
```

O match vai:
1. Criar um Distribution Certificate no Apple Developer Portal
2. Criar um Provisioning Profile (App Store) para `com.uzzai.convoca`
3. Criptografar e commitar no repo `convoca-certs`

> ⚠️ Se der erro de autenticação no Apple Developer, use App Store Connect API:
> ```bash
> bundle exec fastlane match appstore \
>   --api_key_path path/to/AuthKey_KEYID.p8 \
>   --api_key_issuer_id "ISSUER-UUID" \
>   --skip_confirmation
> ```

---

### S2-7 · Configurar Fastfile para release

```ruby
# fastlane/Fastfile

default_platform(:ios)

platform :ios do

  desc "Build e upload para TestFlight"
  lane :beta do
    # Instala certificado + provisioning profile do repo certs
    match(
      type: "appstore",
      readonly: true,
      git_basic_authorization: ENV["MATCH_GIT_BASIC_AUTHORIZATION"]
    )

    # Build mobile fallback (gera out/)
    sh("cd ../.. && pnpm build:mobile")

    # Sync Capacitor
    sh("cd ../.. && pnpm cap sync ios")

    # Instalar pods
    cocoapods(
      clean_install: true,
      podfile: "ios/App/Podfile",
      use_bundle_exec: false
    )

    # Archive
    gym(
      workspace: "ios/App/App.xcworkspace",
      scheme: "App",
      configuration: "Release",
      export_method: "app-store",
      output_directory: "./build",
      output_name: "Convoca.ipa",
      xcargs: "MARKETING_VERSION=#{ENV['APP_VERSION'] || '1.0.0'} CURRENT_PROJECT_VERSION=#{ENV['BUILD_NUMBER'] || '1'}"
    )

    # Upload para TestFlight
    pilot(
      skip_waiting_for_build_processing: true,
      api_key_path: ENV["APP_STORE_CONNECT_API_KEY_PATH"]
    )
  end

end
```

---

### S2-8 · Gerar MATCH_GIT_BASIC_AUTHORIZATION

O CI precisa clonar `convoca-certs` sem interação. Use um Personal Access Token do GitHub:

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
2. Repository access: apenas `convoca-certs`
3. Permissions: **Contents: Read-only**
4. Gerar → copiar o token

```bash
# Gerar o base64 para o secret
echo -n "SEU_GITHUB_USER:ghp_SEU_TOKEN" | base64
# Resultado vai para o secret MATCH_GIT_BASIC_AUTHORIZATION
```

---

### Checklist S2

- [ ] Repo `convoca-certs` criado no GitHub (privado)
- [ ] `Gemfile` criado com fastlane
- [ ] `fastlane/Appfile` configurado
- [ ] `fastlane/Matchfile` configurado apontando para `convoca-certs`
- [ ] `fastlane match appstore` executado com sucesso
- [ ] Distribution Certificate criado no Apple Developer Portal
- [ ] Provisioning Profile `AppStore_com.uzzai.convoca.mobileprovision` no `convoca-certs`
- [ ] `fastlane/Fastfile` com lane `beta` criado
- [ ] `MATCH_PASSWORD` guardado no Doppler/1Password
- [ ] `MATCH_GIT_BASIC_AUTHORIZATION` (base64 user:token) pronto para secret

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

- [ ] 6 secrets criados no GitHub Actions
- [ ] `.github/workflows/ios-release.yml` commitado
- [ ] Workflow disparado manualmente (Run workflow)
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

No arquivo `ios/App/App/App.entitlements`, mudar:

```xml
<!-- DE -->
<string>development</string>
<!-- PARA -->
<string>production</string>
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

- [ ] `App.entitlements` com `aps-environment: production`
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

> **Todos os 6 são configurados automaticamente** por `scripts/setup-ios-ci-secrets.mjs`.
> Ver playbook `docs/playbooks/github-secrets-via-cli/README.md`.

| Secret | Fonte | Sprint |
|---|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID do `.p8` | S1-3 |
| `APP_STORE_CONNECT_API_ISSUER_ID` | Issuer ID (UUID) | S1-3 |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | conteúdo do `.p8` (script lê o arquivo) | S1-3 |
| `MATCH_PASSWORD` | senha escolhida | S2-6 |
| `MATCH_GIT_BASIC_AUTHORIZATION` | base64 de `user:ghp_TOKEN` (script gera) | S2-8 |
| `GOOGLE_SERVICE_INFO_PLIST_BASE64` | base64 do `.plist` (script lê e converte) | S1-5 |

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
