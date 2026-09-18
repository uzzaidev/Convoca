---
confidence: 0.9
sources: [architecture/_index.md, security/_index.md]
synthesized_at: '2026-09-18T10:37:03.546Z'
type: synthesis
title: Credential Management Across Domains
summary: Effective credential management is critical for maintaining security during migrations.
tags: [security, migration, credential-management]
related: []
keywords: [credential, migration, security, backup, api]
createdAt: '2026-09-18T10:37:03.546Z'
updatedAt: '2026-09-18T10:37:03.546Z'
---

# Credential Management Across Domains

Both architecture and security domains emphasize the importance of managing credentials to avoid security risks, especially during provider migrations.

## Evidence

- **architecture**: Billing changes must align with API shape changes, which includes credential management in migration readiness.
- **security**: Hardcoded credentials in backup scripts pose security risks, requiring credential rotation during migrations.
