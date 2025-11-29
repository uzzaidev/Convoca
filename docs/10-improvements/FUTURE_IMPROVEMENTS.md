# Melhorias Futuras para Rankings e Estatísticas

Este documento detalha melhorias potenciais para futuras iterações da funcionalidade de rankings e estatísticas do Peladeiros.

## ✅ Implementações Concluídas (Atual)

### Melhorias Visuais e UX
- ✅ **Animações ao trocar tabs**: Adicionadas animações suaves (fade-in e zoom-in) ao alternar entre abas
- ✅ **Ícones Lucide**: Substituição completa de emojis por ícones profissionais da biblioteca Lucide
  - Rankings: Trophy, Goal, Target, Hand
  - Estatísticas pessoais: Goal, Target, TrendingUp, Trophy, Star, Crown
  - Frequência: BarChart3
  - Jogos recentes: Trophy, Calendar, MapPin
- ✅ **Tabelas profissionais**: Formato de tabela com cabeçalhos para ranking geral
  - Colunas: #, Jogador, Jogos, Gols, Assistências, MVPs, Vitórias, Pontos
  - Design responsivo e otimizado
  - Mesmo padrão aplicado às outras abas (artilheiros, garçons, goleiros)
- ✅ **Dark mode otimizado**: Sistema de cores bem definido com suporte completo a dark mode

## 🔄 Investigações Necessárias

### Cálculo de Frequência
**Status**: Requer investigação com dados reais

**Problema Relatado**: 
- Quando há apenas 1 jogo finalizado e todos os jogadores participaram, a frequência aparece como 50% ao invés de 100%

**Análise do Código**:
```sql
-- Query atual
ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM recent_events), 1) as frequency_percentage
```

**Possíveis Causas**:
1. Registros duplicados na tabela `event_attendance`
2. Eventos fantasma na tabela `events` com status 'finished'
3. Problema com filtro `checked_in_at IS NOT NULL`

**Ação Recomendada**:
- Executar query de diagnóstico em produção para verificar dados
- Adicionar DISTINCT se necessário
- Validar integridade dos dados de attendance

## 🎯 Funcionalidades Avançadas Planejadas

### 1. Filtros por Período
**Prioridade**: Alta  
**Complexidade**: Média  
**Estimativa**: 8-16 horas

**Descrição**:
Adicionar filtros para visualizar estatísticas por período específico.

**Funcionalidades**:
- Filtro por mês (últimos 30 dias, 60 dias, 90 dias)
- Filtro por ano
- Seletor de período personalizado (data início - data fim)
- Aplicar filtros a todas as abas de ranking
- Persistir filtros selecionados na sessão do usuário

**Componentes Necessários**:
```tsx
// Exemplo de componente DateRangePicker
import { DateRangePicker } from "@/components/ui/date-range-picker"

// No RankingsCard
<div className="flex gap-2 mb-4">
  <Select onValueChange={handlePeriodChange}>
    <SelectTrigger>
      <SelectValue placeholder="Período" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="30">Últimos 30 dias</SelectItem>
      <SelectItem value="60">Últimos 60 dias</SelectItem>
      <SelectItem value="90">Últimos 90 dias</SelectItem>
      <SelectItem value="year">Este ano</SelectItem>
      <SelectItem value="all">Todos os tempos</SelectItem>
      <SelectItem value="custom">Personalizado</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Alterações no Backend**:
- Modificar queries SQL para aceitar parâmetros de data
- Adicionar filtros WHERE nas queries existentes
- Criar endpoint `/api/groups/[groupId]/stats?startDate=&endDate=`

**Dependências**:
- Componente DatePicker do shadcn/ui: `npx shadcn@latest add calendar`
- Componente Select já existe

### 2. Exportação de Rankings
**Prioridade**: Média  
**Complexidade**: Alta  
**Estimativa**: 16-24 horas

**Descrição**:
Permitir exportação de rankings em diferentes formatos.

**Formatos Suportados**:
- **PDF**: Documento formatado com logo do grupo e rankings
- **Imagem (PNG/JPG)**: Screenshot otimizado dos rankings
- **CSV**: Para análise em planilhas
- **JSON**: Para integração com outras ferramentas

**Bibliotecas Recomendadas**:
```json
{
  "dependencies": {
    "@react-pdf/renderer": "^3.4.0",  // Para gerar PDFs
    "html2canvas": "^1.4.1",          // Para screenshots
    "jspdf": "^2.5.1"                 // Alternativa para PDF
  }
}
```

**Implementação Sugerida**:
```tsx
// Componente ExportButton
import { FileDown, Image, FileText, FileJson } from "lucide-react"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <FileDown className="mr-2 h-4 w-4" />
      Exportar
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => exportAsPDF()}>
      <FileText className="mr-2 h-4 w-4" />
      PDF
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportAsImage()}>
      <Image className="mr-2 h-4 w-4" />
      Imagem
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportAsCSV()}>
      <FileText className="mr-2 h-4 w-4" />
      CSV
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportAsJSON()}>
      <FileJson className="mr-2 h-4 w-4" />
      JSON
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Funcionalidades do PDF**:
- Cabeçalho com logo e nome do grupo
- Data de geração
- Período dos dados
- Todos os rankings (geral, artilheiros, garçons, goleiros)
- Rodapé com assinatura do app

### 3. Gráficos de Evolução de Performance
**Prioridade**: Alta  
**Complexidade**: Alta  
**Estimativa**: 24-40 horas

**Descrição**:
Visualizar a evolução de performance dos jogadores ao longo do tempo.

**Bibliotecas Recomendadas**:
```json
{
  "dependencies": {
    "recharts": "^2.12.0",    // Biblioteca de gráficos React
    "chart.js": "^4.4.0",     // Alternativa
    "react-chartjs-2": "^5.2.0"
  }
}
```

**Tipos de Gráficos**:

#### 3.1. Gráfico de Linha - Evolução Individual
```tsx
// Evolução de gols, assistências e MVPs ao longo do tempo
<LineChart data={playerEvolutionData}>
  <Line dataKey="goals" stroke="#22c55e" name="Gols" />
  <Line dataKey="assists" stroke="#3b82f6" name="Assistências" />
  <Line dataKey="mvps" stroke="#f59e0b" name="MVPs" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
</LineChart>
```

#### 3.2. Gráfico de Barras - Comparação Mensal
```tsx
// Desempenho mensal agregado
<BarChart data={monthlyStats}>
  <Bar dataKey="points" fill="#8b5cf6" name="Pontos" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
</BarChart>
```

#### 3.3. Gráfico Radar - Perfil do Jogador
```tsx
// Visualizar múltiplas métricas em formato radar
<RadarChart data={playerProfile}>
  <PolarGrid />
  <PolarAngleAxis dataKey="metric" />
  <PolarRadiusAxis />
  <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
</RadarChart>

// Métricas: Gols, Assistências, Frequência, Vitórias, Rating Médio
```

**Dados Necessários**:
- Histórico de jogos com timestamp
- Métricas agregadas por período
- Tendências calculadas (média móvel)

**Nova Tabela no Banco** (opcional):
```sql
CREATE TABLE player_stats_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  period_start DATE,
  period_end DATE,
  games_played INTEGER,
  goals INTEGER,
  assists INTEGER,
  mvps INTEGER,
  avg_rating DECIMAL(3,2),
  total_points INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index para queries rápidas
CREATE INDEX idx_stats_history_user_period 
ON player_stats_history(user_id, period_start, period_end);
```

### 4. Comparação entre Jogadores
**Prioridade**: Média  
**Complexidade**: Média  
**Estimativa**: 12-20 horas

**Descrição**:
Permitir comparação lado a lado entre 2 ou mais jogadores.

**Interface Sugerida**:
```tsx
// Componente PlayerComparison
<Card>
  <CardHeader>
    <CardTitle>Comparar Jogadores</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      {/* Seletor de jogadores */}
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Jogador 1" />
        </SelectTrigger>
        {/* Lista de jogadores */}
      </Select>
      
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Jogador 2" />
        </SelectTrigger>
        {/* Lista de jogadores */}
      </Select>
    </div>
    
    {/* Tabela de comparação */}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Métrica</TableHead>
          <TableHead>{player1.name}</TableHead>
          <TableHead>{player2.name}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Jogos</TableCell>
          <TableCell>{player1.games}</TableCell>
          <TableCell>{player2.games}</TableCell>
        </TableRow>
        {/* Outras métricas */}
      </TableBody>
    </Table>
    
    {/* Gráfico de comparação */}
    <RadarChart data={comparisonData}>
      <Radar name={player1.name} dataKey="player1" />
      <Radar name={player2.name} dataKey="player2" />
    </RadarChart>
  </CardContent>
</Card>
```

**Métricas para Comparação**:
- Jogos jogados
- Gols (total e por jogo)
- Assistências (total e por jogo)
- MVPs
- Taxa de vitória
- Rating médio
- Frequência
- Cartões (amarelos/vermelhos)

**Funcionalidades Adicionais**:
- Permitir comparação de até 4 jogadores
- Destacar quem está melhor em cada métrica
- Opção de compartilhar comparação (screenshot)
- Histórico de comparações salvas

### 5. Otimizações de Dark Mode
**Prioridade**: Baixa  
**Complexidade**: Baixa  
**Estimativa**: 4-8 horas

**Melhorias Sugeridas**:

#### 5.1. Contraste Aprimorado
```css
.dark {
  /* Aumentar contraste para melhor legibilidade */
  --card: 240 10% 5%;  /* Mais escuro */
  --muted: 240 3.7% 18%; /* Mais claro */
}
```

#### 5.2. Cores Específicas para Dark Mode
```tsx
// Usar cores diferentes para rankings em dark mode
const medalColors = {
  first: isDark 
    ? "bg-yellow-400 text-yellow-950" 
    : "bg-yellow-500 text-yellow-950",
  second: isDark 
    ? "bg-slate-200 text-slate-900" 
    : "bg-slate-300 text-slate-900",
  third: isDark 
    ? "bg-orange-500 text-orange-50" 
    : "bg-orange-600 text-orange-50"
}
```

#### 5.3. Transições Suaves
```tsx
// Adicionar transição suave ao alternar modo
<body className="transition-colors duration-300">
```

#### 5.4. Toggle de Dark Mode
```tsx
// Adicionar botão para alternar modo
import { Moon, Sun } from "lucide-react"

<Button
  variant="ghost"
  size="icon"
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
>
  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
</Button>
```

## 📊 Funcionalidades Complementares

### 6. Badges e Conquistas
**Prioridade**: Média  
**Complexidade**: Média  

Adicionar sistema de badges e conquistas:
- Artilheiro do mês
- Sequência de vitórias
- 100% de presença
- Hat-trick (3 gols em um jogo)
- Muralha (goleiro sem sofrer gols)

### 7. Notificações de Rankings
**Prioridade**: Baixa  
**Complexidade**: Média  

Notificar jogadores sobre:
- Subida no ranking
- Novo recorde pessoal
- Próximo da liderança
- Perda de posição

### 8. Rankings Semanais/Mensais
**Prioridade**: Média  
**Complexidade**: Baixa  

Adicionar tabs para:
- Ranking da semana
- Ranking do mês
- Ranking do ano
- Ranking histórico

### 9. Estatísticas Detalhadas
**Prioridade**: Baixa  
**Complexidade**: Alta  

Adicionar métricas avançadas:
- Taxa de conversão (gols/tentativas)
- Participação em gols (gols + assistências)
- Média de ações por jogo
- Heat map de performance
- Desempenho por posição

### 10. Perfil Público do Jogador
**Prioridade**: Baixa  
**Complexidade**: Alta  

Criar página de perfil com:
- Gráficos de evolução
- Histórico completo
- Melhores momentos
- Estatísticas comparativas
- Compartilhamento em redes sociais

## 🔧 Melhorias Técnicas

### Performance
- Implementar cache de queries complexas
- Adicionar paginação nos rankings
- Otimizar queries SQL (índices adicionais)
- Lazy loading de gráficos

### UX/UI
- Skeleton loaders durante carregamento
- Animações de transição entre estados
- Feedback visual em ações (loading states)
- Responsividade aprimorada para tablets

### Acessibilidade
- ARIA labels em todos os componentes
- Navegação por teclado
- Alto contraste opcional
- Suporte a screen readers

## 📝 Notas de Implementação

### Ordem Sugerida de Implementação

**Fase 1 - Fundação** (Sprint 1-2):
1. Filtros por período
2. Otimizações de dark mode
3. Fix do cálculo de frequência (se necessário)

**Fase 2 - Visualização** (Sprint 3-4):
4. Gráficos de evolução
5. Rankings semanais/mensais

**Fase 3 - Compartilhamento** (Sprint 5-6):
6. Exportação de rankings
7. Comparação entre jogadores

**Fase 4 - Gamificação** (Sprint 7-8):
8. Badges e conquistas
9. Perfil público do jogador

### Considerações de Performance

Para queries de estatísticas complexas, considerar:
- Materializar views no PostgreSQL
- Implementar cache com Redis
- Usar queries incrementais (ao invés de full scan)
- Adicionar worker para cálculos pesados

### Testes

Para cada nova funcionalidade, implementar:
- Testes unitários (Jest)
- Testes de integração (API)
- Testes E2E (Playwright/Cypress)
- Testes de performance (k6)

## 🎨 Design System

Manter consistência visual:
- Usar ícones Lucide em todos os novos componentes
- Seguir padrão de cores estabelecido
- Aplicar animações sutis e consistentes
- Manter acessibilidade (contraste, tamanho de fonte)

## 📚 Recursos Úteis

### Bibliotecas Recomendadas
- **Gráficos**: recharts, chart.js, visx
- **Exportação**: @react-pdf/renderer, html2canvas
- **Data**: date-fns, dayjs
- **Animações**: framer-motion, react-spring
- **Tabelas**: @tanstack/react-table

### Referências de Design
- Strava (gráficos de performance)
- GitHub (contribution graphs)
- Duolingo (badges e conquistas)
- FotMob (estatísticas de futebol)

---

**Última atualização**: 2025-10-28  
**Versão**: 1.0  
**Mantido por**: Equipe Peladeiros
