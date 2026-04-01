---
title: Provider Migration Diagnosis
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-31T14:56:14.636Z'
updatedAt: '2026-03-31T14:56:14.636Z'
---
## Raw Concept
**Task:**
Document the 2026-03-31 infrastructure diagnosis of Peladeiros focusing on database provider migration readiness and auth/storage dependencies.

**Changes:**
- Confirmed the app does not depend on Supabase SDK or storage APIs for auth or storage
- Identified NextAuth Credentials with raw SQL against public.users as the current authentication implementation
- Confirmed password reset depends on users.reset_token fields and Resend email delivery
- Identified local configuration and backup scripts that still reference Supabase
- Flagged hardcoded backup credentials in Supabase and Neon scripts as a security risk

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
NextAuth credentials login -> raw SQL query to public.users -> signup route inserts into users -> forgot-password writes reset token fields -> reset-password validates token and updates password -> email delivery via Resend

**Timestamp:** 2026-03-31

## Narrative
### Structure
Authentication and account lifecycle logic are implemented at the application layer rather than through Supabase managed auth APIs. Login is handled through NextAuth Credentials backed by direct SQL access to public.users, while signup and password recovery are custom API routes. Database connectivity is abstracted through the generic postgres client, which reduces provider-specific coupling at the application code layer.

### Dependencies
Auth depends on src/lib/auth.ts for credential validation, the users table for identity state, reset_token and reset_token_expiry columns for recovery flows, and Resend-based email sending in src/lib/email.ts. Database portability depends on the DATABASE_URL connection target plus successful migration of PostgreSQL schema objects and application data.

### Highlights
As of 2026-03-31, the application appears largely portable between PostgreSQL providers because it uses generic SQL access instead of Supabase-specific SDK features. The schema relies on PostgreSQL features that are standard or commonly supported, including uuid-ossp, JSONB, TEXT arrays, materialized views, plpgsql, and triggers. Remaining migration friction is concentrated in environment configuration, legacy backup automation, and secret hygiene rather than in core application logic.

### Rules
Any provider migration should include updating DATABASE_URL, migrating schema and data, auditing remaining Supabase references, and rotating any credentials exposed in backup scripts.

### Examples
Example affected files include src/lib/auth.ts for credential lookup, src/app/api/auth/signup/route.ts for account creation, and src/db/client.ts for database connectivity. Example residual provider coupling includes a local DATABASE_URL host still pointing to Supabase and legacy scripts under src/db/backup-supabase.*.

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
