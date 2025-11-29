# Database Migrations Guide

Este documento explica como executar as migrations do banco de dados.

## 📋 Migrations Disponíveis

### ✅ Migration 001: Schema Inicial
**Arquivo**: `src/db/migrations/neon-setup-fixed.sql`
**Status**: ✅ JÁ APLICADO
**Descrição**: Schema completo inicial do projeto

---

### 🆕 Migration 002: Performance Indexes
**Arquivo**: `src/db/migrations/002_performance_indexes.sql`
**Status**: ⚠️ PENDENTE
**Prioridade**: 🔴 ALTA

**Descrição**:
Adiciona índices para melhorar performance de queries frequentes.

**Benefícios**:
- ✅ Queries 10-50x mais rápidas
- ✅ Reduz carga no banco de dados
- ✅ Melhora experiência do usuário

**Quando executar**:
- Imediatamente em desenvolvimento
- Antes de ir para produção
- Durante janela de manutenção (produção)

**Impacto**:
- ⚡ Tempo de execução: ~5-10 segundos
- 💾 Espaço adicional: ~50-100 MB (dependendo dos dados)
- 🔒 Lock tables: NÃO (usa IF NOT EXISTS)
- ⚠️ Downtime: ZERO

**Como executar**:
```bash
# Opção 1: Via Neon CLI
neon sql < src/db/migrations/002_performance_indexes.sql

# Opção 2: Via Neon Console
# Copie e cole o conteúdo do arquivo no Query Editor
```

**Validação**:
```sql
-- Verificar se índices foram criados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Deve retornar ~20 índices novos
```

---

### 🆕 Migration 003: Soft Delete Support
**Arquivo**: `src/db/migrations/003_soft_delete.sql`
**Status**: ⚠️ OPCIONAL
**Prioridade**: 🟡 MÉDIA

**Descrição**:
Adiciona suporte para soft delete (deleção lógica) para prevenir perda acidental de dados.

**Benefícios**:
- ✅ Recuperação de dados deletados
- ✅ Auditoria completa
- ✅ Histórico preservado

**Quando executar**:
- Quando decidir implementar soft delete
- Após atualizar código da aplicação

**Impacto**:
- ⚡ Tempo de execução: ~2-5 segundos
- 💾 Espaço adicional: Mínimo (~4 bytes por registro)
- 🔒 Lock tables: NÃO
- ⚠️ Downtime: ZERO

**⚠️ ATENÇÃO**: Requer mudanças no código da aplicação!
Após executar esta migration, você DEVE atualizar todas as queries para incluir `WHERE deleted_at IS NULL`.

**Como executar**:
```bash
# Apenas quando estiver pronto para implementar soft delete
neon sql < src/db/migrations/003_soft_delete.sql
```

---

## 🚀 Executando Migrations

### Opção 1: Neon CLI (Recomendado)

```bash
# Instalar Neon CLI (se ainda não tiver)
npm install -g neonctl

# Login
neon auth

# Executar migration
neon sql --project-id SEU_PROJECT_ID < src/db/migrations/002_performance_indexes.sql
```

### Opção 2: Neon Console (Web)

1. Acesse https://console.neon.tech
2. Selecione seu projeto
3. Vá em "SQL Editor"
4. Abra o arquivo da migration
5. Copie todo o conteúdo
6. Cole no editor
7. Clique em "Run"

### Opção 3: psql (Local Development)

```bash
psql $DATABASE_URL -f src/db/migrations/002_performance_indexes.sql
```

---

## 📊 Ordem de Execução Recomendada

Para um novo ambiente:

```bash
# 1. Schema inicial (se ainda não executado)
neon sql < src/db/migrations/neon-setup-fixed.sql

# 2. Performance indexes (EXECUTE AGORA)
neon sql < src/db/migrations/002_performance_indexes.sql

# 3. Soft delete (OPCIONAL - Execute quando decidir implementar)
# neon sql < src/db/migrations/003_soft_delete.sql
```

---

## ✅ Checklist Pós-Migration

Após executar migration 002 (indexes):

- [ ] Verificar que índices foram criados (query acima)
- [ ] Testar queries principais estão mais rápidas
- [ ] Executar `ANALYZE` em tabelas principais
- [ ] Monitorar uso de disco
- [ ] Validar que aplicação funciona normalmente

Após executar migration 003 (soft delete):

- [ ] Atualizar código para usar `deleted_at IS NULL`
- [ ] Criar helpers para soft delete
- [ ] Testar recuperação de dados
- [ ] Documentar processo de restore
- [ ] Criar job de limpeza (opcional)

---

## 🔧 Troubleshooting

### "ERROR: index already exists"
✅ OK - Isso é esperado. A migration usa `IF NOT EXISTS`.

### "ERROR: out of memory"
⚠️ Banco muito grande. Execute índices um por vez:
```sql
CREATE INDEX idx_events_group_starts ON events(group_id, starts_at);
-- Execute um por vez, aguarde finalizar
```

### Performance piorou após migration
❌ Raro, mas pode acontecer. Execute:
```sql
VACUUM ANALYZE events;
VACUUM ANALYZE group_members;
-- Faça para todas as tabelas com novos índices
```

---

## 📈 Monitoramento

### Verificar tamanho dos índices:
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Verificar uso dos índices:
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

Se `idx_scan` = 0 após alguns dias, o índice não está sendo usado e pode ser removido.

---

## 🆘 Rollback

Se precisar reverter migration 002:
```sql
-- Remover índices criados
DROP INDEX IF EXISTS idx_events_group_starts;
DROP INDEX IF EXISTS idx_group_members_group_user;
-- ... (todos os índices criados)
```

Se precisar reverter migration 003:
```sql
-- Remover colunas deleted_at
ALTER TABLE groups DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE group_members DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE charges DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE invites DROP COLUMN IF EXISTS deleted_at;

-- Remover views
DROP VIEW IF EXISTS active_groups;
DROP VIEW IF EXISTS active_group_members;
```

---

## 📞 Suporte

Problemas com migrations? Veja:
- [Documentação Neon](https://neon.tech/docs)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- Abra uma issue no repositório
