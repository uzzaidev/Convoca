# Playbook — Firebase Cloud Messaging (push) num app Capacitor, via CLI/agente

> **Objetivo:** configurar push notifications (FCM) para um app **Capacitor** (Estratégia B / WebView de site ao vivo) **quase 100% pelo terminal**, minimizando cliques no console. Inclui os **gotchas reais** que travam o fluxo e como contorná-los.
>
> Extraído da configuração real do **Convoca** (2026-06-19). Substitua os placeholders `<...>`.
>
> **Filosofia:** o console do Firebase é necessário em **exatamente um ponto** (aceitar os Termos de Serviço + criar/ativar o projeto). Todo o resto — registrar app, baixar `google-services.json`, gerar service-account key, configurar secrets — dá para fazer via `gcloud` + API REST.

---

## 0. Pré-requisitos

| Ferramenta | Para quê | Checar |
|-----------|----------|--------|
| **gcloud CLI** autenticado | criar projeto, habilitar APIs, gerar key | `gcloud auth list` |
| **Doppler** (ou outro secret store) | guardar a credencial FCM | `doppler configure` |
| **Host** (Vercel etc.) | rodar o backend que envia push | — |
| Projeto **Capacitor** com `android/` | destino do `google-services.json` | `ls android/app` |
| `jose` no projeto (ou `firebase-admin`) | assinar JWT p/ FCM HTTP v1 | `package.json` |

Placeholders usados abaixo:
- `<PROJECT_ID>` — id do projeto GCP/Firebase (ex.: `meuapp-prod`). **Global e único.**
- `<PACKAGE>` — applicationId Android (ex.: `com.empresa.app`). **Imutável após publicar.**
- `<SA_EMAIL>` — service account (preenchida no Passo 5).

---

## 1. Criar o projeto GCP

```bash
gcloud projects create <PROJECT_ID> --name="<Nome Amigável>"
```

> ⚠️ **Gotcha — ID já em uso:** IDs são globais. Se der `already in use`, tente variações (`<PROJECT_ID>-<sufixo>`). Project creation tem **rate limit** (HTTP 429) — espere alguns segundos e tente outra.

---

## 2. Habilitar as APIs

```bash
gcloud services enable \
  firebase.googleapis.com \
  cloudresourcemanager.googleapis.com \
  fcm.googleapis.com \
  firebaseinstallations.googleapis.com \
  --project <PROJECT_ID>
```

---

## 3. Adicionar o Firebase ao projeto — **o ponto que exige o console**

A API `projects:addFirebase` **falha com 403** mesmo sendo Owner, por dois motivos combinados:

1. **Escopo OAuth:** o token de usuário do gcloud precisa do escopo `firebase`. Resolva com ADC:
   ```bash
   gcloud auth application-default login \
     --scopes="openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/firebase"
   ```
   (use o token via `gcloud auth application-default print-access-token`)

2. **Termos de Serviço do Firebase:** a API **não aceita** os ToS. Eles precisam ser aceitos **uma vez no console** por humano.

> **Caminho mais rápido e confiável:** aceite os ToS criando o projeto Firebase **no console** (`console.firebase.google.com` → criar projeto → **"Adicionar Firebase a um projeto do Google Cloud existente"** → selecione `<PROJECT_ID>`). O link "adicionar a projeto existente" fica **no rodapé da 1ª tela** de criação (fácil de não ver).
>
> ⚠️ **Gotcha — ID diferente:** se você criar "novo" no console com um nome cujo id-bonito já existe, o Firebase gera um id **com sufixo** (ex.: `meuapp-2b530`). **Confira o id real** no chip abaixo do nome — é nele que você vai mirar nos próximos passos.

Verifique que o Firebase ficou ativo (deve retornar `state: ACTIVE`):
```bash
TOKEN=$(gcloud auth application-default print-access-token)
curl -s "https://firebase.googleapis.com/v1beta1/projects/<PROJECT_ID>" \
  -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: <PROJECT_ID>"
```

> ⚠️ **Gotcha — quota project:** sempre mande o header `x-goog-user-project: <PROJECT_ID>`, senão dá `PERMISSION_DENIED ... requires a quota project`.

---

## 4. Registrar o app Android e baixar o `google-services.json` — via API

```bash
TOKEN=$(gcloud auth application-default print-access-token)
PID=<PROJECT_ID>

# cria o app android (retorna uma operation)
curl -s -X POST "https://firebase.googleapis.com/v1beta1/projects/$PID/androidApps" \
  -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: $PID" \
  -H "Content-Type: application/json" \
  -d '{"packageName":"<PACKAGE>","displayName":"<App> Android"}'

# pega o appId (pode levar alguns segundos pra aparecer)
APPID=$(curl -s "https://firebase.googleapis.com/v1beta1/projects/$PID/androidApps" \
  -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: $PID" \
  | grep -oE '"appId": *"[^"]+"' | head -1 | sed 's/.*"appId": *"//;s/"//')

# baixa a config e grava no projeto Capacitor
curl -s "https://firebase.googleapis.com/v1beta1/projects/$PID/androidApps/$APPID/config" \
  -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: $PID" \
  | grep -oE '"configFileContents": *"[^"]+"' | sed 's/.*: *"//;s/"//' | base64 -d \
  > android/app/google-services.json
```

> `android/app/google-services.json` deve estar no **`.gitignore`**. O Gradle do Capacitor aplica o plugin google-services **condicionalmente** se o arquivo existir — confirme com um build: a task `:app:processDebugGoogleServices` deve rodar.

---

## 5. Gerar a service-account key (para o backend enviar push)

O backend (fora do GCP, ex.: Vercel) precisa de credencial. Use a SA `firebase-adminsdk-*`:

```bash
PID=<PROJECT_ID>
SA=$(gcloud iam service-accounts list --project $PID --format="value(email)" | grep adminsdk)
gcloud iam service-accounts keys create key.json --iam-account="$SA" --project $PID
```

> ⚠️ **Gotcha nº 1 (o mais comum) — org policy bloqueia keys:** muitas orgs têm `constraints/iam.disableServiceAccountKeyCreation`. O erro é `Key creation is not allowed on this service account`. Vale tanto pela API quanto pelo console. **Solução reversível e escopada** (precisa de Org Policy Admin):
>
> ```bash
> gcloud services enable orgpolicy.googleapis.com --project <PROJECT_ID>   # habilitar a API primeiro!
>
> # override no projeto: enforce:false
> cat > /tmp/pol.yaml <<EOF
> name: projects/<PROJECT_NUMBER>/policies/iam.disableServiceAccountKeyCreation
> spec:
>   rules:
>   - enforce: false
> EOF
> gcloud org-policies set-policy /tmp/pol.yaml --project <PROJECT_ID>
> sleep 60   # propagação leva ~1 min
>
> # ... gere a key (Passo 5) ...
>
> # RESTAURE (volta a herdar a regra da org = seguro):
> gcloud org-policies delete iam.disableServiceAccountKeyCreation --project <PROJECT_ID>
> ```
> A key gerada **continua válida** depois de restaurar a policy — a regra só bloqueia criação de chaves **novas**. Janela de exceção mínima.

> ⚠️ **Gotcha nº 2 — `disable-enforce` legado não funciona:** o comando antigo `gcloud resource-manager org-policies disable-enforce` produz `booleanPolicy: {}` que o sistema novo **ignora**. Use sempre `gcloud org-policies set-policy` com `enforce: false`.

---

## 6. Guardar a credencial no secret store (e propagar para produção)

```bash
cat key.json | doppler secrets set FIREBASE_SERVICE_ACCOUNT --project <DOPPLER_PROJ> --config prd --silent
echo "<PROJECT_ID>" | doppler secrets set FIREBASE_PROJECT_ID --project <DOPPLER_PROJ> --config prd --silent
rm -f key.json   # nunca deixe a key em disco / nunca commite
```

> **Boa prática:** se houver **sync Doppler→Vercel**, o secret chega em produção sozinho. Confirme listando o env do projeto certo (ver Passo 8). Se não houver sync, adicione direto no host.

---

## 7. Backend de envio — FCM HTTP v1 com `jose` (sem `firebase-admin`)

Padrão: assinar um JWT da service account → trocar por access token (escopo `firebase.messaging`) → `POST .../messages:send`. Veja a implementação de referência em `src/lib/mobile/fcm.ts` do Convoca. Resumo:

```
JWT {iss/sub: client_email, scope: firebase.messaging, aud: oauth2.googleapis.com/token}
  → POST oauth2.googleapis.com/token (grant_type=jwt-bearer) → access_token (cacheável ~1h)
  → POST fcm.googleapis.com/v1/projects/<PROJECT_ID>/messages:send
       { message: { token, notification:{title,body}, data:{...} } }
```
Trate `404 UNREGISTERED` / `400 INVALID_ARGUMENT` removendo o token do banco.

---

## 8. Verificar/setar env no host (ex.: Vercel) — via REST, sem depender do CLI

> ⚠️ **Gotcha — `vercel whoami --token` dá "Not authorized"** mesmo com token válido (bug do CLI). Use a **API REST** com o token:

```bash
VT=<VERCEL_TOKEN>   # crie em vercel.com/account/settings/tokens; guarde com setx/secret store
# achar o projeto pelo domínio (descobre o id/team reais; ignore .vercel local que pode estar stale)
curl -s "https://api.vercel.com/v9/projects/<PRJ>/domains?teamId=<TEAM>" -H "Authorization: Bearer $VT"
# listar env de produção (ver se FIREBASE_* já chegaram pelo sync)
curl -s "https://api.vercel.com/v9/projects/<PRJ>/env?teamId=<TEAM>" -H "Authorization: Bearer $VT"
```

> ⚠️ **Gotcha — projeto Vercel errado:** o `.vercel/project.json` local pode apontar para um projeto **antigo**. Confirme **pelo domínio de produção** qual projeto serve o site, e use o id/team dele.

---

## 9. Testar

1. **Sem device:** `POST <site>/api/.../push/send` sem auth deve dar **401** (prova que está deployado e protegido).
2. **Com device:** rode o app nativo, logue (registra o token), e dispare o envio — ou use **Firebase Console → Messaging → Enviar teste** com o token do device.

---

## Resumo dos gotchas (a parte que economiza horas)

| # | Sintoma | Causa | Solução |
|---|---------|-------|---------|
| 1 | `addFirebase` → 403 mesmo Owner | falta escopo `firebase` **e/ou** ToS não aceito | ADC com `--scopes=...firebase` + **aceitar ToS no console** |
| 2 | `PERMISSION_DENIED ... quota project` | falta header | `x-goog-user-project: <PROJECT_ID>` |
| 3 | Console criou id com sufixo | id-bonito já tomado | mirar no id **real** (chip abaixo do nome) |
| 4 | `Key creation is not allowed` | org policy `iam.disableServiceAccountKeyCreation` | habilitar Org Policy API + `set-policy enforce:false` (reversível) |
| 5 | `disable-enforce` não surte efeito | comando legado vs sistema novo | usar `gcloud org-policies set-policy` |
| 6 | org-policies → `API has not been used` | Org Policy API desabilitada | `gcloud services enable orgpolicy.googleapis.com` |
| 7 | `vercel whoami --token` → Not authorized | bug do CLI | usar **API REST** `api.vercel.com` |
| 8 | env não chega em produção | sem sync Doppler→host | confirmar sync ou setar no host |
| 9 | mira no projeto Vercel errado | `.vercel` local stale | identificar projeto **pelo domínio** |

---

## Ordem condensada (TL;DR)

```
1. gcloud projects create <PROJECT_ID>
2. gcloud services enable firebase/fcm/cloudresourcemanager/installations
3. CONSOLE (1x): aceitar ToS + ativar Firebase no projeto  ← único passo manual
4. API: criar androidApps + baixar google-services.json -> android/app/
5. org-policy override (se necessário) -> gerar SA key -> restaurar policy
6. secret store: FIREBASE_SERVICE_ACCOUNT + FIREBASE_PROJECT_ID (sync p/ prod)
7. backend FCM HTTP v1 (jose)
8. verificar env no host via REST API
9. testar (401 sem auth; device para entrega real)
```
