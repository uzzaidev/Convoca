---
confidence: 0.95
sources: [architecture/_index.md, facts/_index.md, security/_index.md]
synthesized_at: '2026-05-16T16:17:58.709Z'
type: synthesis
title: Migration readiness is split between code portability and operational cleanup
summary: Database provider migration looks low-risk in code, but operational leftovers and secret exposure remain the real blockers.
tags: [database, migration, security, ops]
related: []
keywords: [provider-migration, operational-cleanup, schema-portability, credentials, supabase, neon, postgres, lock-in]
createdAt: '2026-05-16T16:17:58.709Z'
updatedAt: '2026-05-16T16:17:58.709Z'
---

# Migration readiness is split between code portability and operational cleanup

The database architecture says provider lock-in is low because the app uses generic PostgreSQL and keeps auth in the application layer. Facts and security add that the remaining work is mostly configuration, schema/data movement, and cleaning up exposed credentials in backup tooling, which makes migration readiness an ops problem more than a code problem.

## Evidence

- **architecture**: Provider migration is mostly operational: update DATABASE_URL, migrate schema/data, audit remaining provider references, and rotate exposed credentials; the core app avoids Supabase-specific application APIs.
- **facts**: Migration between DB providers is mainly DATABASE_URL + schema/data move, with standard PostgreSQL features like uuid-ossp, JSONB, TEXT[], materialized views, plpgsql, and triggers.
- **security**: Operational security notes say embedded credentials in backup scripts are exposed secrets and must be rotated after migration or audit discovery.
