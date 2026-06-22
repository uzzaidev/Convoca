# Playbook — GitHub Actions Secrets via CLI (automático)

> **Objetivo:** configurar os 6 secrets do CI iOS no GitHub Actions com **um único script**,
> sem clicar na UI do GitHub. Usa o `gh` CLI (GitHub CLI) que você já tem autenticado.
>
> Extraído do fluxo do Convoca (2026-06). Substitua os placeholders `<...>`.
>
> **Filosofia:** cada secret vem de uma fonte (arquivo, variável de ambiente, input).
> O script lê, encode em base64 quando necessário, e chama `gh secret set`.

---

## 0. Pré-requisitos

| Ferramenta | Versão mínima | Checar |
|---|---|---|
| **gh CLI** | 2.x | `gh --version` |
| **gh autenticado** com repo access | — | `gh auth status` |
| **Node.js** | 18+ | `node --version` |
| Arquivo `AuthKey_KEYID.p8` da App Store Connect | — | baixado em S1-3 |
| Arquivo `GoogleService-Info.plist` iOS | — | baixado em S1-4 |
| `MATCH_PASSWORD` definida (da S2-6) | — | valor escolhido por você |
| PAT GitHub com acesso ao `convoca-certs` (da S2-8) | — | `ghp_...` gerado |

Se `gh` não estiver instalado:
```powershell
winget install GitHub.cli
gh auth login   # escolha: GitHub.com → HTTPS → Login with browser
```

---

## 1. Estrutura dos 6 secrets

| Secret | Fonte | Como automatizar |
|---|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID do `.p8` (texto) | `gh secret set` direto |
| `APP_STORE_CONNECT_API_ISSUER_ID` | Issuer ID (UUID) | `gh secret set` direto |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | conteúdo do `.p8` | lê arquivo → `gh secret set` |
| `MATCH_PASSWORD` | senha que você escolheu | `gh secret set` via stdin |
| `MATCH_GIT_BASIC_AUTHORIZATION` | base64 de `user:ghp_TOKEN` | script gera o base64 |
| `GOOGLE_SERVICE_INFO_PLIST_BASE64` | `GoogleService-Info.plist` | lê arquivo → base64 → `gh secret set` |

---

## 2. Script de setup automático

Script: `scripts/setup-ios-ci-secrets.mjs`
(já criado no repositório — ver abaixo para execução)

O script:
1. Pede os valores interativamente (ou aceita via variáveis de ambiente)
2. Faz base64 onde necessário
3. Chama `gh secret set` para cada um dos 6 secrets
4. Verifica se os secrets foram criados com `gh secret list`

---

## 3. Execução

### 3.1 · Preparar os arquivos

Coloque em qualquer pasta local (ex.: `C:\Users\pedro\convoca-ios-setup\`):
- `AuthKey_KEYID.p8` — baixado do App Store Connect (S1-3)
- `GoogleService-Info.plist` — baixado do Firebase (S1-4)

### 3.2 · Rodar o script

```powershell
# Na raiz do projeto Convoca
node scripts/setup-ios-ci-secrets.mjs
```

O script vai perguntar interativamente:

```
Caminho para o arquivo .p8 da App Store Connect: C:\Users\pedro\convoca-ios-setup\AuthKey_ABCD1234EF.p8
App Store Connect Key ID (ex: ABCD1234EF): ABCD1234EF
App Store Connect Issuer ID (UUID): xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Caminho para GoogleService-Info.plist: C:\Users\pedro\convoca-ios-setup\GoogleService-Info.plist
MATCH_PASSWORD (senha dos certs): [oculto]
GitHub username (para convoca-certs): uzzaidev
GitHub PAT com acesso ao convoca-certs (ghp_...): [oculto]
```

Saída esperada:

```
✅ APP_STORE_CONNECT_API_KEY_ID        → set
✅ APP_STORE_CONNECT_API_ISSUER_ID     → set
✅ APP_STORE_CONNECT_API_KEY_CONTENT   → set (1234 bytes)
✅ MATCH_PASSWORD                      → set
✅ MATCH_GIT_BASIC_AUTHORIZATION       → set (base64)
✅ GOOGLE_SERVICE_INFO_PLIST_BASE64    → set (5678 bytes)

Verificando no GitHub...
NAME                                    UPDATED
APP_STORE_CONNECT_API_ISSUER_ID         2026-06-22
APP_STORE_CONNECT_API_KEY_CONTENT       2026-06-22
APP_STORE_CONNECT_API_KEY_ID            2026-06-22
GOOGLE_SERVICE_INFO_PLIST_BASE64        2026-06-22
MATCH_GIT_BASIC_AUTHORIZATION           2026-06-22
MATCH_PASSWORD                          2026-06-22

✅ Todos os 6 secrets configurados. Pode disparar o workflow.
```

---

## 4. Re-executar (atualizar um secret)

Para atualizar só um secret sem rodar tudo:

```powershell
# Atualizar só a API Key do App Store Connect
$content = Get-Content "C:\...\AuthKey_ABCD1234EF.p8" -Raw
gh secret set APP_STORE_CONNECT_API_KEY_CONTENT --body "$content" --repo uzzaidev/Convoca

# Atualizar MATCH_PASSWORD
gh secret set MATCH_PASSWORD --repo uzzaidev/Convoca

# Listar todos
gh secret list --repo uzzaidev/Convoca
```

---

## 5. Verificar secrets sem revelar valores

```powershell
gh secret list --repo uzzaidev/Convoca
```

Deve mostrar as 6 linhas. Se alguma faltar, rode o script novamente.

---

## Gotchas

| Sintoma | Causa | Solução |
|---|---|---|
| `gh: command not found` | gh não instalado | `winget install GitHub.cli` |
| `HTTP 404 Not Found` | repo inválido ou sem acesso | `gh auth status` + confirmar nome do repo |
| `HTTP 422` no `gh secret set` | token sem permissão `secrets` | `gh auth refresh -s write:repo,repo` |
| Secret não aparece no workflow | repo fork ou ambiente diferente | setar em `--env` se usar environments |
| `.p8` com quebras de linha erradas (Windows CRLF) | editor adicionou `\r\n` | o script corrige automaticamente |
