# Plano: navegação inferior (bottom tab bar) no mobile

## Objetivo

No celular (< 768px), trocar o menu hambúrguer + gaveta lateral por uma barra
de abas fixa embaixo, padrão que usuários de app já conhecem. Desktop não muda.

## Escopo

| Contexto | Abas |
|---|---|
| Dentro de um grupo (`/groups/[id]/...`) | Início · Eventos · Pagamentos · IA · Mais |
| Fora de grupo (dashboard, perfil, etc.) | Início · Novo grupo · Entrar · Perfil · Mais |

- **Mais** abre uma folha de baixo (`Sheet side="bottom"`) com o `AppSidebar`
  completo já existente: trocar de grupo, admin/modo do grupo, perfil,
  configurações, ajuda, painel admin e sair. Nada é reimplementado.
- A aba ativa usa a mesma regra de rota do `NavItem` (exact ou prefixo).

## Mudanças

1. `src/components/layout/MobileBottomNav.tsx` (novo)
   - `md:hidden fixed bottom-0`, fundo `bg-navy`, padding inferior com
     `env(safe-area-inset-bottom)` (iPhone / Capacitor).
   - 5 botões de 64px de altura, ícone + rótulo curto, estado ativo em verde.
   - Contém o `Sheet` do "Mais".
   - Marca o elemento com `data-bottom-nav` para outros elementos fixos
     poderem desviar.
2. `src/components/layout/AppLayout.tsx`
   - Remove o `Sheet` lateral e o botão ☰ da top bar mobile.
   - Top bar mobile passa a mostrar o nome do grupo atual (ou "Convoca").
   - Área de conteúdo ganha `pb` da altura da barra no mobile para nada ficar
     escondido atrás dela.
   - Renderiza `<MobileBottomNav />`.
3. `src/components/legal/cookie-consent.tsx`
   - O botão "Gerenciar cookies" (fixo em `bottom-4`) sobe acima da barra no
     mobile quando a barra existe (`body:has([data-bottom-nav])`).

## Fora do escopo (por enquanto)

- Badges de contagem nas abas (ex.: pagamentos pendentes).
- Esconder a barra ao rolar.
- Abas configuráveis por modo do grupo (ranking vs. controle).

## Verificação

- `pnpm build` sem erros.
- Mobile: abas navegam, aba ativa correta, "Mais" abre e fecha ao navegar,
  conteúdo final das páginas visível acima da barra, chat da IA usável.
- Desktop: sidebar inalterada.
