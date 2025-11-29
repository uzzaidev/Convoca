# Peladeiros - Guia de Cores

Este documento define a paleta de cores padrão do Peladeiros para garantir consistência visual em toda a aplicação.

## Paleta Principal

### Verde (Primary)
O verde representa energia, esporte e o campo de futebol. É nossa cor principal de ação.

- **Verde Vibrante** (Primary)
  - Hex: `#16a34a`
  - RGB: `22, 163, 74`
  - HSL: `142, 76%, 36%`
  - Uso: Botões primários, links, CTAs principais

- **Verde Escuro** (Green Dark)
  - Hex: `#0f5f3f`
  - RGB: `15, 95, 63`
  - HSL: `152, 70%, 22%`
  - Tailwind: `green-dark`
  - Uso: Gradientes, backgrounds secundários, acentos

- **Verde Claro** (Green Light)
  - Hex: `#22c55e`
  - RGB: `34, 197, 94`
  - HSL: `152, 60%, 35%`
  - Tailwind: `green-dark-light`
  - Uso: Hover states, highlights leves

### Azul Marinho (Navy)
O azul marinho transmite profissionalismo, confiança e seriedade.

- **Navy** (Escuro)
  - Hex: `#1e3a5f`
  - RGB: `30, 58, 95`
  - HSL: `215, 60%, 16%`
  - Tailwind: `navy`
  - Uso: Backgrounds principais, headers, textos importantes

- **Navy Light** (Claro)
  - Hex: `#2d4a6f`
  - RGB: `45, 74, 111`
  - HSL: `215, 50%, 25%`
  - Tailwind: `navy-light`
  - Uso: Backgrounds secundários, cards, elementos de destaque

### Cinza (Neutral)
Tons neutros para backgrounds, textos e elementos UI.

- **Cinza Claro** (Gray Light)
  - Hex: `#f3f4f6`
  - RGB: `243, 244, 246`
  - Tailwind: `gray-100`
  - Uso: Backgrounds secundários, separadores

- **Cinza Médio** (Gray Medium)
  - Hex: `#6b7280`
  - RGB: `107, 114, 128`
  - Tailwind: `gray-500`
  - Uso: Textos secundários, placeholders

- **Cinza Escuro** (Gray Dark)
  - Hex: `#1f2937`
  - RGB: `31, 41, 55`
  - Tailwind: `gray-800`
  - Uso: Textos principais, elementos de contraste

## Cores Semânticas

### Sucesso
- **Verde Sucesso**
  - Hex: `#10b981`
  - Tailwind: `green-500`
  - Uso: Mensagens de sucesso, confirmações

### Erro
- **Vermelho Erro**
  - Hex: `#ef4444`
  - Tailwind: `red-500`
  - Uso: Mensagens de erro, validações

### Aviso
- **Amarelo Aviso**
  - Hex: `#f59e0b`
  - Tailwind: `yellow-500`
  - Uso: Alertas, avisos importantes

### Informação
- **Azul Info**
  - Hex: `#3b82f6`
  - Tailwind: `blue-500`
  - Uso: Mensagens informativas, dicas

## Gradientes

### Gradiente Hero
```css
background: linear-gradient(to bottom right, #1e3a5f, #2d4a6f, #0f5f3f);
```
- Tailwind: `bg-gradient-to-br from-navy via-navy-light to-green-dark`
- Uso: Hero sections, backgrounds principais

### Gradiente Secundário
```css
background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
```
- Tailwind: `bg-gradient-to-b from-gray-50 to-gray-100`
- Uso: Sections alternadas, cards

## Aplicação no Tailwind

As cores customizadas estão configuradas em `src/app/globals.css` e `tailwind.config.ts`:

```typescript
// tailwind.config.ts
colors: {
  navy: {
    DEFAULT: "hsl(var(--navy))",
    light: "hsl(var(--navy-light))",
  },
  "green-dark": {
    DEFAULT: "hsl(var(--green-dark))",
    light: "hsl(var(--green-light))",
  },
}
```

## Exemplos de Uso

### Botões

```tsx
// Botão Primário (Verde)
<Button className="bg-green-600 hover:bg-green-700 text-white">
  Ação Primária
</Button>

// Botão Secundário (Outline)
<Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
  Ação Secundária
</Button>
```

### Backgrounds

```tsx
// Background com gradiente
<div className="bg-gradient-to-br from-navy via-navy-light to-green-dark">
  Conteúdo
</div>

// Background neutro
<div className="bg-gray-50">
  Conteúdo
</div>
```

### Textos

```tsx
// Título principal
<h1 className="text-navy font-bold">Título</h1>

// Texto secundário
<p className="text-gray-600">Descrição</p>

// Texto de destaque
<span className="text-green-600 font-semibold">Destaque</span>
```

## Acessibilidade

### Contraste Mínimo
Todas as combinações de cores seguem as diretrizes WCAG 2.1 para contraste:

- **Texto Normal**: Mínimo 4.5:1
- **Texto Grande**: Mínimo 3:1
- **Elementos UI**: Mínimo 3:1

### Combinações Aprovadas

✅ **Boas Combinações:**
- Navy (`#1e3a5f`) + Branco (`#ffffff`) - Ratio: 9.2:1
- Verde (`#16a34a`) + Branco (`#ffffff`) - Ratio: 4.8:1
- Gray Dark (`#1f2937`) + Branco (`#ffffff`) - Ratio: 14.1:1

❌ **Evitar:**
- Verde Claro sobre branco para textos pequenos
- Cinza médio sobre cinza claro

## Responsividade

As cores devem funcionar bem em:
- Modo claro (padrão)
- Modo escuro (se implementado)
- Diferentes níveis de zoom
- Diferentes tamanhos de tela

## Manutenção

Ao adicionar novas cores:
1. Atualize `src/app/globals.css` com as variáveis CSS
2. Adicione ao `tailwind.config.ts`
3. Documente neste arquivo
4. Teste o contraste de acessibilidade
5. Atualize componentes existentes se necessário

---

**Última atualização**: 2025-01-29
**Versão**: 1.0.0
