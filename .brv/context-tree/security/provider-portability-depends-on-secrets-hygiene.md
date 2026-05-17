---
confidence: 0.98
sources: [architecture/_index.md, facts/_index.md, security/_index.md]
synthesized_at: '2026-05-16T16:17:58.683Z'
type: synthesis
title: Provider portability depends on secrets hygiene
summary: The app is PostgreSQL-portable, but migration safety is limited by hardcoded backup credentials and residual provider config.
tags: [database, security, migration, credentials]
related: []
keywords: [postgresql, portability, supabase, neon, backup-scripts, credential-rotation, database-url, migration-risk]
createdAt: '2026-05-16T16:17:58.683Z'
updatedAt: '2026-05-16T16:17:58.683Z'
---

# Provider portability depends on secrets hygiene

Architecture and facts both show the runtime avoids Supabase-specific APIs and uses generic PostgreSQL access, yet security findings flag backup scripts and local config that still embed provider credentials. This means provider migration is mostly operational, but secret rotation and script cleanup are part of the same migration story.

## Evidence

- **architecture**: Main DB connectivity goes through src/db/client.ts, the app is largely portable across PostgreSQL providers, and residual coupling includes local .env still pointing DATABASE_URL to a Supabase host plus legacy backup scripts with hardcoded credentials.
- **facts**: Migration between DB providers is mainly DATABASE_URL + schema/data move, but local .env still references a Supabase host and legacy backup scripts contain hardcoded Supabase/Neon credentials.
- **security**: Backup Credential Exposure documents hardcoded credentials in src/db/backup-supabase.sh and src/db/backup-supabase.bat and says affected database users or passwords should be rotated after migration or audit discovery.
