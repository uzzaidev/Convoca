# Workflow de migrations

Convoca usa um runner próprio em `src/db/migrate.mjs` com histórico em `public.schema_migrations`. **Não cole DDL no SQL Editor do Neon como prática normal** — migrations sobem como arquivo SQL versionado.

## Regras

- `POSTGRES_URL_NON_POOLING` para DDL (conexão direta, sem PgBouncer). O runner cai pra `DATABASE_URL_UNPOOLED`, `POSTGRES_URL`, `DATABASE_URL` se a primeira faltar.
- Sempre `pnpm db:migrate -- --only <arquivo>.sql` para um arquivo específico. **Não use `--all`** porque há migrations legadas pré-tracking-table que não estão registradas e não devem ser re-aplicadas.
- Mantenha `migrations/schema.sql` em sync com mudanças aditivas, para servir de referência.

## Fluxo padrão

```powershell
# 1. Backup preventivo (opcional mas recomendado)
pnpm backup

# 2. Criar o arquivo
.\src\db\create-migration.ps1 "add_media_url_to_events"

# 3. Editar src/db/migrations/<timestamp>_add_media_url_to_events.sql

# 4. Aplicar
pnpm db:migrate -- --only <timestamp>_add_media_url_to_events.sql

# 5. Verificar registro
pnpm db:status

# 6. Commit
git add src/db/migrations/<timestamp>_add_media_url_to_events.sql
git commit -m "feat: add media_url column to events"
```

Em produção (Vercel), aplique do seu ambiente local apontando pro `POSTGRES_URL_NON_POOLING` de prd (puxa via `npx vercel env pull` ou pelo Doppler).

## Template de migration

```sql
-- ==================================================
-- Migration: add_media_url_to_events
-- Date: 2026-05-13
-- Description: adiciona URL de mídia opcional em events
-- ==================================================

BEGIN;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS media_url TEXT;

CREATE INDEX IF NOT EXISTS idx_events_media_url
  ON public.events(media_url)
  WHERE media_url IS NOT NULL;

COMMENT ON COLUMN public.events.media_url IS 'URL do arquivo de mídia';

COMMIT;

-- Rollback (manual, se precisar):
-- BEGIN;
-- DROP INDEX IF EXISTS idx_events_media_url;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS media_url;
-- COMMIT;
```

## Padrões a seguir

- **Idempotência**: `IF NOT EXISTS` / `IF EXISTS` / `CREATE OR REPLACE` em tudo.
- **Transação**: envelopar com `BEGIN; ... COMMIT;` (o runner aplica cada arquivo como um statement único; agrupar com transação evita estado parcial em caso de erro).
- **Índices em colunas pesquisadas**: especialmente FKs e colunas usadas em `WHERE` frequentes.
- **Comentários** em colunas/tabelas novas: `COMMENT ON COLUMN ... IS '...';`.
- **Rollback no fim do arquivo** como bloco comentado.

## O que NÃO fazer

- ❌ Editar migration já aplicada (criar uma nova para corrigir).
- ❌ Apagar migration aplicada.
- ❌ Usar migration para inserir dados de produção (use seed separado em ambiente de dev).
- ❌ `pnpm db:migrate -- --all` (vai tentar reaplicar legados).
- ❌ Aplicar DDL direto no SQL Editor do Neon (escapa do tracking).

## Restaurar um backup

```bash
psql "$POSTGRES_URL_NON_POOLING" -f src/db/backups/convoca_full_<timestamp>.sql
```

## Recursos

- [Neon Docs](https://neon.tech/docs/introduction)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [pg_dump Docs](https://www.postgresql.org/docs/current/app-pgdump.html)
