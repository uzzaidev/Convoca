# 📊 Resumo das Migrações - Draw Configs & Event Settings

## 🎯 O que foi implementado

Adição de duas novas tabelas para configuração avançada de sorteios e eventos por grupo, com sistema completo de tracking e backup.

## 📅 Data da Aplicação
- **Data**: 30 de outubro de 2025
- **Status**: ✅ Aplicado com sucesso
- **Backup**: Criado automaticamente antes da aplicação

## 🗄️ Tabelas Criadas

### 1. `draw_configs` - Configurações de Sorteio

**Propósito**: Armazenar configurações do algoritmo de sorteio por grupo

**Estrutura**:
```sql
CREATE TABLE draw_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  players_per_team INTEGER DEFAULT 7 CHECK (players_per_team >= 1 AND players_per_team <= 22),
  reserves_per_team INTEGER DEFAULT 2 CHECK (reserves_per_team >= 0 AND reserves_per_team <= 11),
  gk_count INTEGER DEFAULT 1 CHECK (gk_count >= 0 AND gk_count <= 5),
  defender_count INTEGER DEFAULT 2 CHECK (defender_count >= 0 AND defender_count <= 11),
  midfielder_count INTEGER DEFAULT 2 CHECK (midfielder_count >= 0 AND midfielder_count <= 11),
  forward_count INTEGER DEFAULT 2 CHECK (forward_count >= 0 AND forward_count <= 11),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id)
);

-- Índice para performance
CREATE INDEX idx_draw_configs_group ON draw_configs(group_id);
```

**Campos**:
- `players_per_team`: Jogadores titulares por time (1-22)
- `reserves_per_team`: Reservas por time (0-11)
- `gk_count`: Número de goleiros por time (0-5)
- `defender_count`: Número de zagueiros por time (0-11)
- `midfielder_count`: Número de meio-campistas por time (0-11)
- `forward_count`: Número de atacantes por time (0-11)

### 2. `event_settings` - Configurações de Eventos

**Propósito**: Armazenar configurações padrão de eventos por grupo

**Estrutura**:
```sql
CREATE TABLE event_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  min_players INTEGER DEFAULT 4 CHECK (min_players >= 1 AND min_players <= 22),
  max_players INTEGER DEFAULT 22 CHECK (max_players >= 1 AND max_players <= 50),
  max_waitlist INTEGER DEFAULT 10 CHECK (max_waitlist >= 0 AND max_waitlist <= 50),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id)
);

-- Índice para performance
CREATE INDEX idx_event_settings_group ON event_settings(group_id);

-- Valores padrão para grupos existentes
INSERT INTO event_settings (group_id, min_players, max_players, max_waitlist)
SELECT
  g.id,
  4,  -- min_players
  22, -- max_players
  10  -- max_waitlist
FROM groups g
WHERE NOT EXISTS (
  SELECT 1 FROM event_settings es WHERE es.group_id = g.id
);
```

**Campos**:
- `min_players`: Mínimo de jogadores para o evento (1-22)
- `max_players`: Máximo de jogadores confirmados (1-50)
- `max_waitlist`: Máximo na lista de espera (0-50)

## 🔧 Funcionalidades Implementadas

### 1. Modal de Configuração de Sorteio
- **Localização**: `src/components/events/draw-config-modal.tsx`
- **Funcionalidade**: Modal para admins configurarem algoritmo de sorteio
- **Campos**: Todos os campos da tabela `draw_configs`

### 2. Formulário de Configurações de Eventos
- **Localização**: `src/components/groups/event-settings-form.tsx`
- **Funcionalidade**: Formulário na aba "Eventos" das configurações do grupo
- **Campos**: Todos os campos da tabela `event_settings`

### 3. APIs Implementadas
- **GET/POST** `/api/groups/[groupId]/draw-config`
- **GET/POST** `/api/groups/[groupId]/event-settings`
- **PUT** `/api/events/[eventId]/draw` (algoritmo atualizado)

## 🔧 Algoritmo Inteligente de Sorteio (Corrigido)

### Como Funciona Agora (Versão Corrigida)

O algoritmo agora respeita rigorosamente os limites de posições por time:

#### **Fase 1: Distribuição por Posições Preferenciais**
- **Para cada posição** (GK, DEF, MID, FWD):
  - **Para cada time**: Aloca até o limite configurado de jogadores que escolheram aquela posição
  - Exemplo: Se `defender_count = 2`, cada time recebe no máximo 2 zagueiros que escolheram "defender"
- **Respeita limites**: Nunca excede o número máximo por posição por time

#### **Fase 2: Jogadores Restantes com Preferência**
- Jogadores que escolheram posições específicas mas não couberam são alocados nos times que ainda têm vagas para aquela posição
- Usa algoritmo de balanceamento por rating total

#### **Fase 3: Jogadores sem Preferência**
- Jogadores que não escolheram posição são distribuídos nos times com melhor "fit" (balanceamento + vagas disponíveis)

#### **Fase 4: Preenchimento Final**
- Se ainda houver vagas, preenche com jogadores de menor rating para completar os times

### Exemplo Prático

**Configuração:**
- 2 times
- `playersPerTeam: 7` (7 titulares por time)
- `defender_count: 2` (máximo 2 zagueiros por time)

**Resultado Correto:**
- Time A: 2 zagueiros (limite respeitado)
- Time B: 2 zagueiros (limite respeitado)
- **Total: 4 zagueiros** (não 8 como antes!)

### Correção do Bug Anterior

**Antes (Errado):**
```typescript
// ❌ BUG: Multiplicava por numTeams incorretamente
const playersToAssign = Math.min(required * numTeams, availablePlayers.length);
// required = 2, numTeams = 2 → playersToAssign = 4
```

**Depois (Correto):**
```typescript
// ✅ CORRETO: Distribui por time respeitando limites
for (let teamIndex = 0; teamIndex < numTeams; teamIndex++) {
  const needed = requiredPerTeam - team.positions[position];
  // Aloca apenas o necessário para cada time
}
```

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
```
src/
├── components/
│   ├── events/
│   │   ├── draw-config-modal.tsx      # Modal de configuração
│   │   └── team-draw-button.tsx       # Botão com "Editar"
│   └── groups/
│       ├── event-settings-form.tsx    # Formulário de eventos
│       └── group-settings-tabs.tsx    # Nova aba "Eventos"
├── app/api/groups/[groupId]/
│   ├── draw-config/
│   │   └── route.ts                   # API draw configs
│   └── event-settings/
│       └── route.ts                   # API event settings
└── db/migrations/
    ├── migration-draw-configs.sql     # Migration draw_configs
    └── migration-event-settings.sql   # Migration event_settings
```

### Arquivos Modificados
- `src/app/api/events/[eventId]/draw/route.ts` - Algoritmo inteligente
- `src/components/ui/dialog.tsx` - Modal responsivo

## 🔍 Como Verificar as Mudanças

### 1. Estado das Tabelas no Banco
```bash
# Ver tabelas criadas
psql "postgresql://..." -c "\dt+ *config*"
psql "postgresql://..." -c "\dt+ *settings"

# Ver estrutura detalhada
psql "postgresql://..." -c "\d+ draw_configs"
psql "postgresql://..." -c "\d+ event_settings"

# Ver dados existentes
psql "postgresql://..." -c "SELECT COUNT(*) FROM draw_configs"
psql "postgresql://..." -c "SELECT COUNT(*) FROM event_settings"
```

### 2. Arquivos de Migration
```bash
# Ver conteúdo das migrations aplicadas
cat docs/migration-draw-configs.sql
cat docs/migration-event-settings.sql
```

### 3. Backups Criados
```bash
# Backups automáticos antes da aplicação
ls backups/
# peladeiros_full_20251030_182424.sql
# peladeiros_structure_20251030_182424.sql
# peladeiros_data_20251030_182424.sql
```

### 4. Histórico no Git
```bash
# Commits relacionados
git log --oneline --grep="draw\|event.*setting"

# Ver mudanças específicas
git show HEAD -- docs/migration-draw-configs.sql
```

### 5. Console do Neon
- Acesse: https://console.neon.tech
- Vá para **Tables** → `draw_configs` e `event_settings`
- Veja estrutura, dados e execute queries

## ✅ Status da Aplicação

| Migration | Status | Data | Arquivo |
|-----------|--------|------|---------|
| `draw_configs` | ✅ Aplicada | 30/10/2025 | `migration-draw-configs.sql` |
| `event_settings` | ✅ Aplicada | 30/10/2025 | `migration-event-settings.sql` |

## 🔄 Rollback (se necessário)

### Para reverter `draw_configs`:
```sql
BEGIN;
DROP INDEX IF EXISTS idx_draw_configs_group;
DROP TABLE IF EXISTS draw_configs CASCADE;
COMMIT;
```

### Para reverter `event_settings`:
```sql
BEGIN;
DROP INDEX IF EXISTS idx_event_settings_group;
DROP TABLE IF EXISTS event_settings CASCADE;
COMMIT;
```

### Ou restaurar backup completo:
```bash
psql "postgresql://..." -f "backups/peladeiros_full_20251030_182424.sql"
```

## 🧪 Como Testar

### 1. Configuração de Sorteio
1. Vá para um evento
2. Clique em "Sortear Times" (como admin)
3. Deve aparecer botão "Editar"
4. Configure posições e jogadores por time
5. Salve e teste o sorteio

### 2. Configurações de Eventos
1. Vá para configurações do grupo
2. Clique na aba "Eventos"
3. Configure min/max jogadores e lista de espera
4. Salve as configurações

### 3. Algoritmo Inteligente
1. Crie um evento com jogadores que têm posições preferidas
2. Configure o algoritmo no modal
3. Execute o sorteio
4. Verifique se times estão balanceados por posição e ranking

## 📊 Vantagens Implementadas

### 1. Flexibilidade
- ✅ Cada grupo pode ter suas próprias configurações
- ✅ Algoritmo adaptável por posição
- ✅ Limites personalizáveis por evento

### 2. Melhor Experiência
- ✅ Times mais balanceados
- ✅ Respeito às posições preferidas
- ✅ Interface intuitiva para configuração

### 3. Rastreabilidade
- ✅ Migrations versionadas no Git
- ✅ Backups automáticos
- ✅ Logs detalhados de aplicação

### 4. Segurança
- ✅ Apenas admins podem alterar configurações
- ✅ Validações rigorosas nos campos
- ✅ Transações seguras no banco

## 🎯 Próximos Passos

1. **Teste em Produção**: Validar funcionalidades no ambiente real
2. **Feedback dos Usuários**: Coletar opiniões sobre o algoritmo
3. **Ajustes Finos**: Otimizar baseado no uso real
4. **Documentação**: Atualizar guias do usuário

## 📝 Observações

✅ **Compatibilidade**: Mudanças não afetam dados existentes
✅ **Performance**: Índices criados para queries frequentes
✅ **Build**: Projeto compila sem erros após mudanças
✅ **Backup**: Criado automaticamente antes da aplicação

---

**Documentação criada em**: 1 de novembro de 2025
**Status**: ✅ Completa e atualizada</content>
<parameter name="filePath">c:\Users\Luisf\OneDrive\Github\Peladeiros App\docs\MIGRATION_SUMMARY_DRAW_CONFIGS.md