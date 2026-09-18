---
confidence: 0.85
sources: [facts/_index.md, security/_index.md]
synthesized_at: '2026-06-22T13:30:59.166Z'
type: synthesis
title: Operational Security in Backup Tooling
summary: Operational security risks in backup scripts require credential rotation.
tags: [backup, credentials, security]
related: []
keywords: [backup, credentials, security, rotation, scripts]
createdAt: '2026-06-22T13:30:59.166Z'
updatedAt: '2026-06-22T13:30:59.166Z'
---

# Operational Security in Backup Tooling

Hardcoded credentials in backup scripts pose a security risk, necessitating rotation and cleanup during provider migration.

## Evidence

- **facts**: Legacy backup scripts with hardcoded credentials are a security risk.
- **security**: Backup scripts contain embedded secrets that must be treated as exposed and rotated.
