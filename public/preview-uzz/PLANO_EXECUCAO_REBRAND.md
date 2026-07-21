# Plano de execução — Rebranding de layout Convoca (seguro)

**Branch:** `feat/ui-rebrand-uzz`  
**Produção (`main` / convoca.uzzai.com.br):** não muda até aprovação dos sócios.  
**Preview GPT (insights):** `Downloads/convoca-preview-uzz` → importado no repo como referência navegável.

---

## 1. Princípio (síntese dos insights + branding Convoca)

O GPT acertou a tensão. **Não** copiar a receita Uzz literalmente (apagaria a personalidade). **Não** manter o excesso de cards/dashboard atual.

| Leva da UzzAI | Mantém do Convoca |
|---------------|-------------------|
| 3 shells (Marketing / Auth / App) | Verde `#16a34a` / `#22c55e` |
| Bottom tabs + hub central | Ícone “C” + geometria de campo |
| Home = próxima ação | Ciclo: organizaste → convocaste → confirmou → jogaram → registaste |
| Labels Exo 2 + títulos Poppins | “Menos papo. Mais bola.” |
| Estados empty/error/success honestos | Story 28s (goldens 01→07→08→09→12) |
| Um CTA dominante por tela | Contagem de vagas, sorteio, legado pós-jogo |

**Hipóteses a validar com sócios** (do `INSIGHTS_REBRANDING.md`):
1. Dark premium não afasta a pelada informal.  
2. Hub “Convocar” é óbvio.  
3. Home “Hoje” serve organizador e jogador (só muda o CTA).  
4. Tab Carteira só vale se cobrança for frequente.

---

## 2. Como fazer com segurança (já decidido)

```
main  ──────────────────────────────► produção (não tocar)
  │
  └── feat/ui-rebrand-uzz ──────────► Vercel Preview URL
        ├── public/preview-uzz/     ► goldens HTML (sócios veem já)
        └── src/ (depois)           ► React real, fase 2
```

1. Trabalhar **só** na branch.  
2. Sócios abrem o **link de preview da Vercel**, nunca `main`.  
3. Merge em `main` **depois** do “sim”.  
4. Rollback = revert do PR.

---

## 3. Fases de trabalho

### Fase 0 — Setup (hoje) ✅ / em curso
- [ ] Branch `feat/ui-rebrand-uzz` a partir de `main`
- [ ] Importar preview GPT → `public/preview-uzz/` (abre em `/preview-uzz/`)
- [ ] Copiar insights + tokens para `docs/contexto-visual/preview-uzz/`
- [ ] Push da branch → URL Vercel Preview
- [ ] Este plano versionado

**Entrega:** link para sócios já navegarem os 12 goldens.

### Fase 1 — Validação visual (1–2 dias, sem código de produto)
- [ ] Sócios percorrem: Landing → Auth → Hoje → Convocar → Confirmar → Sorteio → Pós-jogo
- [ ] Decidir hipóteses 1–4 (dark, hub, Hoje, Carteira)
- [ ] Anotar ajustes de copy/cor (ainda no HTML se rápido)

**Gate:** aprovação do “sistema de ecrãs” (não do pixel final).

### Fase 2 — Walking skeleton React (mesma branch, 3–5 dias)
Implementar no Next **sem** quebrar rotas atuais até o flip:

| Ordem | Trabalho | Mapeia golden |
|-------|----------|---------------|
| 2.1 | Tokens CSS `--cv-*` em `globals` (scoped ou flag) | tokens.css |
| 2.2 | Shells: Marketing / Auth / App + TabBar | goldens 01–04 |
| 2.3 | Feature flag `NEXT_PUBLIC_UI_SHELL=uzz` **só no preview** | — |
| 2.4 | Dashboard → “Hoje” (próxima ação) | 04 |
| 2.5 | Fluxo evento: criar / RSVP / sorteio | 07–09 |
| 2.6 | Empty / erro honestos | 10–11 |
| 2.7 | Landing reescrita (1 frase + 1 CTA + badges loja) | 01 |

**Regra:** funcionalidades iguais; muda layout/hierarquia. Sem features novas neste PR.

### Fase 3 — Ship
- [ ] Checklist mobile no preview Vercel  
- [ ] PR → review → merge `main`  
- [ ] Remover flag ou deixar `uzz` como default  
- [ ] Ícone/splash nativo = build separado (TestFlight/Play), se mudar

---

## 4. O que **não** fazer nesta branch

- Misturar push, CI iOS, migrations  
- Reescrever backend / NextAuth  
- Trocar nome do produto  
- Merge parcial “só a landing” sem os shells (quebra a narrativa)  
- Usar `docs/contexto-visual` cópias de `page.tsx` como código de produção

---

## 5. Mapa dos 12 goldens → produto real

| # | Golden (HTML) | Rota atual aproximada |
|---|---------------|------------------------|
| 01 | Landing | `/` |
| 02 | Auth | `/auth/signin` |
| 03 | Onboarding soft | (novo / soft gate) |
| 04 | Hoje | `/dashboard` |
| 05 | Grupos | lista no dashboard |
| 06 | Grupo | `/groups/[id]` |
| 07 | Convocar | `/groups/.../events/new` |
| 08 | Confirmações | `/groups/.../events/[id]` |
| 09 | Sorteio | evento / draw |
| 10 | Empty | dashboard sem grupo |
| 11 | Erro | estado global |
| 12 | Pós-jogo | rankings / MVP |

---

## 6. Critério de sucesso

Sócios respondem **sim** a:
1. Prefiro esta cara (dark + verde + tabs) à atual?  
2. “Hoje / próxima pelada” faz mais sentido que o dashboard atual?  
3. Podemos investir a Fase 2 nesta branch?

Se 2 de 3 forem não → ajustamos o HTML/React **ainda na branch**, sem produção.

---

## 7. Próximo passo imediato (execução)

1. Criar branch + importar `public/preview-uzz/`  
2. Push → pegar URL Vercel  
3. Enviar aos sócios: `…/preview-uzz/`  
4. Só depois da validação: começar Fase 2 (React)

---

**Referências no repo**
- Insights: `public/preview-uzz/INSIGHTS_REBRANDING.md` (e cópia em docs)  
- Preview HTML: `/preview-uzz/`  
- Práticas Uzz: `docs/contexto-visual/docs/PRACTICAS_LAYOUT_UZZAI.md`  
- Plano anterior: `docs/contexto-visual/PLANO_PREVIEW_LAYOUT_UZZAI.md`
