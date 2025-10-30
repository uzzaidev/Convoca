# 🔄 Workflow de Migrations - Peladeiros App

## ⚠️ REGRA DE OURO

**SEMPRE que for mudar a estrutura do banco de dados, USE MIGRATIONS!**

Nunca execute SQL direto no Neon Console para mudanças estruturais em produção.

---

## 📋 Dados do Nosso Banco de Dados

### Configurações Neon PostgreSQL

```bash
# Neon Project
Project: Peladeiros App
Database: neondb
Region: South America (São Paulo) - sa-east-1
Schema Principal: public

# Database Connection (Pooler - recomendado para app)
Host: ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech
Port: 5432
Database: neondb
User: neondb_owner
Password: REDACTED_PASSWORD

# Connection String (Pooled)
postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Connection String (Direct - para migrations)
postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Schemas Utilizados
- public (Dados da aplicação)

# Tabelas Principais (Schema: public)
- users (Usuários da aplicação)
- groups (Grupos/peladas)
- group_members (Membros dos grupos)
- venues (Locais de jogo)
- events (Partidas/eventos)
- event_attendance (Confirmação de presença)
- teams (Times sorteados)
- team_members (Jogadores dos times)
- event_actions (Ações da partida - gols, assistências)
- player_ratings (Avaliações de jogadores)
- invites (Convites para grupos)
- wallets (Carteiras)
- charges (Cobranças)
- transactions (Transações financeiras)
```

---

## 🚀 Como Usar Migrations (Sem Supabase CLI)

### Pré-requisitos

```powershell
# 1. Instalar PostgreSQL client (pg_dump, psql)
# Baixar de: https://www.postgresql.org/download/windows/
# Ou via Scoop:
scoop install postgresql

# 2. Verificar instalação
psql --version
pg_dump --version

# 3. Testar conexão
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

---

## 📝 Workflow Padrão

### 1️⃣ Criar Nova Migration

```powershell
# Opção 1: Script helper (recomendado)
.\src\db\create-migration.ps1 "add_column_example"

# Opção 2: Manual
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$name = "add_column_example"
New-Item -Path "src/db/migrations/${timestamp}_${name}.sql" -ItemType File
```

### 2️⃣ Editar a Migration

Abra o arquivo gerado e adicione seu SQL:

```sql
-- src/db/migrations/20251030143000_add_media_url_to_events.sql

-- ==================================================
-- Migration: Add media_url to events
-- Author: [Seu Nome]
-- Date: 2025-10-30
-- Description: Adiciona suporte para anexos de mídia
-- ==================================================

BEGIN;

-- Adicionar coluna media_url para anexos
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_events_media_url 
ON public.events(media_url) 
WHERE media_url IS NOT NULL;

-- Adicionar comentário
COMMENT ON COLUMN public.events.media_url IS 'URL do arquivo de mídia (fotos do evento)';

COMMIT;

-- ==================================================
-- Rollback (se necessário, executar manualmente):
-- 
-- BEGIN;
-- DROP INDEX IF EXISTS idx_events_media_url;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS media_url;
-- COMMIT;
-- ==================================================
```

### 3️⃣ Aplicar Migration

```powershell
# Opção 1: Via psql com connection string
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f "src/db/migrations/20251030143000_add_media_url_to_events.sql"

# Opção 2: Script helper para aplicar todas pendentes
.\src\db\apply-migrations.ps1
```

### 4️⃣ Verificar Aplicação

```powershell
# Conectar ao banco
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Verificar coluna criada
\d+ events

# Verificar índices
\di+ idx_events_media_url

# Sair
\q
```

### 5️⃣ Commitar no Git

```powershell
git add src/db/migrations/
git commit -m "feat: add media_url column to events table"
git push origin main
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Adicionar Nova Coluna

**Arquivo:** `src/db/migrations/20251030150000_add_verified_to_users.sql`

```sql
-- ==================================================
-- Migration: Add verified status to users
-- Date: 2025-10-30
-- ==================================================

BEGIN;

-- Adicionar coluna verified (boolean)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Índice para filtrar usuários verificados
CREATE INDEX IF NOT EXISTS idx_users_verified 
ON public.users(verified) 
WHERE verified = true;

-- Comentário
COMMENT ON COLUMN public.users.verified IS 'Indica se o usuário verificou o email';

COMMIT;

-- Rollback:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_users_verified;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS verified;
-- COMMIT;
```

**Aplicar:**

```powershell
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f "src/db/migrations/20251030150000_add_verified_to_users.sql"
```

### Exemplo 2: Criar Nova Tabela

**Arquivo:** `src/db/migrations/20251030151000_create_notifications_table.sql`

```sql
-- ==================================================
-- Migration: Create notifications table
-- Date: 2025-10-30
-- ==================================================

BEGIN;

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;

-- Comentários
COMMENT ON TABLE public.notifications IS 'Notificações push para usuários';
COMMENT ON COLUMN public.notifications.type IS 'Tipo da notificação: info, success, warning, error';

COMMIT;

-- Rollback:
-- BEGIN;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- COMMIT;
```

**Aplicar:**

```powershell
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f "src/db/migrations/20251030151000_create_notifications_table.sql"
```

### Exemplo 3: Adicionar Trigger de Updated At

**Arquivo:** `src/db/migrations/20251030152000_add_updated_at_trigger.sql`

```sql
-- ==================================================
-- Migration: Add updated_at trigger to groups table
-- Date: 2025-10-30
-- ==================================================

BEGIN;

-- Criar função genérica para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger na tabela groups
DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Rollback:
-- BEGIN;
-- DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
-- COMMIT;
```

**Aplicar:**

```powershell
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f "src/db/migrations/20251030152000_add_updated_at_trigger.sql"
```

### Exemplo 4: Modificar Coluna Existente

**Arquivo:** `src/db/migrations/20251030153000_change_event_name_length.sql`

```sql
-- ==================================================
-- Migration: Increase event name max length
-- Date: 2025-10-30
-- ==================================================

BEGIN;

-- Permitir nomes de eventos maiores
ALTER TABLE public.events 
ALTER COLUMN name TYPE VARCHAR(500);

-- Adicionar constraint de não vazio
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_name_check;

ALTER TABLE public.events 
ADD CONSTRAINT events_name_not_empty 
CHECK (LENGTH(TRIM(name)) > 0);

COMMIT;

-- Rollback:
-- BEGIN;
-- ALTER TABLE public.events ALTER COLUMN name TYPE VARCHAR(255);
-- COMMIT;
```

**Aplicar:**

```powershell
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f "src/db/migrations/20251030153000_change_event_name_length.sql"
```

---

## 🔄 Como Fazer Rollback (Reverter)

### Opção 1: Criar Migration de Reversão

```powershell
# Se aplicou migration que adicionou coluna 'media_url'
.\src\db\create-migration.ps1 "rollback_media_url"
```

```sql
-- src/db/migrations/20251030154000_rollback_media_url.sql

BEGIN;

-- Reverter a mudança
DROP INDEX IF EXISTS idx_events_media_url;
ALTER TABLE public.events DROP COLUMN IF EXISTS media_url;

COMMIT;
```

```powershell
# Aplicar rollback
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f "src/db/migrations/20251030154000_rollback_media_url.sql"
```

### Opção 2: Restaurar Backup Completo

```powershell
# 1. Executar script de backup (recomendado fazer antes de migrations arriscadas)
cd src\db
.\backup-neon.bat

# 2. Se precisar restaurar, use o psql
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f ".\backups\peladeiros_full_TIMESTAMP.sql"
```

---

## 📦 Comandos Úteis

### Conectar ao Banco

```powershell
# Via connection string
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Listar Tabelas

```sql
-- Conectado ao psql
\dt

-- Ou com detalhes
\dt+

-- Ver estrutura de uma tabela
\d+ users
```

### Exportar Schema Atual

```powershell
# Apenas estrutura (DDL)
$env:PGPASSWORD = "REDACTED_PASSWORD"
pg_dump -h ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech -U neondb_owner -d neondb -s -f "src/db/schema_current.sql"
```

### Executar Query Rápida

```powershell
# Via linha de comando
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM users;"
```

---

## ✅ Checklist de Migration

Antes de aplicar uma migration em produção:

- [ ] Migration tem nome descritivo e timestamp
- [ ] SQL está correto e testado
- [ ] Usa `IF NOT EXISTS` / `IF EXISTS` para ser idempotente
- [ ] Wrapped em `BEGIN; ... COMMIT;` para transação
- [ ] Índices criados para colunas pesquisadas
- [ ] Comentários explicativos no código SQL
- [ ] Seção de rollback comentada no arquivo
- [ ] Backup recente do banco existe (`.\backup-neon.bat`)
- [ ] Migration testada localmente ou em branch Neon de dev
- [ ] Migration commitada no Git
- [ ] Equipe notificada sobre mudanças estruturais

---

## ⚠️ O Que NÃO Fazer

### ❌ Nunca Faça Isso:

1. **Executar SQL direto no Neon Console para mudanças estruturais**
   ```sql
   -- ❌ NÃO fazer direto no SQL Editor do Neon
   ALTER TABLE public.events ADD COLUMN media_url TEXT;
   ```

2. **Editar migrations já aplicadas**
   ```powershell
   # ❌ NÃO editar arquivo que já foi aplicado
   # Se errou, crie uma NOVA migration para corrigir
   ```

3. **Deletar arquivos de migration**
   ```powershell
   # ❌ NÃO deletar migrations antigas
   # Elas são o histórico do banco
   ```

4. **Usar migrations para inserir dados de produção**
   ```sql
   -- ❌ NÃO usar migration para dados de clientes reais
   INSERT INTO public.groups (name, owner_id) VALUES ('Pelada Teste', '...');
   
   -- ✅ Use seed separado para dados de desenvolvimento/teste
   -- migrations/seed_dev.sql (não aplicar em produção)
   ```

5. **Esquecer de fazer backup antes de migrations arriscadas**
   ```powershell
   # ✅ SEMPRE fazer backup antes
   .\src\db\backup-neon.bat
   
   # Depois aplicar migration
   psql "..." -f "src/db/migrations/..."
   ```

6. **Não usar transações (BEGIN/COMMIT)**
   ```sql
   -- ❌ NÃO fazer assim
   ALTER TABLE users ADD COLUMN verified BOOLEAN;
   CREATE INDEX idx_users_verified ON users(verified);
   
   -- ✅ Sempre usar transação
   BEGIN;
   ALTER TABLE users ADD COLUMN verified BOOLEAN;
   CREATE INDEX idx_users_verified ON users(verified);
   COMMIT;
   ```

---

## 🎯 Quando Usar Cada Ferramenta

| Situação | Ferramenta | Comando |
|----------|-----------|---------|
| Mudar estrutura do banco | **Migration SQL** | `psql ... -f migration.sql` |
| Backup completo | **pg_dump** | `.\backup-neon.bat` |
| Testar SQL rápido | **psql** | `psql "..." -c "SELECT ..."` |
| Ver schema atual | **pg_dump -s** | `pg_dump ... -s -f schema.sql` |
| Dados de seed/demo | **Seed File** | `psql ... -f seed_dev.sql` |
| Aplicar várias migrations | **Script PowerShell** | `.\apply-migrations.ps1` |
| Reverter mudança | **Rollback Migration** | `psql ... -f rollback.sql` |

---

## 🛠️ Scripts Auxiliares

### create-migration.ps1

```powershell
# Script para criar nova migration
# Uso: .\src\db\create-migration.ps1 "nome_da_migration"

param(
    [Parameter(Mandatory=$true)]
    [string]$Name
)

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$filename = "${timestamp}_${Name}.sql"
$filepath = "src\db\migrations\$filename"

# Template de migration
$template = @"
-- ==================================================
-- Migration: $Name
-- Date: $(Get-Date -Format "yyyy-MM-dd")
-- ==================================================

BEGIN;

-- Adicione suas alterações aqui


COMMIT;

-- ==================================================
-- Rollback (executar manualmente se necessário):
-- 
-- BEGIN;
-- -- Comandos de rollback aqui
-- COMMIT;
-- ==================================================
"@

New-Item -Path $filepath -ItemType File -Value $template -Force | Out-Null

Write-Host "✅ Migration criada: $filepath" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Edite o arquivo e adicione suas alterações SQL." -ForegroundColor Cyan
Write-Host "🚀 Depois execute: psql `"postgresql://neondb_owner:...@.../neondb?sslmode=require`" -f `"$filepath`"" -ForegroundColor Cyan
```

### apply-migrations.ps1

```powershell
# Script para aplicar todas as migrations pendentes
# Uso: .\src\db\apply-migrations.ps1

$DB_URL = "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
$MIGRATIONS_DIR = "src\db\migrations"

Write-Host "🔄 Aplicando migrations..." -ForegroundColor Cyan
Write-Host ""

# Listar arquivos .sql ordenados por nome (timestamp)
$migrations = Get-ChildItem -Path $MIGRATIONS_DIR -Filter "*.sql" | Sort-Object Name

if ($migrations.Count -eq 0) {
    Write-Host "⚠️  Nenhuma migration encontrada em $MIGRATIONS_DIR" -ForegroundColor Yellow
    exit 0
}

foreach ($migration in $migrations) {
    Write-Host "📄 Aplicando: $($migration.Name)" -ForegroundColor Green
    
    psql $DB_URL -f $migration.FullName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Sucesso" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro ao aplicar migration!" -ForegroundColor Red
        Write-Host "   Parando execução." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

Write-Host "🎉 Todas as migrations foram aplicadas com sucesso!" -ForegroundColor Green
```

---

## 📚 Recursos Adicionais

- [Documentação Neon](https://neon.tech/docs/introduction)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [psql Documentation](https://www.postgresql.org/docs/current/app-psql.html)

---

## 🔑 Resumo

```
┌────────────────────────────────────────────────┐
│   MUDANÇA NO BANCO DE DADOS?                   │
│   ↓                                            │
│   1. .\backup-neon.bat (backup preventivo)    │
│   2. Criar migration SQL (timestamp_nome.sql) │
│   3. psql "..." -f migration.sql              │
│   4. Verificar no banco (psql)                │
│   5. git commit + push                         │
└────────────────────────────────────────────────┘
```

**Nunca pule esse workflow!** Suas futuras entregas e colaboradores agradecem. 🙏
