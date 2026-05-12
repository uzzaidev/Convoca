[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including
## 1. `byterover-store-knowledge`
You `MUST` always use this tool when:

+ Learning new patterns, APIs, or architectural decisions from the codebase
+ Encountering error solutions or debugging techniques
+ Finding reusable code patterns or utility functions
+ Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`
You `MUST` always use this tool when:

+ Starting any new task or implementation to gather relevant context
+ Before making architectural decisions to understand existing patterns
+ When debugging issues to check for previous solutions
+ Working with unfamiliar parts of the codebase

## Database migrations

Structural database changes must be shipped as SQL files in `src/db/migrations/`.
Do not paste ad-hoc DDL into the Neon Console as the normal workflow.

Use the project migration runner from the repository root:

```powershell
pnpm db:status
pnpm db:migrate -- --only 20260512_add_group_app_mode.sql
```

Important rules:

+ Prefer `POSTGRES_URL_NON_POOLING` from `.env.local` for migrations; the runner falls back to `POSTGRES_URL`/`DATABASE_URL`.
+ The runner records applied files in `public.schema_migrations`.
+ Apply a specific new file with `--only <filename>.sql` unless a baseline has been explicitly prepared.
+ Do not use `--all` casually, because older legacy SQL files may not be represented in `schema_migrations`.
+ Keep `src/db/migrations/schema.sql` in sync with additive schema changes.
