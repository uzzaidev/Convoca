# Convoca — Atualização de Estado (2026-06-19)

> Complemento ao checkpoint histórico `2026-03-15_convoca/` (mantido como snapshot original).
> Commit: `f5e0f16` · branch `main` · Next.js 16.1.1 / React 19 / Neon Postgres.

---

## 1. O que mudou desde 2026-03-15

### Mobile (Capacitor) — NOVO
- App híbrido via **Capacitor 7.x**, **Estratégia B**: o WebView carrega o site ao vivo (`https://convoca.uzzai.com.br`) e usa `out/index.html` só como fallback offline.
- `capacitor.config.ts` (`appId: com.convoca.app`), com **`CapacitorCookies` + `CapacitorHttp`** habilitados (essenciais para o login NextAuth por cookie funcionar dentro do WebView).
- `next.config.ts` com `output: 'export'` **condicional** a `CAPACITOR_BUILD` (não quebra o deploy web SSR).
- Projetos nativos `android/` e `ios/` gerados. Android compila APK debug e AAB técnico (falta keystore de produção para o AAB final).
- Runtime nativo em `src/lib/mobile/`: `platform-detector.ts`, `native-shell.ts` (splash/status bar/deep links), `push-notifications.ts`. Inicializados em `src/components/providers/auth-provider.tsx`, guardados por `Capacitor.isNativePlatform()`.

### Push Notifications (Firebase/FCM) — NOVO e FUNCIONAL no backend
- Projeto Firebase **`convoca-app-uzzai-2b530`**, app Android `com.convoca.app`, `google-services.json` em `android/app/` (gitignored).
- Tabela **`push_tokens`** (migration `20260610_add_push_tokens.sql`) **aplicada no Neon**.
- `POST /api/mobile/push-token` salva o token (autenticado).
- `src/lib/mobile/fcm.ts` envia via **FCM HTTP v1 usando `jose`** (sem `firebase-admin`); `POST /api/mobile/push/send` é o endpoint de teste (envia para os próprios devices). Ambos deployados e respondendo 401 sem auth.
- Credenciais `FIREBASE_SERVICE_ACCOUNT` + `FIREBASE_PROJECT_ID` no Doppler `prd`.

### Páginas públicas (compliance / lojas) — NOVO
- `/privacidade`, `/termos`, `/lgpd`, `/suporte`, `/excluir-conta` (necessárias para Play Store / App Store) e a landing de marketing `/produto-convoca`.

### Proteção de rotas — gap de março RESOLVIDO
- Existe **`src/proxy.ts`** (o Next.js 16 renomeou `middleware.ts` → `proxy.ts`). O checkpoint de março apontava "middleware ausente" como risco crítico — agora há proteção centralizada.

### Outros
- Tabelas no schema: **18 → 26**. API routes: **61 → 70**. Páginas: **16 → 27**. Componentes: **58 → 84**.
- Grupo de rotas `src/app/(app)/` (dashboard, groups, events, profile, admin).
- Áreas de API presentes: `agent`, `mcp`, `plans`, `stripe`, `cron`, `mobile`, além das de março.

---

## 2. Infra de deploy e secrets (não-óbvio — documentar sempre)

- **Produção** = projeto Vercel **`convoca`** (`prj_LZvzy7wjA3BQSrb7LaAw8njPbOFr`, team `team_wxsrPIjZqgp9O6dIsvvWLKYt`), domínio **convoca.uzzai.com.br**, ligado ao repo `uzzaidev/Convoca` (branch `main`). ⚠️ O `.vercel/project.json` local aponta para um projeto **stale** (`peladeiros`) — não é produção.
- **Secrets**: vivem no **Doppler** (projeto `convoca`, config `prd`) e **sincronizam para o env de produção da Vercel** (o env tem `DOPPLER_PROJECT/CONFIG/ENVIRONMENT`). Gravar no Doppler `prd` ⇒ chega em produção.
- **Banco** = Neon (o Supabase é base antiga pré-migração — não usar).
- Build local idêntico à Vercel: `doppler run -p convoca -c prd -- pnpm build`.

---

## 3. Status dos gaps do checkpoint de março

| Gap (mar/2026) | Status agora |
|----------------|--------------|
| middleware ausente | ✅ **Resolvido** (`src/proxy.ts`) |
| migration tooling | ✅ **Resolvido** (`src/db/migrate.mjs` + `schema_migrations`) |
| testes (0%) | ❌ Ainda ausente |
| pagination | ⚠️ Verificar por endpoint |
| rate limiting / email verification | ⚠️ Verificar |

---

## 4. Pendências mobile (não bloqueiam o web)

1. **Teste de push em device físico** (instalar APK debug, logar, disparar envio).
2. **Keystore de produção** → AAB final assinado → **Play Console** (roda no Windows).
3. **iOS** → exige Mac/Xcode ou CI macOS.

Plano e checklist detalhados: `docs/mobile-convoca/`. Playbook reutilizável do setup Firebase via CLI: `docs/playbooks/firebase-push-via-cli/`.
