# Implementação Futura: Campo de Futebol Visual para Seleção de Posições

## Objetivo

Criar uma interface visual de um campo de futebol 7 onde os jogadores podem selecionar suas posições preferenciais de forma interativa e visual.

## Conceito Visual

Baseado na imagem de referência fornecida, o campo deve apresentar:

- **Layout**: Campo de futebol 7 em perspectiva 3D (visão isométrica)
- **Posições disponíveis**: 
  - 1 Goleiro
  - 3 Zagueiros
  - 2 Meio-campistas
  - 1 Atacante
  
## Estrutura de Posições (Futebol 7)

```
                    ATACANTE
                        ⚽

        MEIO-ESQUERDO       MEIO-DIREITO
              ⚡                 ⚡

    ZAGUEIRO-ESQ  ZAGUEIRO-CENTRAL  ZAGUEIRO-DIR
         🛡️           🛡️              🛡️

                    GOLEIRO
                       🧤
```

## Implementação Técnica

### 1. Componente SVG do Campo

```typescript
// src/components/events/soccer-field-selector.tsx
"use client";

import { useState } from "react";

type Position = {
  id: string;
  role: "gk" | "defender" | "midfielder" | "forward";
  x: number; // Coordenada X no SVG
  y: number; // Coordenada Y no SVG
  label: string;
};

const FIELD_POSITIONS: Position[] = [
  { id: "gk", role: "gk", x: 50, y: 90, label: "Goleiro" },
  { id: "def-left", role: "defender", x: 20, y: 70, label: "Zagueiro Esquerdo" },
  { id: "def-center", role: "defender", x: 50, y: 70, label: "Zagueiro Central" },
  { id: "def-right", role: "defender", x: 80, y: 70, label: "Zagueiro Direito" },
  { id: "mid-left", role: "midfielder", x: 30, y: 45, label: "Meio-campo Esquerdo" },
  { id: "mid-right", role: "midfielder", x: 70, y: 45, label: "Meio-campo Direito" },
  { id: "forward", role: "forward", x: 50, y: 20, label: "Atacante" },
];

export function SoccerFieldSelector({ 
  onSelectPosition 
}: { 
  onSelectPosition: (primary: string, secondary?: string) => void 
}) {
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);

  // Lógica de seleção e renderização do campo SVG
  // ...
}
```

### 2. Design do Campo SVG

- **Dimensões**: ViewBox 100x100 para fácil escalonamento
- **Elementos**:
  - Retângulo do campo com grama verde gradiente
  - Linhas brancas do campo (laterais, meio de campo, área)
  - Círculos clicáveis para cada posição
  - Indicadores visuais de seleção (anel colorido, pulso)
  - Labels com nome da posição ao passar o mouse

### 3. Estados Visuais

**Posição Normal:**
- Círculo branco com borda
- Ícone da posição (🧤🛡️⚡⚽)
- Opacidade 0.8

**Posição Selecionada (1ª opção):**
- Círculo com fundo verde (#10b981)
- Borda grossa verde escuro
- Ícone destacado
- Número "1" no canto

**Posição Selecionada (2ª opção):**
- Círculo com fundo azul (#3b82f6)
- Borda grossa azul escuro
- Ícone destacado
- Número "2" no canto

**Hover:**
- Efeito de pulso/escala
- Tooltip com nome da posição
- Mudança de cursor

### 4. Interações

1. **Primeiro Clique**: Seleciona posição primária (verde)
2. **Segundo Clique**: Seleciona posição secundária (azul)
3. **Clicar em posição já selecionada**: Remove seleção
4. **Trocar seleção**: Clicar em nova posição substitui a anterior

### 5. Responsividade

- **Desktop (>768px)**: Campo em tamanho grande (600x400px)
- **Tablet (768px)**: Campo médio (500x350px)
- **Mobile (<640px)**: Campo compacto (100% width, 300px height) OU fallback para lista de botões

### 6. Acessibilidade

- Botões teclado-navegáveis (Tab)
- ARIA labels descritivos
- Suporte a Enter/Space para seleção
- Contraste adequado para cores
- Modo fallback para leitores de tela

### 7. Bibliotecas Recomendadas

**Opção 1 - SVG Puro:**
- Controle total
- Melhor performance
- Mais trabalho manual

**Opção 2 - React Flow:**
```bash
npm install reactflow
```
- Drag and drop nativo
- Zoom e pan
- Mais recursos que o necessário

**Opção 3 - Konva/React-Konva:**
```bash
npm install react-konva konva
```
- Canvas-based
- Boa performance
- Animações suaves

**Recomendação:** Começar com SVG puro para MVP, considerar Konva se precisar de animações complexas

### 8. Estrutura de Arquivos

```
src/
├── components/
│   └── events/
│       ├── event-rsvp-form.tsx (atual - com botões)
│       ├── soccer-field-selector.tsx (novo - campo visual)
│       └── position-selector.tsx (wrapper que alterna entre os dois)
```

### 9. Migração Gradual

**Fase 1 (Atual):**
- Sistema de botões funcionando ✅
- Dados de posição sendo salvos ✅

**Fase 2 (Campo Visual):**
- Implementar componente `SoccerFieldSelector`
- Testar em desktop primeiro
- Manter botões como fallback

**Fase 3 (Refinamento):**
- Adicionar animações suaves
- Melhorar tooltips e feedback visual
- Teste de usabilidade com usuários reais

**Fase 4 (Opcional - Avançado):**
- Mostrar outros jogadores já posicionados
- Indicar posições mais necessárias
- Sugestões inteligentes baseadas em histórico

## Estimativa de Tempo

- **Design SVG do campo**: 4-6 horas
- **Lógica de interação**: 4-6 horas
- **Responsividade e testes**: 3-4 horas
- **Polimento e acessibilidade**: 2-3 horas

**Total estimado**: 13-19 horas de desenvolvimento

## Benefícios da Implementação Visual

✅ **UX mais intuitiva**: Jogadores visualizam melhor as posições
✅ **Engajamento**: Interface mais atrativa e gamificada
✅ **Clareza**: Entendimento imediato da formação
✅ **Diferencial**: Recurso único que destaca o app

## Riscos e Mitigações

❌ **Complexidade em mobile**: Mitigar com fallback para lista de botões
❌ **Curva de aprendizado**: Mitigar com tutorial na primeira vez
❌ **Performance**: Usar SVG otimizado, lazy loading

## Próximos Passos

1. ✅ Validar que o sistema atual de botões está funcionando
2. Criar protótipo visual no Figma/Canvas
3. Revisar com stakeholders
4. Implementar MVP do campo visual
5. Teste A/B entre botões e campo visual
6. Iterar baseado em feedback

---

**Status**: Documentação criada
**Última atualização**: 2025-10-30
**Autor**: Copilot Agent
