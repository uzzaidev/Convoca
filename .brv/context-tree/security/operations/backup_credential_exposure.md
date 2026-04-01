---
title: Backup Credential Exposure
tags: []
related: [architecture/database/provider_migration_diagnosis.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-31T14:56:14.642Z'
updatedAt: '2026-03-31T14:56:14.642Z'
---
## Raw Concept
**Task:**
Document credential exposure risk in backup scripts identified during infrastructure review.

**Changes:**
- Identified hardcoded credentials in database backup scripts
- Linked credential exposure to provider migration and post-migration rotation work

**Files:**
- src/db/backup-supabase.sh
- src/db/backup-supabase.bat

**Flow:**
Infrastructure review -> inspect backup scripts -> detect embedded credentials -> treat as exposure risk -> rotate credentials after migration

**Timestamp:** 2026-03-31

## Narrative
### Structure
Operational backup automation still includes provider-specific scripts with embedded connection credentials. This creates a security concern independent of whether the application runtime itself is portable.

### Dependencies
Risk mitigation depends on identifying every script that embeds credentials, replacing static secrets with environment-based injection or secret management, and rotating affected database users or passwords.

### Highlights
The main security issue is not runtime auth design but exposed secrets in operational tooling. Because the finding spans both Supabase and Neon backup scripts, remediation should be applied across providers rather than only to the currently active environment.

### Rules
Hardcoded credentials in operational scripts must be treated as exposed secrets and rotated after migration or audit discovery.

### Examples
Example exposure locations include provider backup shell and batch scripts under src/db/.

## Facts
- **hardcoded_backup_credentials**: Backup scripts for Supabase and Neon contain hardcoded credentials. [environment]
- **credential_rotation_after_migration**: Credential rotation is recommended after any migration because backup scripts contain exposed secrets. [convention]
