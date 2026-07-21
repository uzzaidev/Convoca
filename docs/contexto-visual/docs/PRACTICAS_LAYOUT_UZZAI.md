# Práticas e layouts UzzAI — piloto XADREZ.Ai

**Para quê:** repetir o mesmo *sistema de interface* noutro app da UzzAI (não copiar regras de xadrez).  
**Fontes:** deep-research `UzzAI App Starter` + fricção real do piloto XADREZ.  
**Companheiro:** `docs/TEMPLATE_UZZAI_V1.md` (ops/fricção) · este doc foca **layout + práticas de UI**.

**Como usar noutro app:** trata isto como receita. Troca o *domínio* (frase de ciclo, goldens, features). Mantém *shells, tokens, estados, gates*.

---

## 1. Ideia central (1 parágrafo)

Interface profissional = **sistema**, não ecrãs soltos.  
Ordem obrigatória: **tokens → componentes → padrões de ecrã → shells → golden screens → fixtures (empty/loading/error/success) → rotas reais → Playwright visual + axe → deploy**.  
Imagem/mock valida descoberta; o artefacto sério é o **walking skeleton** com estados reais e URL pública.

---

## 2. Frase de ciclo (antes de layout)

Escreve **uma frase** que todos os ecrãs servem.

| App | Frase |
|-----|--------|
| XADREZ (piloto) | *Jogaste → saíste da preparação → revisas amanhã.* |
| Próximo app | *(preencher)* |

Regra: se um ecrã não acelera essa frase, é polish ou lixo.

---

## 3. Layouts / shells (estrutura de ecrã)

Três shells. **Não** misturar marketing com app autenticado.

| Shell | Onde | Layout | Conteúdo típico |
|-------|------|--------|-----------------|
| **Marketing** | `(public)/` | Full-bleed simples, sem tab bar | Landing: brand hero + 1 frase + 1 CTA |
| **Auth** | `(auth)/` | Centro, glow mint suave, max-width ~400 | Login / magic link |
| **App** | `(app)/` | Header sticky + `main` + **bottom TabBar** | Tudo pós-login |

### App shell (mobile-first) — o que copiar

```
┌─────────────────────────────┐
│ Brand │ NextAction chip │ ☰ │  ← sticky + safe-area-top
├─────────────────────────────┤
│                             │
│  label (Exo 2 uppercase)    │
│  Título (Poppins / hero)    │
│  1 frase de apoio           │
│  [métricas 2×2] opcional    │
│  StatePanel / conteúdo      │
│                             │
├─────────────────────────────┤
│ Tab │ Tab │ HUB │ Tab │ Tab │  ← safe-area-bottom
└─────────────────────────────┘
```

**Regras de composição (piloto):**

1. **Um job por secção** — uma headline, uma frase, uma acção principal.  
2. **Primeiro viewport do app** = “Hoje / próxima acção”, **não** dashboard de analytics.  
3. **Bottom tabs** cedo (não sidebar desktop). Um tab é o **hub** (no Xadrez: Treino).  
4. **Header** leve: marca + chip “Próximo” + menu conta (não “Sair” nu).  
5. **Safe-area** no header sticky e na tab bar (`env(safe-area-inset-*)`).  
6. **Cards** só quando há interacção; default = sem card decorativo.  
7. Landing: **sem** “Walking skeleton / Onda B” — cara de produto.

Ficheiros piloto: `apps/web/components/shells/{Marketing,Auth,App}Shell.tsx`, `TabBar.tsx`, `NextActionBar.tsx`, `AccountMenu.tsx`.

---

## 4. Design tokens (camada 1)

Uma folha CSS versionada. **Não** hardcode cores nos ecrãs.

### Brand Uzz (piloto)

| Token | Valor | Uso |
|-------|--------|-----|
| `--*-color-bg` | `#1C1C1C` | Fundo app |
| `--*-color-brand` | `#1ABC9C` | CTA, labels, acentos |
| `--*-color-ink` | `#F5F5F5` | Texto |
| `--*-color-ink-muted` | `#B0B0B0` | Secundário |
| `--*-color-ink-dim` | `#9A9A9A` | Terciário (**≥4.5:1** em `#1C1C1C` — axe) |
| Tipografia | Poppins (títulos/corpo) + Exo 2 (labels / `.Ai`) | Google fonts no `layout` |
| Touch | `--*-touch: 44px` | Alvos de toque |
| Motion | 120 / 200 / 320 ms + `prefers-reduced-motion` | Feedback, não enfeite |

**Noutro app:** copia a *estrutura* dos tokens; podes mudar a paleta **só** no ficheiro de tokens (prefixo `--xz-` → `--app-`).

Ficheiro piloto: `packages/ui/src/tokens/tokens.css`.

---

## 5. Padrões de ecrã (não “páginas únicas”)

### StatePanel (contrato de estados)

Todo fluxo difícil tem estes estados **reais** (não só happy path):

| Estado | Quando | UI |
|--------|--------|-----|
| `idle` | Pronto / soft CTA | Borda brand |
| `loading` | Pedido em curso | Preferir **SoftSkeleton** (não a palavra `loading`) |
| `empty` | Sem dados — mensagem honesta | CTA para o próximo passo do ciclo |
| `error` | Falha API / rede | `role="alert"` + retry |
| `success` | Próxima acção clara | CTA único |

Ficheiro: `packages/ui/src/patterns/StatePanel.tsx`.

### SoftSkeleton

Barras shimmer para métricas / listas. Evita “fixture Storybook” em produção.

### Next action

Um resolver puro (`resolveNextAction(brief, profile)`) decide o CTA do header e do dashboard.  
Prioridade típica: **due → pendências do ciclo → amanhã → objectivo do onboarding → explorar**.

Soft onboarding: **banner/CTA**, não redirect duro (não parte E2E nem demos).

### Tipografia de ecrã

```
.xz-label     → Exo 2, uppercase, mint, letter-spacing
h1            → Poppins, --text-hero
apoio         → ink-muted, 1 frase
```

---

## 6. Golden screens (contrato visual)

**8–12 ecrãs canónicos** por produto. Cada um:

1. Story no Storybook (`Golden/Screens`)  
2. Fixture em `/dev/golden/[slug]` (público, para Playwright)  
3. Screenshot Playwright (`e2e/visual`, maxDiff ~2%)  
4. Stories críticas (`error`, feedback) com `a11y.test: "error"`

### Goldens do piloto (mapa → adapta nomes)

| # | XADREZ | Genérico noutro app |
|---|--------|---------------------|
| 01 | Landing | Landing brand + 1 CTA |
| 02 | Auth | Login |
| 03 | Onboarding | Preferências mínimas |
| 04 | Dashboard “Hoje” | Home / próxima acção |
| 05 | Explorador | Browse / discovery |
| 06 | Lista domínio | Lista principal (repertório → “itens”) |
| 07 | Escolher / decidir | Decisão pedagógica ou filtro |
| 08 | Acção core | Loop principal (treino → “fazer”) |
| 09 | Feedback sucesso/erro | Resultado da acção |
| 10 | Empty | Sem dados |
| 11 | API / erro global | Erro |
| 12 | Fecho do ciclo | Pós-evento → agendar / rever |

Moldura: `GoldenFrame` (telemóvel + tab bar fake) para snapshots estáveis.

---

## 7. Estrutura de pastas a repetir

```text
apps/web/
  app/(public)/          # marketing + /dev/golden
  app/(auth)/            # login
  app/(app)/app/         # rotas autenticadas
  components/shells/     # Marketing | Auth | App
  components/            # TabBar, NextAction, AccountMenu, SoftSkeleton
  features/<domínio>/    # *Client.tsx por jornada
  lib/                   # api-*, next-action, profile-prefs, supabase/
packages/ui/
  src/tokens/
  src/components/        # Button mínimo
  src/patterns/          # StatePanel
  src/motion/            # MotionProvider + reducedMotion
e2e/
  journeys/              # smoke + 1–2 loops de produto
  visual/                # golden screenshots + axe + PWA smoke
supabase/migrations/     # profiles + RLS cedo
docs/runbooks/           # bootstrap + deploy
```

Domínio pesado (Python, workers, etc.) fica **fora** do Next — o piloto manteve FastAPI.

---

## 8. Ordem de trabalho noutro app (checklist)

### Dia 0 — contratos

- [ ] Frase de ciclo escrita no README  
- [ ] Monorepo `apps/web` + `packages/ui`  
- [ ] Tokens + `MotionProvider`  
- [ ] 3 shells  
- [ ] StatePanel + SoftSkeleton + Button  

### Dia 1 — walking skeleton

- [ ] Auth Supabase real (password em dev)  
- [ ] Uma rota `/app` com empty + health/error da API (se houver)  
- [ ] Bottom TabBar (mesmo que 3 tabs)  
- [ ] Next-action stub  

### Dia 2 — goldens + qualidade

- [ ] 8–12 goldens (Storybook + `/dev/golden`)  
- [ ] Playwright visual + axe em login/erro  
- [ ] PWA manifest + ícones 192/512  

### Dia 3 — um loop vertical

- [ ] **Uma** jornada end-to-end do ciclo (não dez features)  
- [ ] Empty/error honestos nessa jornada  
- [ ] E2E journey autenticada (skip sem credenciais)  

### Dia 4 — ship

- [ ] Deploy web (Vercel) + API se existir  
- [ ] CORS + Auth Site URL  
- [ ] Git → deploy automático  
- [ ] Doc de fricção (actualizar este / TEMPLATE_UZZAI)  

### Adiar de propósito

- Sentry (cedo se fores partilhar link; senão após 1ª semana)  
- Staging ≠ prod  
- Stripe  
- Domínio custom (`*.uzzai.com.br`)  
- Nativo  

---

## 9. Práticas que o piloto provou (copiar)

1. **Personalização write-only = protótipo** — onboarding tem de alterar book/ratings, next-action ou ordem de packs.  
2. **Empty states honestos** — “0 resultados” não é bug; explica o ciclo.  
3. **Soft gates** > hard redirects para onboarding.  
4. **Contraste** validado com axe (tokens, não “parece ok”).  
5. **Monorepo na Vercel:** Root Directory `apps/web`; `.vercelignore` **não** pode ignorar pastas tipo `supabase` dentro de `lib/`.  
6. **PostCSS/Tailwind** só se usares de verdade — stub quebra o build.  
7. **Um CTA dominante** por ecrã; chip “Próximo” no header reforça o ciclo.

---

## 10. O que **não** levar para o próximo app

- Regras de xadrez / Stockfish / Lichess explorer  
- Tabuleiro e setas de popularidade  
- Copy “ply / book / repertório”  
- Depth de Stockfish no Render  

Leva: shells, tokens, StatePanel, goldens, next-action, TabBar, PWA, gates E2E/visual.

---

## 11. Teste mínimo “é fábrica?”

Noutro repo, em ≤2 dias, consegues:

1. Landing + login + `/app` empty com a **mesma** cara Uzz  
2. 8 goldens com snapshots verdes  
3. Um loop de produto com empty/error/success  
4. URL Vercel a apontar para auth real  

Se falhar o ponto 1–2, ainda estás a fazer “app”, não starter.

---

## 12. Referências no repo piloto

| Doc / path | Uso |
|------------|-----|
| Este ficheiro | Layouts + práticas UI |
| `docs/TEMPLATE_UZZAI_V1.md` | Fricção ops / auth / domínio |
| `docs/PLANO_PRODUTO.md` §7 | Goldens XADREZ |
| `packages/ui/src/tokens/tokens.css` | Tokens |
| `apps/web/features/golden/` | Stories + GoldenFrame |
| `e2e/visual/golden.spec.ts` | Snapshots + axe + PWA |
| Obsidian deep-research | Visão da fábrica (origem) |

---

**Decisão:** o próximo app UzzAI começa por **copiar este sistema de ecrãs**, não por redesenhar do zero. O XADREZ provou a receita; o teste seguinte é **tempo até walking skeleton + goldens verdes**.
