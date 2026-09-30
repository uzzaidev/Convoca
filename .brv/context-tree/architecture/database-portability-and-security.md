---
confidence: 0.85
sources: [architecture/_index.md, security/_index.md]
synthesized_at: '2026-09-30T17:18:15.593Z'
type: synthesis
title: Database Portability and Security
summary: Both architecture and security domains discuss the importance of database portability and secret hygiene during migrations.
tags: [database, portability, security]
related: []
keywords: [database, portability, secrets, migration, security]
createdAt: '2026-09-30T17:18:15.593Z'
updatedAt: '2026-09-30T17:18:15.593Z'
---

# Database Portability and Security

Maintaining database portability requires attention to secret hygiene to avoid security risks during migrations.

## Evidence

- **architecture**: The application is largely portable across PostgreSQL providers, with migration challenges primarily in configuration and legacy scripts.
- **security**: Cleaning up hardcoded secrets is crucial for secure database migrations.
