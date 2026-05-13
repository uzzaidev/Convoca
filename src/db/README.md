# `src/db` — Camada de banco de dados

Convoca usa **Neon (Postgres serverless)** com SQL puro via a lib `postgres`. Sem ORM.

## Arquivos

```
src/db/
├── client.ts            # Cliente postgres exportado como `sql`
├── migrate.mjs          # Runner de migrations (lê .env.local)
├── create-migration.ps1 # Helper para criar migration nova (Windows)
├── backup-neon.bat      # Wrapper para scripts/backup-neon.mjs
├── migrations/          # Migrations versionadas (.sql)
│   ├── schema.sql       # Snapshot do schema (mantenha em sync com mudanças aditivas)
│   └── *.sql            # Migrations aplicadas
└── backups/             # Dumps locais (não commitar; já no .gitignore)
```

> Scripts/SQL legados (setup inicial, queries de verificação) ficam em `_archive/` — não são executados em nada e existem só para histórico.

## Comandos do dia-a-dia

Tudo pela raiz do projeto, via pnpm:

```bash
pnpm db:status                                  # mostra histórico + arquivos pendentes
pnpm db:migrate -- --only <arquivo>.sql         # aplica UMA migration e registra
pnpm backup                                     # dump completo do banco (Node)
pnpm backup --quick                             # só backup full (mais rápido)
```

O runner (`migrate.mjs`):
- Lê `.env.local` automaticamente, sem precisar de `dotenv`.
- Prefere `POSTGRES_URL_NON_POOLING` (direct connection — obrigatório para DDL).
- Cria `public.schema_migrations` se não existir.
- Rastreia hash SHA256 + tempo de execução de cada arquivo.

## Como criar uma nova migration

```powershell
# 1. Gere o arquivo com timestamp + nome
.\src\db\create-migration.ps1 "add_verified_to_users"

# 2. Edite o SQL gerado em src/db/migrations/<timestamp>_add_verified_to_users.sql
# 3. (Opcional) Backup preventivo
pnpm backup

# 4. Aplique
pnpm db:migrate -- --only <timestamp>_add_verified_to_users.sql

# 5. Confirme que entrou no histórico
pnpm db:status
```

## Boas práticas

- **Envelope `BEGIN; ... COMMIT;`** em toda migration estrutural.
- **Idempotência**: `IF NOT EXISTS`, `IF EXISTS`, `CREATE OR REPLACE`.
- **Rollback comentado** no fim do arquivo.
- **Mantenha `migrations/schema.sql`** em sync com mudanças aditivas (não substituir, complementar).
- **Não edite migrations já aplicadas** — crie uma nova migration de correção.

## Migrations legadas (PEND no `db:status`)

O projeto tem várias migrations criadas **antes** da tabela `schema_migrations` existir (todos os `.sql` que aparecem como `PEND` no status). Elas já foram aplicadas nos bancos de produção há muito tempo — não tente reaplicar com `--all`. Use sempre `--only <arquivo>.sql` para mudanças novas.

## Restaurar um backup

```bash
psql "<DATABASE_URL_NON_POOLING>" -f src/db/backups/convoca_full_<timestamp>.sql
```

## Pré-requisitos locais

- `psql` e `pg_dump` >= 16 no PATH (`scoop install postgresql` ou installer oficial).
- `.env.local` populado com pelo menos `DATABASE_URL` e `POSTGRES_URL_NON_POOLING`.

## Para o histórico

Houve migração de Supabase → Neon em 2026-05. O script que orquestrou está em
`scripts/migrate-to-neon.mjs` (pode ser reutilizado para Neon → outro Postgres).
