# Feature: Link de Participação e Seleção de Posições

## Resumo

Este recurso permite que administradores de grupos compartilhem links diretos para eventos, onde membros podem confirmar presença selecionando suas posições preferenciais no campo.

## Funcionalidades Implementadas

### 1. Página de Confirmação de Presença (`/events/[eventId]`)

**URL**: `/events/[eventId]`

**Acesso**: Membros do grupo podem acessar diretamente via link

**Conteúdo da página**:
- ✅ Informações do evento (data, local, grupo)
- ✅ Status atual (agendado, ao vivo, finalizado)
- ✅ Contador de participantes confirmados vs vagas
- ✅ Barra de progresso visual
- ✅ Lista de espera (se habilitada)
- ✅ Status do usuário atual (confirmado, lista de espera, não confirmado)
- ✅ Formulário de confirmação com seleção de posições
- ✅ Lista de jogadores confirmados com suas posições
- ✅ Lista de jogadores na lista de espera

### 2. Seleção de Posições

**Posições disponíveis**:
- 🧤 **Goleiro** (gk)
- 🛡️ **Zagueiro** (defender)
- ⚡ **Meio-campo** (midfielder)
- ⚽ **Atacante** (forward)

**Funcionalidades**:
- ✅ Seleção de **1ª posição** (obrigatória ao confirmar)
- ✅ Seleção de **2ª posição** (opcional)
- ✅ Validação: posições não podem ser duplicadas
- ✅ Interface visual com emojis
- ✅ Grid responsivo (2 colunas no mobile, 4 no desktop)
- ✅ Feedback visual de seleção (borda e fundo destacados)

### 3. Fluxo de Confirmação

```
1. Usuário acessa /events/[eventId]
   ↓
2. Visualiza informações do evento
   ↓
3. Seleciona 1ª posição preferencial
   ↓
4. (Opcional) Seleciona 2ª posição
   ↓
5. Clica em "Confirmar Presença"
   ↓
6. Sistema verifica vagas disponíveis
   ↓
7a. Se há vaga: Confirma
7b. Se lotado: Coloca na lista de espera
   ↓
8. Página atualiza mostrando novo status
```

### 4. Integração com Sistema Existente

**Compatibilidade**:
- ✅ Funciona com sistema de RSVP existente
- ✅ Respeita limite de jogadores (`max_players`)
- ✅ Respeita limite de goleiros (`max_goalkeepers`)
- ✅ Integra com lista de espera (`waitlist_enabled`)
- ✅ Dashboard mostra eventos com link clicável

**Link no Dashboard**:
- O card de "Próximas Peladas" já linka para `/events/[eventId]`
- Usuários podem clicar diretamente e confirmar

## Alterações Técnicas

### Backend

**1. Banco de dados** (`src/db/migrations/001_add_position_preferences.sql`):
```sql
ALTER TABLE event_attendance
ADD COLUMN preferred_position VARCHAR(20),
ADD COLUMN secondary_position VARCHAR(20);
```

**2. Validação** (`src/lib/validations.ts`):
```typescript
export const rsvpSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["yes", "no", "waitlist"]),
  role: z.enum(["gk", "line"]).default("line"),
  preferredPosition: z.enum(["gk", "defender", "midfielder", "forward"]).optional(),
  secondaryPosition: z.enum(["gk", "defender", "midfielder", "forward"]).optional(),
});
```

**3. API** (`src/app/api/events/[eventId]/rsvp/route.ts`):
- Atualizada para aceitar e salvar `preferredPosition` e `secondaryPosition`
- Mantém retrocompatibilidade (campos opcionais)

### Frontend

**1. Página** (`src/app/events/[eventId]/page.tsx`):
- Server component que busca dados do evento
- Mostra participantes confirmados e lista de espera
- Renderiza formulário de RSVP

**2. Componente** (`src/components/events/event-rsvp-form.tsx`):
- Client component com estado local
- Gerencia seleção de posições
- Envia dados via API
- Validações locais antes de enviar

## Como Usar

### Para Administradores

1. Crie um evento normalmente
2. Compartilhe o link: `https://seusite.com/events/[ID-DO-EVENTO]`
3. Membros do grupo podem acessar e confirmar presença

### Para Membros

1. Acesse o link recebido (ou clique no card de próximos jogos)
2. Veja as informações do evento
3. Selecione sua posição preferencial
4. (Opcional) Selecione segunda posição
5. Clique em "Confirmar Presença" ou "Não Vou"

## Próximos Passos (Futuro)

### Fase 2: Campo Visual Interativo

Ver documentação completa em: [`CAMPO_VISUAL_FUTURO.md`](./CAMPO_VISUAL_FUTURO.md)

**Resumo**:
- Campo de futebol 7 em SVG/Canvas
- Posições clicáveis visualmente
- Visão isométrica 3D
- Animações e feedback visual aprimorado

### Fase 3: Sorteio Inteligente

Usar as posições selecionadas para:
- Balancear times com base nas preferências
- Garantir que cada time tenha cobertura de todas as posições
- Evitar dois goleiros no mesmo time (se possível)
- Algoritmo de distribuição justa

### Fase 4: Estatísticas por Posição

- Ranking de melhores por posição
- Comparação de desempenho em diferentes posições
- Recomendações de posição baseadas em histórico

## Testes Manuais Recomendados

### Cenário 1: Confirmação Básica
1. ✓ Acessar `/events/[eventId]`
2. ✓ Selecionar 1ª posição
3. ✓ Confirmar presença
4. ✓ Verificar que aparece na lista de confirmados

### Cenário 2: Seleção de 2 Posições
1. ✓ Selecionar 1ª posição
2. ✓ Selecionar 2ª posição (diferente)
3. ✓ Confirmar presença
4. ✓ Verificar que ambas aparecem nos detalhes

### Cenário 3: Validação de Posições Duplicadas
1. ✓ Selecionar 1ª posição (ex: Goleiro)
2. ✓ Selecionar 2ª posição (mesma: Goleiro)
3. ✓ Tentar confirmar
4. ✓ Verificar toast de erro

### Cenário 4: Lista de Espera
1. ✓ Evento com vagas lotadas
2. ✓ Confirmar presença
3. ✓ Verificar que vai para waitlist
4. ✓ Badge de "Lista de espera" aparece

### Cenário 5: Cancelamento
1. ✓ Estando confirmado
2. ✓ Clicar em "Não Vou"
3. ✓ Verificar remoção da lista
4. ✓ Verificar que primeiro da waitlist sobe

### Cenário 6: Responsividade
1. ✓ Testar em desktop (grid 4 colunas)
2. ✓ Testar em tablet (grid 2 colunas)
3. ✓ Testar em mobile (grid 2 colunas)
4. ✓ Verificar que tudo é clicável e visível

## Arquivos Modificados/Criados

```
src/
├── app/
│   ├── api/events/[eventId]/rsvp/route.ts        (modificado)
│   └── events/[eventId]/page.tsx                 (novo)
├── components/
│   └── events/event-rsvp-form.tsx                (novo)
├── db/
│   └── migrations/
│       ├── 001_add_position_preferences.sql      (novo)
│       └── README.md                              (novo)
├── lib/
│   └── validations.ts                             (modificado)
docs/
├── CAMPO_VISUAL_FUTURO.md                         (novo)
└── FEATURE_LINK_PARTICIPACAO.md                   (este arquivo)
```

## Suporte e Troubleshooting

### Problema: "Evento não encontrado"
- Verificar se o eventId está correto
- Verificar se o usuário é membro do grupo
- Verificar se o evento existe no banco

### Problema: Posições não salvam
- Verificar se a migração foi aplicada
- Verificar logs da API
- Verificar permissões do usuário

### Problema: Lista de espera não funciona
- Verificar se `waitlist_enabled` está `true` no evento
- Verificar cálculo de vagas no backend

## Métricas de Sucesso

- ✅ Build passa sem erros
- ✅ TypeScript sem erros de tipo
- ✅ ESLint sem warnings
- ✅ Página renderiza corretamente
- ✅ API aceita novos campos
- ✅ Dados salvam corretamente

---

**Data de Implementação**: 2025-10-30
**Versão**: 1.0.0
**Status**: ✅ Implementado e testado (build)
**Próximos Passos**: Aplicar migração no ambiente de produção
