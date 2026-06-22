# Playbook — Publicar/atualizar na Google Play **via CLI**

> **Objetivo:** automatizar o que se **repete** na Google Play (upload de AAB, ficha da loja, screenshots, notas de versão) por linha de comando — para futuros apps e ajustes. Inclui o que **não** dá pra automatizar (compliance one-time) e os gotchas.
>
> Extraído da publicação do **Convoca** (2026-06). Substitua placeholders `<...>`.
>
> **Verdade-base:** diferente do Firebase, o Google Play é **parcialmente** automatizável. A "papelada" que dói é **uma vez por app**; o que você repete a cada versão é 100% CLI.

---

## 0. O que é / não é automatizável

| Tarefa | API/CLI? | Observação |
|--------|----------|------------|
| Upload de **AAB** + criar release em track | ✅ | internal/alpha/beta/production |
| **Notas da versão** / rollout % / promover track | ✅ | |
| **Ficha da loja** (título, descrição curta/completa) | ✅ | por locale |
| **Assets** (ícone, feature graphic, **screenshots**) | ✅ | |
| **Criar o app** | ❌ | só console (1ª vez) |
| **Data Safety** | ⚠️ | sem API; no máximo *import CSV* no console |
| **Content Rating** (IARC) | ❌ | questionário no console |
| **Público-alvo / anúncios / verificação dev / termos** | ❌ | console |

➡️ Conclusão: faça a compliance **uma vez** no console; automatize **uploads e ficha** daí em diante.

---

## 1. Ferramenta recomendada: **fastlane `supply`**

`supply` é o padrão da indústria. Mantém metadados em arquivos locais e publica tudo num comando.

```bash
# instalar (Ruby + fastlane)
gem install fastlane           # ou: brew install fastlane / scoop install fastlane
```

> Alternativa sem fastlane: chamar a **Android Publisher API** direto (REST `edits.*`) — ver §4.

---

## 2. Setup de acesso (uma vez) — Service Account + link no Play Console

### 2.1. Habilitar a API e criar a service account
```bash
PID=<GCP_PROJECT_ID>
gcloud services enable androidpublisher.googleapis.com --project $PID

gcloud iam service-accounts create play-publisher \
  --display-name="Play Publisher" --project $PID
SA="play-publisher@${PID}.iam.gserviceaccount.com"

# gerar key JSON (guarde como secret, ex.: Doppler)
gcloud iam service-accounts keys create play-key.json --iam-account="$SA" --project $PID
```

> ⚠️ **Gotcha — org policy bloqueia keys:** se cair `Key creation is not allowed` (constraint `iam.disableServiceAccountKeyCreation`), use o **override reversível** documentado em `docs/playbooks/firebase-push-via-cli/` (§5): habilitar Org Policy API → `org-policies set-policy enforce:false` → gerar key → `org-policies delete` para restaurar.

### 2.2. Linkar a service account no Play Console *(passo manual, ~2 min)*
1. Play Console → **Configurações → Acesso à API** (Setup → API access).
2. Vincule o projeto GCP `<GCP_PROJECT_ID>` (se pedir).
3. Em **Service accounts**, encontre `play-publisher@...` → **Conceder acesso**.
4. Permissões mínimas: **Liberar apps em testes/produção** + **Editar ficha da loja**. *(Pode escopar por app.)*
5. Salvar. *(Propagação pode levar alguns minutos.)*

> Esse é o **único** passo de console no setup. Depois, tudo por CLI.

### 2.3. Guardar a key como secret
```bash
cat play-key.json | doppler secrets set PLAY_SERVICE_ACCOUNT_JSON -p <proj> -c prd --silent
rm -f play-key.json     # nunca commitar / nunca deixar em disco
```

---

## 3. Uso com fastlane `supply`

### 3.1. Baixar a ficha atual (gera a estrutura de metadados)
```bash
fastlane supply init \
  --json_key play-key.json \
  --package_name <com.suaempresa.app>
```
Cria:
```
fastlane/metadata/android/
  pt-BR/
    title.txt
    short_description.txt          # <= 80 chars
    full_description.txt           # <= 4000 chars
    video.txt
    images/
      icon.png                     # 512x512
      featureGraphic.png           # 1024x500
      phoneScreenshots/            # 1.png, 2.png ... (1236x2196 etc.)
    changelogs/
      <versionCode>.txt            # notas da versão
```

### 3.2. Editar os textos/imagens localmente e publicar
```bash
# subir AAB + ficha + imagens + notas, no track interno
fastlane supply \
  --aab android/app/build/outputs/bundle/release/app-release.aab \
  --json_key play-key.json \
  --package_name <com.suaempresa.app> \
  --track internal \
  --release_status draft        # draft = não envia pra análise sozinho
```

Flags úteis:
- `--skip_upload_metadata` / `--skip_upload_images` / `--skip_upload_screenshots` — subir só o que mudou
- `--track production --rollout 0.1` — produção com 10% de rollout
- só metadados (sem AAB): omita `--aab`

> **Atualização típica futura:** incrementar `versionCode`/`versionName`, rebuildar o AAB assinado (mesmo keystore!), e rodar o `fastlane supply` acima. Zero console.

---

## 4. Alternativa: Android Publisher API crua (sem fastlane)

Fluxo de "edits" (cada publicação é uma transação):
```
1. POST  androidpublisher/v3/applications/<pkg>/edits                 -> editId
2. POST  .../edits/<editId>/bundles  (upload do AAB, media)           -> versionCode
3. PUT   .../edits/<editId>/tracks/internal  {releases:[{versionCodes,status}]}
4. PUT   .../edits/<editId>/listings/pt-BR   {title, fullDescription, shortDescription}
5. POST  .../edits/<editId>/<imageType>      (screenshots/featureGraphic/icon)
6. POST  .../edits/<editId>:commit
```
Auth: OAuth2 com a **service account** (escopo `https://www.googleapis.com/auth/androidpublisher`) — mesmo padrão JWT→token do FCM (ver playbook Firebase). Token via `google-auth-library` ou `jose`.

---

## 5. Gotchas (resumo)

| Sintoma | Causa | Solução |
|---------|-------|---------|
| `Key creation is not allowed` | org policy SA keys | override reversível (playbook Firebase) |
| API 401/403 ao publicar | SA não linkada no Play Console | vincular + conceder acesso (§2.2); aguardar propagação |
| `APK/AAB already exists` ou versionCode rejeitado | code não incrementado | subir `versionCode` a cada upload |
| Listing não atualiza | faltou `:commit` (API) ou flag skip errada | commit do edit / revisar flags |
| Não acha o app | app ainda não criado | **criar o app no console** (1ª vez não tem API) |
| Data Safety/Content Rating "incompletos" bloqueiam envio | só console | preencher uma vez no console |
| Assinatura recusada | Play App Signing usa key da Google | suba com a **upload key**; a Google re-assina |

---

## 6. TL;DR

```
SETUP (1x):
  1. gcloud services enable androidpublisher.googleapis.com
  2. criar service account + key (override de org policy se preciso)
  3. CONSOLE: Acesso à API -> vincular SA -> conceder acesso   <- único passo manual
  4. guardar key no secret store

COMPLIANCE (1x por app, console):
  criar app + Data Safety + Content Rating + público-alvo

RECORRENTE (CLI, sempre):
  bump versionCode -> rebuild AAB assinado (mesmo keystore) ->
  fastlane supply --aab ... --track internal
```

> **Regra de ouro:** console só na **estreia** do app (compliance). Toda versão e ajuste de ficha depois disso = `fastlane supply`.
