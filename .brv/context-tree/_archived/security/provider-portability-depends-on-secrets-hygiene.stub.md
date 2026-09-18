---
evicted_at: '2026-09-18T10:37:16.489Z'
evicted_importance: 50
original_path: security/provider-portability-depends-on-secrets-hygiene.md
original_token_count: 431
points_to: _archived/security/provider-portability-depends-on-secrets-hygiene.full.md
type: archive_stub
---
The app is designed for PostgreSQL portability, utilizing generic access methods to avoid Supabase-specific APIs. However, migration safety is compromised due to hardcoded backup credentials and residual provider configurations. Key evidence includes the architecture showing that main database connectivity is managed through `src/db/client.ts`, while local `.env` files still reference a Supabase host. Additionally, legacy backup scripts contain hardcoded credentials for Supabase and Neon. Migration primarily involves updating the `DATABASE_URL` and transferring schema/data, but proper secret rotation and cleanup of scripts are essential for secure migration. Security findings highlight the need to rotate affected database users or passwords post-migration or audit.