# Migrations

Migrations SQL versionadas, aplicadas pelo runner em `src/db/migrate.mjs`.

## Convenção de nomes

Use timestamp + descrição em snake_case:

```
20260513120000_add_verified_to_users.sql
```

Aceitamos também os nomes legados existentes (sem timestamp), mas para novas migrations prefira o formato acima — ordena alfabeticamente em ordem cronológica.

## Como aplicar

```bash
pnpm db:migrate -- --only 20260513120000_add_verified_to_users.sql
pnpm db:status   # confirma registro em public.schema_migrations
```

Detalhes do workflow completo em [../MIGRATION_WORKFLOW.md](../MIGRATION_WORKFLOW.md).

## Estrutura recomendada de cada arquivo

```sql
-- Migration: <nome curto>
-- Date: YYYY-MM-DD
-- Description: <o que ela faz e por quê>

BEGIN;

-- DDL aqui (use IF NOT EXISTS / IF EXISTS)

COMMIT;

-- Rollback (manual):
-- BEGIN;
-- ...
-- COMMIT;
```

## `schema.sql`

Snapshot consolidado do schema. **Não é uma migration que roda** — é referência. Mantenha sincronizado quando adicionar tabelas ou colunas novas (cole o DDL aditivo da migration no lugar correspondente).

## Legados (PEND no `db:status`)

Vários arquivos aqui foram criados **antes** da tabela `schema_migrations` existir. Eles já estão aplicados nos bancos de produção mas não estão registrados. Aparecem como `PEND` no `pnpm db:status` — isso é esperado. **Não use `pnpm db:migrate -- --all`**: vai tentar reaplicar e quebrar. Sempre `--only <arquivo>.sql` para mudanças novas.

Arquivos antigos de setup inicial / scripts de verificação ficam em `_archive/` e não são lidos pelo runner.
