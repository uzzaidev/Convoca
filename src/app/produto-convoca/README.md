# Página de Produto - Convoca

Página de produto profissional criada para o Convoca, focada em conversão e apresentação visual impactante.

## 📁 Estrutura de Arquivos

```
src/app/produto-convoca/
├── page.tsx                           # Página principal
├── README.md                          # Este arquivo
└── components/
    ├── ConvocaLeadModal.tsx          # Modal de captura de leads
    ├── EventFlowCarousel.tsx         # Carrossel do fluxo de eventos
    ├── TeamDrawDemo.tsx              # Demo interativa de sorteio
    └── StatsShowcase.tsx             # Showcase de rankings/stats
```

## 🎨 Seções da Página

### 1. Hero Section
- **Título impactante**: "Nunca mais perca tempo organizando pelada"
- **CTA principal**: Modal de captura de leads
- **Social proof**: Badges de validação (100% Grátis, Sem Anúncios, etc)
- **Mockup**: Espaço para screenshot do app

### 2. Problema Section
Apresenta as 3 maiores dores de organizar pelada:
- Grupo do WhatsApp caótico
- Sorteio de times demorado
- Cobrança de racha manual

### 3. Solução Section
Mostra como o Convoca resolve cada problema:
- ✅ Confirmação em 1 clique
- 🔀 Sorteio IA em 5 segundos
- ⚡ Split Pix Automático
- 🏆 Rankings e Estatísticas

### 4. Como Funciona (EventFlowCarousel)
**Componente interativo** que roda automaticamente mostrando:
1. Criar Evento
2. Confirmações (RSVP)
3. Sorteio de Times
4. Resultado & Votação

### 5. Team Draw Demo (Interactive)
**Demonstração clicável** do sorteio de times:
- Lista de 10 jogadores com ratings
- Botão "Sortear Times"
- Animação de sorteio (2s)
- Resultado: Times A e B balanceados
- Mostra rating médio de cada time

### 6. Features Grid
Grid 3x2 com todas as features:
- 📅 Gestão de Eventos
- 👥 Sistema RSVP Inteligente
- 🔀 Sorteio de Times
- ⭐ Sistema de Votação
- 💰 Controle Financeiro
- 📊 Analytics & Insights

### 7. Stats Showcase
**Componente visual** mostrando:
- Cards de estatísticas gerais
- Tabela de ranking top 3
- Artilheiro do mês
- Maior pontuação (MVPs)

### 8. Benefícios
Grid 4 cards destacando benefícios:
- ⏰ Economize 2 horas/semana
- 🛡️ Zero estresse
- 📈 Mais engajamento (+35%)
- 🎯 Transparência total

### 9. FAQ
8 perguntas frequentes em accordion:
- É grátis?
- Funciona para quantos jogadores?
- Precisa instalar app?
- Como funciona Split Pix?
- Sorteio é balanceado?
- E se alguém não quiser usar?
- Tem suporte?
- Dados seguros?

### 10. CTA Final
- Título emocional
- Reforço do valor (100% grátis)
- Botão de conversão final

## 🎯 Features dos Componentes

### ConvocaLeadModal
- **Trigger**: Botão "Quero o Convoca Grátis 🎉"
- **Formulário**: Nome, Email, WhatsApp, Tamanho do grupo
- **Estados**: idle, submitting, success
- **Animações**: fade-in, zoom-in
- **Validações**: Campos obrigatórios

### EventFlowCarousel
- **Auto-rotate**: A cada 4 segundos
- **4 steps**: Create → RSVP → Draw → Results
- **Mockups visuais**: Para cada step
- **Indicador de progresso**: Barra no bottom
- **Navegação manual**: Clique nos steps

### TeamDrawDemo
- **Estado inicial**: Lista de 10 jogadores com ratings
- **Interação**: Botão "Sortear Times"
- **Animação**: Loading 2s
- **Resultado**: Times A e B com:
  - Jogadores distribuídos
  - Rating médio calculado
  - Diferença entre times mostrada
- **Re-sortear**: Botão para sortear novamente

### StatsShowcase
- **Stats Cards**: 4 cards com métricas principais
- **Ranking Table**: Top 3 jogadores com:
  - Posição, Nome, Gols, Assists, MVPs, Jogos
  - Medalhas para top 3 (👑🥈🥉)
  - Trending indicator (↗️)
- **Highlights**: Artilheiro e MVP do mês

## 🎨 Design System

### Cores Principais
```css
--mint: #1ABC9C      /* Primary / Success */
--blue: #2E86AB      /* Secondary */
--gold: #FFD700      /* Highlights / MVP */
--green: #16a085     /* Accent */
--dark: #1C1C1C      /* Background */
--gray: #B0B0B0      /* Text secondary */
```

### Componentes Reutilizáveis
- Gradientes: `from-[#1ABC9C] to-[#16a085]`
- Borders: `border-white/10` com hover `border-[#1ABC9C]/30`
- Backgrounds: `bg-white/5` com hover effects
- Cards: `rounded-2xl` ou `rounded-3xl`
- Botões: `rounded-full` com gradient

### Animações
- Hover: `-translate-y-1` + `scale-105`
- Ping effect: Badge "100% GRÁTIS"
- Fade-in/Zoom-in: Modal
- Auto-rotate: EventFlowCarousel

## 📱 Responsividade

Todos componentes são mobile-first:
- **Mobile**: Stack vertical, texto ajustado
- **Tablet**: Grid 2 colunas onde aplicável
- **Desktop**: Grid 3-4 colunas, layout horizontal

Breakpoints:
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px

## 🚀 Como Usar

1. **Acesse a página**:
```
http://localhost:3000/produto-convoca
```

2. **Customize**:
- Adicione screenshots reais do app no Hero
- Conecte o ConvocaLeadModal a uma API real
- Ajuste copy conforme necessário

3. **Deploy**:
- Build: `pnpm build`
- Verifique que não há erros
- Deploy no Vercel

## 📊 Métricas de Conversão

Para rastrear conversão, adicione events em:
- Abertura do LeadModal
- Preenchimento do form
- Cliques nos CTAs
- Scroll depth
- Tempo na página

## 🎯 Próximos Passos

1. [ ] Adicionar screenshots reais do app
2. [ ] Conectar modal a API/Airtable/Google Sheets
3. [ ] Implementar tracking de analytics
4. [ ] A/B test de copy e CTAs
5. [ ] Adicionar vídeo demo (opcional)
6. [ ] Social proof real (depoimentos)
7. [ ] Integração com email marketing

## 📝 Notas

- Todos componentes são "use client" onde necessário
- Icons: Lucide React
- Fontes: Poppins (headings) e Inter (body)
- Sem dependências externas além do Next.js core

---

**Criado com base no conhecimento completo do projeto Convoca** ✅
