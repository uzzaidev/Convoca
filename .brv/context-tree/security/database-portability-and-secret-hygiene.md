---
confidence: 0.85
sources: [architecture/_index.md, security/_index.md]
synthesized_at: '2026-09-18T10:37:03.555Z'
type: synthesis
title: Database Portability and Secret Hygiene
summary: Maintaining database portability requires attention to secret hygiene during migrations.
tags: [database, migration, security]
related: []
keywords: [database, portability, secrets, migration, hygiene]
createdAt: '2026-09-18T10:37:03.555Z'
updatedAt: '2026-09-18T10:37:03.555Z'
---

# Database Portability and Secret Hygiene

Both architecture and security domains highlight the need for cleaning up hardcoded secrets to ensure secure database migrations.

## Evidence

- **architecture**: Operational credential risks are a separate concern linked to security operations.
- **security**: Migration paths require cleanup of exposed secrets and hardcoded secrets in backup scripts must be rotated.
