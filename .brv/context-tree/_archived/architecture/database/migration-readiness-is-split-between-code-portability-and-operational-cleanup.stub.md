---
evicted_at: '2026-09-18T10:37:21.646Z'
evicted_importance: 50
original_path: architecture/database/migration-readiness-is-split-between-code-portability-and-operational-cleanup.md
original_token_count: 416
points_to: _archived/architecture/database/migration-readiness-is-split-between-code-portability-and-operational-cleanup.full.md
type: archive_stub
---
The migration readiness for database providers is primarily an operational challenge rather than a coding issue. While the architecture indicates low provider lock-in due to the use of generic PostgreSQL and application-layer authentication, the real obstacles lie in operational cleanup. Key tasks include updating the DATABASE_URL, migrating schema and data, auditing remaining provider references, and rotating exposed credentials found in backup tooling. The migration process mainly involves standard PostgreSQL features, with the core application avoiding Supabase-specific APIs. Security concerns highlight the need to address embedded credentials in backup scripts, which are considered exposed secrets that require rotation post-migration.