# Migração: Preferências de Posição para Eventos

## Descrição

Esta migração adiciona suporte para que jogadores selecionem suas posições preferenciais ao confirmar presença em eventos (partidas).

## Alterações no Schema

### Tabela: `event_attendance`

Foram adicionadas duas novas colunas:

- **`preferred_position`**: Primeira posição preferida do jogador
- **`secondary_position`**: Segunda posição preferida (opcional)

Valores permitidos para ambas as colunas:
- `gk` - Goleiro
- `defender` - Zagueiro
- `midfielder` - Meio-campo
- `forward` - Atacante

## Como Aplicar

### Opção 1: Via Neon Console

1. Acesse o [Neon Console](https://console.neon.tech/)
2. Selecione seu projeto
3. Vá para SQL Editor
4. Execute o conteúdo do arquivo `001_add_position_preferences.sql`

### Opção 2: Via CLI (psql)

```bash
psql $DATABASE_URL -f src/db/migrations/001_add_position_preferences.sql
```

### Opção 3: Via Node.js Script

```javascript
import { sql } from "@/db/client";
import fs from "fs";

const migration = fs.readFileSync(
  "./src/db/migrations/001_add_position_preferences.sql",
  "utf-8"
);

await sql.unsafe(migration);
console.log("Migration applied successfully!");
```

## Verificar Aplicação

Para verificar se a migração foi aplicada corretamente:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_attendance' 
  AND column_name IN ('preferred_position', 'secondary_position');
```

Resultado esperado:
```
      column_name      | data_type
-----------------------+---------------------------
 preferred_position    | character varying
 secondary_position    | character varying
```

## Rollback (se necessário)

Se precisar reverter esta migração:

```sql
-- Remover as colunas adicionadas
ALTER TABLE event_attendance
DROP COLUMN IF EXISTS preferred_position,
DROP COLUMN IF EXISTS secondary_position;

-- Remover o índice
DROP INDEX IF EXISTS idx_event_attendance_positions;
```

## Impacto

- ✅ **Compatibilidade reversa**: As colunas são opcionais (nullable), então registros antigos continuam funcionando
- ✅ **Sem breaking changes**: A API aceita mas não exige as posições
- ✅ **Performance**: Índice adicionado para queries eficientes

## Recursos Relacionados

- Endpoint: `POST /api/events/[eventId]/rsvp`
- Página: `/events/[eventId]`
- Componente: `EventRsvpForm`
- Validação: `rsvpSchema` em `lib/validations.ts`

## Próximos Passos

Após aplicar esta migração, os jogadores poderão:

1. Acessar a página de um evento via link direto (`/events/[eventId]`)
2. Selecionar até 2 posições preferenciais
3. Confirmar presença com suas preferências salvas
4. Ver as posições escolhidas por outros jogadores confirmados

As posições selecionadas poderão ser utilizadas futuramente para:
- Sorteio inteligente de times balanceados
- Estatísticas por posição
- Recomendações de formação

---

# Migração 002: Correção do Constraint de Posição em team_members

## Descrição

Esta migração corrige o constraint da coluna `position` na tabela `team_members` para permitir as posições detalhadas (gk, defender, midfielder, forward) ao invés de apenas 'gk' e 'line'.

## Problema

O sorteio de times estava falhando com erro:
```
NeonDbError: new row for relation "team_members" violates check constraint "team_members_position_check"
```

Isso acontecia porque:
- A tabela `event_attendance` permite posições: 'gk', 'defender', 'midfielder', 'forward'
- A tabela `team_members` só permitia: 'gk', 'line'
- Ao sortear times, o código tentava inserir posições como 'defender' em `team_members`, violando o constraint

## Alterações no Schema

### Tabela: `team_members`

Atualização do constraint da coluna `position`:

**Antes:**
```sql
position VARCHAR(20) DEFAULT 'line' CHECK (position IN ('gk', 'line'))
```

**Depois:**
```sql
position VARCHAR(20) DEFAULT 'line' CHECK (position IN ('gk', 'defender', 'midfielder', 'forward', 'line'))
```

## Como Aplicar

### Opção 1: Via Neon Console

1. Acesse o [Neon Console](https://console.neon.tech/)
2. Selecione seu projeto
3. Vá para SQL Editor
4. Execute o conteúdo do arquivo `002_fix_team_members_position.sql`

### Opção 2: Via CLI (psql)

```bash
psql $DATABASE_URL -f src/db/migrations/002_fix_team_members_position.sql
```

## Verificar Aplicação

Para verificar se a migração foi aplicada corretamente:

```sql
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'team_members' 
  AND con.conname = 'team_members_position_check';
```

O resultado deve mostrar que o constraint permite os 5 valores: 'gk', 'defender', 'midfielder', 'forward', 'line'.

## Impacto

- ✅ **Correção crítica**: Resolve erro que impedia o sorteio de times
- ✅ **Compatibilidade reversa**: Mantém suporte para o valor 'line' existente
- ✅ **Consistência**: Alinha com os valores usados em `event_attendance`

## Recursos Relacionados

- Endpoint: `POST /api/events/[eventId]/draw`
- Página: `/groups/[groupId]/events/[eventId]`
- Componente: `TeamDrawButton`

---

**Data**: 2025-10-30
**Versão**: 1.0.0
**Status**: Pronta para aplicação
