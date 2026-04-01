---
children_hash: 41c16171f41dfcad982290d2a115d529a8e420431b7258dbd472741fc3c00595
compression_ratio: 0.837152209492635
condensation_order: 1
covers: [context.md, provider_migration_diagnosis.md]
covers_token_total: 1222
summary_level: d1
token_count: 1023
type: summary
---
# Database

## Scope
Structural overview of the project’s database architecture, provider coupling, migration readiness, and related operational risk. This topic centers on database portability and how authentication/account flows interact with PostgreSQL infrastructure. For security implications of exposed secrets, drill into `security/operations`.

## Core Architecture
- The project is designed around **generic PostgreSQL access**, not a provider SDK.
- Database connectivity is handled through `src/db/client.ts` using a **generic postgres client**, which is the main reason the app is considered broadly portable across PostgreSQL providers.
- Authentication and account lifecycle are implemented in the **application layer**, not through managed provider auth services.

See:
- `context.md`
- `provider_migration_diagnosis.md`

## Authentication and Account Data Flow
From `provider_migration_diagnosis.md`:

- **Login path**
  - `src/lib/auth.ts`
  - Uses **NextAuth Credentials**
  - Performs **raw SQL queries against `public.users`**
- **Signup path**
  - `src/app/api/auth/signup/route.ts`
  - Inserts new records into the `users` table
- **Password recovery path**
  - `src/app/api/auth/forgot-password/route.ts`
  - `src/app/api/auth/reset-password/route.ts`
  - Depends on `users.reset_token` and `users.reset_token_expiry`
  - Sends recovery email through `src/lib/email.ts` using **Resend**

Overall flow:
- NextAuth credentials login → raw SQL lookup in `public.users`
- Signup route → insert into `users`
- Forgot-password → write reset token fields
- Reset-password → validate token and update password
- Email delivery → Resend

## Provider Migration Readiness
`provider_migration_diagnosis.md` concludes the application is **largely portable between PostgreSQL providers** because:

- It does **not use Supabase SDK or Supabase auth/storage APIs**
- Core coupling is mostly limited to:
  - `DATABASE_URL` target
  - PostgreSQL schema/data migration
  - leftover environment/config references
  - legacy operational scripts

Primary migration work:
- Update `DATABASE_URL`
- Move schema and data
- Audit remaining Supabase references
- Rotate exposed credentials

## Schema and Portability Characteristics
The current schema is described as relying on standard or commonly supported PostgreSQL features, including:

- `uuid-ossp`
- `JSONB`
- `TEXT[]`
- materialized views
- `plpgsql`
- triggers

Relevant schema file:
- `src/db/migrations/schema.sql`

This means migration friction is expected to be **operational/configurational**, not fundamentally blocked by unusual application-level provider APIs.

## Residual Provider Coupling
Key remaining provider-specific traces identified in `provider_migration_diagnosis.md`:

- A local `.env` still points `DATABASE_URL` to a **Supabase host**
- Legacy backup scripts still reference Supabase:
  - `src/db/backup-supabase.sh`
  - `src/db/backup-supabase.bat`

These are important drill-down points for cleanup during migration.

## Operational Risk Pattern
The main operational risk in this topic is **credential exposure in backup automation**.

From `provider_migration_diagnosis.md`:
- Hardcoded credentials exist in Supabase and Neon backup scripts
- These credentials should be **rotated after migration**
- This risk connects directly to the related topic:
  - `security/operations`

## Key Relationships
- `context.md` defines the topic boundary: database architecture, provider abstraction, auth data access, schema portability, and operational credential risk.
- `provider_migration_diagnosis.md` provides the detailed 2026-03-31 assessment showing:
  - low application-layer provider lock-in
  - custom auth/account flows over direct SQL
  - standard PostgreSQL schema features
  - migration blockers concentrated in config/scripts/secrets rather than product logic

## Drill-down Map
- `context.md` — topic-level overview and relation to `security/operations`
- `provider_migration_diagnosis.md` — concrete diagnosis of migration readiness, auth/storage dependencies, affected files, and secret exposure risks