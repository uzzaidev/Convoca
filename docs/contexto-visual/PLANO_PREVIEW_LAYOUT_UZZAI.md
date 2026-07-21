# Plano — Preview visual Convoca × práticas UzzAI

**Objetivo:** mostrar aos sócios **como o Convoca ficaria** se adotássemos o sistema de layout UzzAI (`PRACTICAS_LAYOUT_UZZAI.md`), **sem reescrever o app de produção**.  
**Escopo:** só visual / apresentação. Zero auth real, zero API, zero deploy de produto.  
**Base:** `docs/contexto-visual/` (páginas atuais) + `docs/PRACTICAS_LAYOUT_UZZAI.md` (receita Uzz).

---

## 1. Decisão de produto (1 frase — obrigatória antes de desenhar)

| App | Frase de ciclo |
|-----|----------------|
| XADREZ (piloto) | *Jogaste → saíste da preparação → revisas amanhã.* |
| **Convoca (proposta)** | ***Organizaste → convocaste → a galera confirmou → jogaram → registaste.*** |

Todo ecrã do preview tem de acelerar essa frase. Se não acelera, fica de fora do deck.

---

## 2. O que muda na cara (hoje → Uzz)

| Hoje (Convoca) | Receita UzzAI | No preview |
|----------------|---------------|------------|
| Sidebar desktop + shell logado | **Bottom TabBar** mobile-first | Mock com 5 tabs |
| Landing / produto misturados | Shell **Marketing** separado | 1 landing hero + 1 CTA |
| Auth páginas próprias | Shell **Auth** centro, max ~400px | Login estático |
| Dashboard “lista de grupos” | Home = **próxima ação** (não analytics) | “Hoje: pelada sexta 20h — 14/16” |
| Cards decorativos | Cards só com interação | Menos caixas, mais tipografia |
| Tipografia sistema / shadcn | **Poppins** (títulos) + **Exo 2** (labels) | Fontes no HTML do preview |
| Verde `#16a34a` / navy | Tokens versionados (estrutura Uzz) | **Híbrido:** fundo dark Uzz + brand verde Convoca |

### Paleta proposta só para o preview (híbrido)

| Token | Valor | Uso |
|-------|--------|-----|
| `--cv-color-bg` | `#1C1C1C` | Fundo app (Uzz) |
| `--cv-color-brand` | `#16a34a` | CTA / labels (Convoca) |
| `--cv-color-ink` | `#F5F5F5` | Texto |
| `--cv-color-ink-muted` | `#B0B0B0` | Apoio |
| Tipografia | Poppins + Exo 2 | Labels uppercase Exo 2 |

> Sócios veem “cara de fábrica Uzz” sem perder a identidade de campo do Convoca.

---

## 3. Shells no preview (3 molduras)

```
Marketing          Auth                 App
┌──────────┐    ┌──────────┐    ┌─────────────────┐
│ Brand    │    │          │    │ Convoca │ chip │☰│
│ 1 frase  │    │  Login   │    ├─────────────────┤
│ 1 CTA    │    │  ~400px  │    │  (conteúdo)     │
│          │    │          │    ├─────────────────┤
│          │    │          │    │ 🏠 ⚽ ＋ 💰 👤  │
└──────────┘    └──────────┘    └─────────────────┘
```

### Tabs do App (proposta Convoca)

| Tab | Label | Job |
|-----|-------|-----|
| 1 | Hoje | Próxima pelada / confirmações |
| 2 | Grupos | Lista de grupos |
| 3 | **＋** (hub) | Criar / convocar pelada |
| 4 | Carteira | Cobranças do evento |
| 5 | Conta | Perfil / menu |

---

## 4. Golden screens Convoca (12 ecrãs canónicos)

Cada golden = **1 HTML estático** (ou Figma frame) em moldura telemóvel + tab bar fake.  
Fixtures: empty / loading / error / success onde fizer sentido.

| # | Golden | Mapeia URL atual | Conteúdo do preview |
|---|--------|------------------|---------------------|
| 01 | Landing | `/`, `/produto-convoca` | Brand “C” + *Menos papo. Mais bola.* + CTA “Criar pelada” |
| 02 | Auth | `/auth/signin` | Login centro, glow verde suave |
| 03 | Onboarding soft | (novo visual) | “Quantos jogam? Frequência?” — banner, não wall |
| 04 | Hoje / próxima ação | `/dashboard` | Chip “Sexta 20h · Arena · 14/16” + CTA Confirmar |
| 05 | Grupos | `/dashboard` lista | Lista limpa, 1 ação por linha |
| 06 | Grupo | `/groups/[id]` | Estado da próxima pelada do grupo |
| 07 | Convocar | `/groups/.../events/new` | Form mínimo: data, hora, local, vagas |
| 08 | Confirmações | `/groups/.../events/[id]` | Contador 14/16 + lista ✓ |
| 09 | Sorteio | (evento) | TIME VERDE × TIME AZUL — CTA único |
| 10 | Empty | dashboard sem grupo | “Ainda sem pelada — cria a primeira” |
| 11 | Erro | genérico | `role="alert"` + Retry |
| 12 | Pós-jogo / legado | rankings | Artilheiro / MVP — “Semana que vem tem de novo” |

Alinhamento com a story de marketing 28s: goldens **01, 07, 08, 09, 12** contam a mesma narrativa visual.

---

## 5. Entregável para os sócios (o que vão *ver*)

### Opção recomendada — **Walking skeleton visual** (2–4 dias)

Pasta nova (não mexe em produção):

```
docs/contexto-visual/preview-uzz/
  index.html              ← índice dos 12 goldens (grid de telemóveis)
  tokens.css              ← tokens híbridos
  shells.css              ← Marketing / Auth / App + TabBar
  golden/
    01-landing.html
    02-auth.html
    ...
    12-pos-jogo.html
  README.md               ← como abrir (duplo clique / Live Server)
```

- Abrir `index.html` no browser ou partilhar zip.  
- Opcional: deploy **estático** numa URL Vercel `preview-layout` (só HTML) — link na reunião.  
- **Não** ligar a NextAuth / Neon / Capacitor.

### Alternativa mais rápida — **Deck Figma** (1–2 dias)

- 12 frames iPhone (390×844) com as mesmas regras.  
- Bom para reunião; pior para “sentir” tab bar e scroll.  
- Usar se o prazo for &lt; 48h.

### O que **não** fazer neste plano

- Refactor do `AppSidebar` / rotas reais  
- Playwright / Storybook / monorepo completo  
- Trocar tipografia no app de produção  
- Rebranding de nome / ícone (só layout system)

---

## 6. Cronograma sugerido

### Dia 0 — Contratos (½ dia)
- [x] Frase de ciclo definida (secção 1)  
- [ ] Copiar `PRACTICAS_LAYOUT_UZZAI.md` para `docs/contexto-visual`  
- [ ] Congelar lista dos 12 goldens (secção 4)  
- [ ] Decidir: HTML estático **ou** Figma  

### Dia 1 — Tokens + shells (1 dia)
- [ ] `tokens.css` híbrido (dark Uzz + verde Convoca)  
- [ ] 3 shells + TabBar + header (brand + chip “Próximo” + menu)  
- [ ] Tipografia Poppins + Exo 2 (CDN Google Fonts)  
- [ ] `index.html` com moldura telemóvel  

### Dia 2 — Goldens 01–06 (1 dia)
- [ ] Landing, Auth, Onboarding, Hoje, Grupos, Grupo  
- [ ] Empty state no Hoje  

### Dia 3 — Goldens 07–12 (1 dia)
- [ ] Convocar, Confirmações, Sorteio, Empty, Erro, Pós-jogo  
- [ ] SoftSkeleton só no golden “loading” (opcional)  

### Dia 4 — Apresentação (½ dia)
- [ ] Revisar contraste (texto muted ≥ 4.5:1 no dark)  
- [ ] Print PDF ou link Vercel estático  
- [ ] Roteiro 5 min para sócios (secção 7)  

---

## 7. Roteiro de apresentação (5 minutos)

1. **Antes** (15s) — screenshot atual: sidebar + dashboard lista.  
2. **Frase** (20s) — “Organizaste → convocaste → confirmou → jogaram → registaste.”  
3. **Landing + Auth** (40s) — cara de produto Uzz, brand Convoca.  
4. **Hoje** (60s) — próxima ação, não analytics.  
5. **Convocar → Confirmar → Sortear** (90s) — o loop da story 28s.  
6. **Pós-jogo** (30s) — legado / ranking.  
7. **Decisão** (30s) — “aprovamos este sistema visual para um rebranding de UI?”  

Slide único de decisão:

> Aprovar o **sistema de ecrãs Uzz** (shells + tabs + próxima ação) aplicado ao Convoca,  
> mantendo verde de campo e o ciclo da pelada.  
> Implementação no app real = projeto separado, depois do “sim”.

---

## 8. Critério de sucesso do preview

Sócios conseguem responder **sim/não** a:

1. Prefiro **bottom tabs** a sidebar no telemóvel?  
2. Home deve ser **próxima pelada** (não lista genérica)?  
3. Dark Uzz + verde Convoca funciona para a marca?  
4. Vale investir num sprint de UI real com esta receita?

Se 3 de 4 forem “sim”, o próximo passo é plano de implementação (fora deste documento).

---

## 9. Ficheiros de contexto (já nesta pasta / a juntar)

| Ficheiro | Papel |
|----------|--------|
| `docs/contexto-visual/README.md` | Mapa de páginas atuais |
| `docs/contexto-visual/docs/PRACTICAS_LAYOUT_UZZAI.md` | Receita Uzz (cópia) |
| `docs/contexto-visual/src/app/**` | Páginas atuais (referência do “antes”) |
| `docs/contexto-visual/docs/branding/colors.md` | Cores Convoca |
| `docs/contexto-visual/docs/marketing/CONVOCA-STORY-28s.md` | Narrativa visual |
| `docs/contexto-visual/docs/marketing/referencias-visuais/` | Ícone / splash |
| **Este plano** | Como construir o preview |

---

## 10. Próximo passo imediato

Escolher **uma** via:

**A)** HTML estático em `docs/contexto-visual/preview-uzz/` (recomendado para link + sensação real)  
**B)** Figma 12 frames (recomendado se reunião &lt; 48h)

Quando escolheres A ou B, o passo seguinte é **gerar os 12 goldens** — ainda só visual, sem tocar no código de produção.
