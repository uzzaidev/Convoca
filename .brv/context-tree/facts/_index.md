---
children_hash: 38be45da6d61807461434a671f638b4c4714bf4294f7956234807d5e87b7f116
compression_ratio: 0.9989764585465711
condensation_order: 2
covers: [context.md, project/_index.md]
covers_token_total: 977
summary_level: d2
token_count: 976
type: summary
---
## context.md
# Domain: facts

## Purpose
Contains standalone project facts that should be easy to recall without reading broader architecture narratives.

## Scope
Included in this domain:
- Technology choices
- Environment facts
- Operational facts
- Stable implementation details

Excluded from this domain:
- Long-form design rationale
- User-facing docs

## Ownership
Peladeiros engineering

## Usage
Use this domain for high-signal factual recall about the project.


## project/_index.md
---
children_hash: 4f1ca239752be8443a2c5ed55646c70a9a7f242cc5808b075a3c88c7b4126c24
compression_ratio: 0.9427207637231504
condensation_order: 1
covers: [context.md, peladeiros_infrastructure_facts_2026_03_31.md]
covers_token_total: 838
summary_level: d1
token_count: 790
type: summary
---
# project

## Structural Overview
This topic captures point-in-time infrastructure facts for Peladeiros as of 2026-03-31, focused on auth implementation, database portability, and operational risk. It serves as a factual recall layer, with drill-down into `peladeiros_infrastructure_facts_2026_03_31.md` for the detailed statements and links outward to `architecture/database/provider_migration_diagnosis.md` and `security/operations/backup_credential_exposure.md`.

## Scope and Relationships
- **Parent entry:** `context.md`
- **Primary fact entry:** `peladeiros_infrastructure_facts_2026_03_31.md`
- **Related topics:**
  - `architecture/database/provider_migration_diagnosis.md` — provider migration mechanics and database portability
  - `security/operations/backup_credential_exposure.md` — credential exposure in legacy backup tooling

## Core Architectural Facts
From `peladeiros_infrastructure_facts_2026_03_31.md`:

- **No Supabase runtime coupling**
  - The app does **not** use the Supabase SDK or Supabase APIs for auth or storage.
  - This supports the portability conclusion that infrastructure is largely standard PostgreSQL-based rather than vendor-locked.

- **Custom auth implementation**
  - Auth uses **NextAuth Credentials**.
  - `src/lib/auth.ts` authenticates against `public.users` via **raw SQL**.
  - Signup is implemented in `src/app/api/auth/signup/route.ts`, which creates users in the `users` table.
  - Password recovery is custom:
    - `src/app/api/auth/forgot-password/route.ts`
    - `src/app/api/auth/reset-password/route.ts`
    - uses `reset_token` and `reset_token_expiry` columns
    - sends email through `src/lib/email.ts` / Resend

- **Database access and portability**
  - Database access uses the generic **postgres** client in `src/db/client.ts`.
  - Migration between providers is primarily:
    - changing `DATABASE_URL`
    - moving schema
    - moving data
  - Schema in `src/db/migrations/schema.sql` relies on standard PostgreSQL capabilities:
    - `uuid-ossp`
    - `JSONB`
    - `TEXT[]`
    - materialized views
    - `plpgsql`
    - triggers

## Operational and Environment Facts
- A local `.env` still points `DATABASE_URL` to a **Supabase host**.
- Legacy backup scripts remain:
  - `src/db/backup-supabase.sh`
  - `src/db/backup-supabase.bat`
- These scripts contain **hardcoded credentials** for Supabase and Neon, creating an operational security issue that should be handled via rotation after migration.

## Key Patterns
- **Architecture pattern:** custom application-layer auth over direct PostgreSQL access, not managed Supabase auth
- **Portability pattern:** standard PostgreSQL schema + generic client minimizes provider lock-in
- **Risk pattern:** operational remnants from prior provider setups persist in backup scripts and environment configuration

## Drill-Down Guide
- Read `peladeiros_infrastructure_facts_2026_03_31.md` for the complete fact list and source file mapping.
- Read `architecture/database/provider_migration_diagnosis.md` for migration implications.
- Read `security/operations/bac
[summary compaction; truncated from 977 tokens]