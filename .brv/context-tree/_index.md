---
children_hash: 7db1865bdc05df642e3e4b361ace2ebf994a4bf8c90ddf25d0284833ddcc49a5
compression_ratio: 0.9996878901373284
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, security/_index.md]
covers_token_total: 3204
summary_level: d3
token_count: 3203
type: summary
---
## architecture/_index.md
---
children_hash: 6ec32b6b9ed17b99ddddb9cfd9984c9aa48ee8f98dd6604aa0ab12133a19c411
compression_ratio: 0.9991896272285251
condensation_order: 2
covers: [context.md, database/_index.md]
covers_token_total: 1234
summary_level: d2
token_count: 1233
type: summary
---
## context.md
# Domain: architecture

## Purpose
Contains knowledge about application architecture with emphasis on infrastructure, runtime layers, and persistence design.

## Scope
Included in this domain:
- Database client design
- Provider migration constraints
- Authentication architecture
- Infrastructure risks and operational scripts

Excluded from this domain:
- Feature-level product behavior
- General user documentation

## Ownership
Peladeiros engineering

## Usage
Use this domain for architecture and infrastructure decisions that affect implementation or operations.


## database/_index.md
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
- `provider_migration_diagnosis.md` — concrete diagnosis of
[summary compaction; truncated from 1234 tokens]

## facts/_index.md
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

## security/_index.md
---
children_hash: f536d2620069b0653c78d7bd9c0ece1f41a1e168db0ec1e2150a8adcb0e3737f
compression_ratio: 0.99875
condensation_order: 2
covers: [context.md, operations/_index.md]
covers_token_total: 800
summary_level: d2
token_count: 799
type: summary
---
## context.md
# Domain: security

## Purpose
Contains operational security knowledge, including secret handling, credential exposure, and mitigation actions.

## Scope
Included in this domain:
- Credential management risks
- Secret rotation requirements
- Operational script security
- Exposure remediation notes

Excluded from this domain:
- Feature authorization logic
- User-facing security guidance

## Ownership
Peladeiros engineering

## Usage
Use this domain for security-relevant operational findings and remediation constraints.


## operations/_index.md
---
children_hash: fd96d7a1c739b2a37b9d56fb2bc57c8289ff0496af03e9992a1a0ffaa36a3a49
compression_ratio: 0.9983361064891847
condensation_order: 1
covers: [backup_credential_exposure.md, context.md]
covers_token_total: 601
summary_level: d1
token_count: 600
type: summary
---
## backup_credential_exposure.md
---
title: Backup Credential Exposure
tags: []
related: [architecture/database/provider_migration_diagnosis.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-31T14:56:14.642Z'
updatedAt: '2026-03-31T14:56:14.642Z'
---
## Raw Concept
**Task:**
Document credential exposure risk in backup scripts identified during infrastructure review.

**Changes:**
- Identified hardcoded credentials in database backup scripts
- Linked credential exposure to provider migration and post-migration rotation work

**Files:**
- src/db/backup-supabase.sh
- src/db/backup-supabase.bat

**Flow:**
Infrastructure review -> inspect backup scripts -> detect embedded credentials -> treat as exposure risk -> rotate credentials after migration

**Timestamp:** 2026-03-31

## Narrative
### Structure
Operational backup automation still includes provider-specific scripts with embedded connection credentials. This creates a security concern independent of whether the application runtime itself is portable.

### Dependencies
Risk mitigation depends on identifying every script that embeds credentials, replacing static secrets with environment-based injection or secret management, and rotating affected database users or passwords.

### Highlights
The main security issue is not runtime auth design but exposed secrets in operational tooling. Because the finding spans both Supabase and Neon backup scripts, remediation should be applied across providers rather than only to the currently active environment.

### Rules
Hardcoded credentials in operational scripts must be treated as exposed secrets and rotated after migration or audit discovery.

### Examples
Example exposure locations include provider backup shell and batch scripts under src/db/.

## Facts
- **hardcoded_backup_credentials**: Backup scripts for Supabase and Neon contain hardcoded credentials. [environment]
- **credential_rotation_after_migration**: Credential rotation is recommended after any migration because backup scripts contain exposed secrets. [convention]


## context.md
# Topic: operations

## Overview
Tracks operational security findings related to credentials and scripts used for infrastructure maintenance and mig
[summary compaction; truncated from 3204 tokens]