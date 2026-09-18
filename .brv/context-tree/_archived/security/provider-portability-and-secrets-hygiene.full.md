---
confidence: 0.9
sources: [architecture/_index.md, security/_index.md]
synthesized_at: '2026-06-22T13:30:59.158Z'
type: synthesis
title: Provider Portability and Secrets Hygiene
summary: Provider portability is linked to secret hygiene and operational security.
tags: [migration, security, credentials]
related: []
keywords: [portability, secrets, backup, migration, security]
createdAt: '2026-06-22T13:30:59.158Z'
updatedAt: '2026-06-22T13:30:59.158Z'
---

# Provider Portability and Secrets Hygiene

Provider portability is not solely about schema/data migration but also involves maintaining secret hygiene, especially in backup scripts.

## Evidence

- **architecture**: The main migration path involves a DATABASE_URL switch and cleanup of exposed secrets.
- **security**: Backup scripts contain hardcoded secrets that must be rotated to ensure security during provider migration.
