# Contexto visual — Convoca (snapshot para agente externo)

**Somente leitura / cópia.** Os arquivos oficiais continuam nos paths originais do repositório (sem o prefixo `docs/contexto-visual/`).

Exemplo: a página oficial do dashboard é `src/app/(app)/dashboard/page.tsx`, não a cópia nesta pasta.

Stack: **Next.js App Router** — páginas em `page.tsx` (React/TypeScript), não HTML.

---

## Índice de URLs → arquivo oficial

### Públicas / marketing / legal
| URL | Path oficial |
|-----|--------------|
| `/` | `src/app/page.tsx` |
| `/produto-convoca` | `src/app/produto-convoca/page.tsx` |
| `/download` | `src/app/download/page.tsx` |
| `/privacidade` | `src/app/privacidade/page.tsx` |
| `/termos` | `src/app/termos/page.tsx` |
| `/lgpd` | `src/app/lgpd/page.tsx` |
| `/suporte` | `src/app/suporte/page.tsx` |
| `/excluir-conta` | `src/app/excluir-conta/page.tsx` |
| `/impressum` | `src/app/impressum/page.tsx` |
| `/invite/[code]` | `src/app/invite/[code]/page.tsx` |
| `/simple-test` | `src/app/simple-test/page.tsx` |

### Auth
| URL | Path oficial |
|-----|--------------|
| `/auth/signin` | `src/app/auth/signin/page.tsx` |
| `/auth/signup` | `src/app/auth/signup/page.tsx` |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` |
| `/auth/error` | `src/app/auth/error/page.tsx` |

### App (logado) — grupo de rota `(app)` não aparece na URL
| URL | Path oficial |
|-----|--------------|
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` |
| `/profile` | `src/app/(app)/profile/page.tsx` |
| `/settings` | `src/app/(app)/settings/page.tsx` |
| `/ajuda` | `src/app/(app)/ajuda/page.tsx` |
| `/groups/new` | `src/app/(app)/groups/new/page.tsx` |
| `/groups/join` | `src/app/(app)/groups/join/page.tsx` |
| `/groups/[groupId]` | `src/app/(app)/groups/[groupId]/page.tsx` |
| `/groups/[groupId]/settings` | `src/app/(app)/groups/[groupId]/settings/page.tsx` |
| `/groups/[groupId]/events` | `src/app/(app)/groups/[groupId]/events/page.tsx` |
| `/groups/[groupId]/events/new` | `src/app/(app)/groups/[groupId]/events/new/page.tsx` |
| `/groups/[groupId]/events/[eventId]` | `src/app/(app)/groups/[groupId]/events/[eventId]/page.tsx` |
| `/groups/[groupId]/chat` | `src/app/(app)/groups/[groupId]/chat/page.tsx` |
| `/groups/[groupId]/payments` | `src/app/(app)/groups/[groupId]/payments/page.tsx` |
| `/groups/[groupId]/championships` | `src/app/(app)/groups/[groupId]/championships/page.tsx` |
| `/groups/[groupId]/championships/[championshipId]` | `src/app/(app)/groups/[groupId]/championships/[championshipId]/page.tsx` |
| `/events/[eventId]` | `src/app/(app)/events/[eventId]/page.tsx` |
| `/admin` | `src/app/(app)/admin/page.tsx` |
| `/admin/agent` | `src/app/(app)/admin/agent/page.tsx` |

### Layouts e visual
| O quê | Path oficial |
|-------|--------------|
| Layout root | `src/app/layout.tsx` |
| Layout app logado | `src/app/(app)/layout.tsx` |
| CSS global / tokens | `src/app/globals.css` |
| Tailwind | `tailwind.config.ts` |
| Sidebar / shell | `src/components/layout/*` |
| Guia de cores | `docs/branding/colors.md` |
| Ícone / splash | `assets/icon.png`, `assets/splash.png` |
| Capacitor (cores nativas) | `capacitor.config.ts` |
| Story marketing 28s | `docs/marketing/CONVOCA-STORY-28s.md` |
| Refs visuais | `docs/marketing/referencias-visuais/` |

---

## Estrutura desta pasta

Espelha os paths oficiais sob `docs/contexto-visual/…` para você zipar ou colar no agente externo.

```
docs/contexto-visual/
  README.md                          ← este arquivo
  PLANO_PREVIEW_LAYOUT_UZZAI.md      ← plano visual para sócios (Convoca × Uzz)
  docs/PRACTICAS_LAYOUT_UZZAI.md     ← receita de layout UzzAI (cópia)
  src/app/...                        ← cópias das page.tsx + layouts + globals.css
  src/components/layout/
  assets/
  docs/branding/
  docs/marketing/
  tailwind.config.ts
  capacitor.config.ts
```

**Preview (ainda não gerado):** ver `PLANO_PREVIEW_LAYOUT_UZZAI.md` → pasta futura `preview-uzz/`.
