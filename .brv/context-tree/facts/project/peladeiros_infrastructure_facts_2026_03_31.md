---
title: Peladeiros Infrastructure Facts 2026 03 31
tags: []
related: [architecture/database/provider_migration_diagnosis.md, security/operations/backup_credential_exposure.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-31T14:56:14.647Z'
updatedAt: '2026-03-31T14:56:14.647Z'
---
## Raw Concept
**Task:**
Record factual statements from the Peladeiros infrastructure diagnosis on 2026-03-31.

**Changes:**
- Added factual recall entry for infrastructure, auth, database portability, and credential exposure

**Files:**
- src/lib/auth.ts
- src/app/api/auth/signup/route.ts
- src/app/api/auth/forgot-password/route.ts
- src/app/api/auth/reset-password/route.ts
- src/lib/email.ts
- src/db/client.ts
- src/db/migrations/schema.sql
- src/db/backup-supabase.sh
- src/db/backup-supabase.bat

**Flow:**
Infrastructure diagnosis -> extract factual statements -> deduplicate -> group by subject -> store for recall

**Timestamp:** 2026-03-31

## Narrative
### Structure
This entry stores concise facts derived from a single infrastructure assessment of the Peladeiros project. It complements the broader architecture and security topics with direct fact retrieval value.

### Dependencies
Facts depend on the referenced auth, database, email, schema, and backup script files remaining representative of the system state captured on 2026-03-31.

### Highlights
The highest-value facts are the absence of Supabase SDK coupling in runtime auth/storage, the use of generic postgres access, the reliance on custom auth flows, and the presence of exposed credentials in backup tooling.

## Facts
- **supabase_sdk_usage**: The app does not use Supabase SDK or API for auth or storage. [project]
- **auth_implementation**: Authentication uses NextAuth Credentials and queries public.users with raw SQL in src/lib/auth.ts. [project]
- **signup_flow**: Signup creates users in the users table via src/app/api/auth/signup/route.ts. [project]
- **password_recovery**: Password recovery uses reset_token and reset_token_expiry columns on users and sends email via Resend. [project]
- **database_client**: Database access uses the generic postgres library in src/db/client.ts. [project]
- **provider_migration**: Migrating between providers is mainly changing DATABASE_URL and moving schema and data. [project]
- **postgres_features**: The schema uses standard PostgreSQL features including uuid-ossp, JSONB, TEXT[], materialized view, plpgsql, and triggers. [project]
- **database_url_host**: A local .env still points DATABASE_URL to a Supabase host. [environment]
- **legacy_backup_scripts**: Legacy Supabase backup scripts remain in src/db/backup-supabase.sh and src/db/backup-supabase.bat. [project]
- **hardcoded_backup_credentials**: Hardcoded credentials exist in backup scripts for Supabase and Neon and should be rotated after migration. [environment]
