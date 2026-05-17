---
children_hash: 487df67382985447d66b9e477b077c8b15243814b9e49728efde28848332bda0
compression_ratio: 0.39167169583584793
condensation_order: 1
covers: [context.md, migration-readiness-is-split-between-code-portability-and-operational-cleanup.md, provider_migration_diagnosis.md]
covers_token_total: 1657
summary_level: d1
token_count: 649
type: summary
---
## Database

The database domain covers provider abstraction, auth data access, schema portability, and operational credential risk. It frames database provider migration as mostly an operations and configuration problem rather than a core application rewrite, with related security concerns handled in **security/operations**.

### Structural overview

- **Core stance:** The app is largely provider-portable because it uses generic PostgreSQL access and keeps authentication logic at the application layer.
- **Migration shape:** Moving between providers is mainly a `DATABASE_URL` switch plus schema/data migration, followed by cleanup of residual provider references.
- **Main risk area:** Operational leftovers and exposed secrets in backup tooling are the real blockers, not Supabase-specific application dependencies.

### Child entries for drill-down

- **provider_migration_diagnosis.md**
  - Documents the 2026-03-31 diagnosis of provider migration readiness.
  - Confirms auth is implemented with **NextAuth Credentials** and raw SQL against `public.users`, not Supabase SDK auth.
  - Notes password recovery depends on `reset_token` and `reset_token_expiry` fields plus **Resend** email delivery.
  - Identifies remaining Supabase coupling in local config and backup scripts, including hardcoded backup credentials.
  - References key files such as `src/lib/auth.ts`, `src/app/api/auth/signup/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/lib/email.ts`, `src/db/client.ts`, and `src/db/backup-supabase.sh/.bat`.

- **migration-readiness-is-split-between-code-portability-and-operational-cleanup.md**
  - Synthesizes the migration assessment into a single conclusion: code portability is high, operational cleanup is the limiting factor.
  - Highlights the dependency on standard PostgreSQL features like `uuid-ossp`, `JSONB`, `TEXT[]`, materialized views, `plpgsql`, and triggers.
  - Emphasizes required migration actions: update `DATABASE_URL`, migrate schema/data, audit provider references, and rotate exposed credentials.
  - Connects database readiness to security posture through secret hygiene and backup credential exposure.

### Key relationships

- **Database provider abstraction** reduces lock-in at the code level.
- **Authentication data access** is custom and SQL-based, which supports portability.
- **Schema portability** depends on standard PostgreSQL features rather than provider-specific APIs.
- **Operational credential risk** remains a separate concern and overlaps with security/operations guidance.