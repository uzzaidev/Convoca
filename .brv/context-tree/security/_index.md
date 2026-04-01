---
children_hash: f536d2620069b0653c78d7bd9c0ece1f41a1e168db0ec1e2150a8adcb0e3737f
compression_ratio: 0.99875
condensation_order: 2
covers: [context.md, operations/_index.md]
covers_token_total: 800
summary_level: d2
token_count: 799
type: summary
---
## context.md
# Domain: security

## Purpose
Contains operational security knowledge, including secret handling, credential exposure, and mitigation actions.

## Scope
Included in this domain:
- Credential management risks
- Secret rotation requirements
- Operational script security
- Exposure remediation notes

Excluded from this domain:
- Feature authorization logic
- User-facing security guidance

## Ownership
Peladeiros engineering

## Usage
Use this domain for security-relevant operational findings and remediation constraints.


## operations/_index.md
---
children_hash: fd96d7a1c739b2a37b9d56fb2bc57c8289ff0496af03e9992a1a0ffaa36a3a49
compression_ratio: 0.9983361064891847
condensation_order: 1
covers: [backup_credential_exposure.md, context.md]
covers_token_total: 601
summary_level: d1
token_count: 600
type: summary
---
## backup_credential_exposure.md
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


## context.md
# Topic: operations

## Overview
Tracks operational security findings related to credentials and scripts used for infrastructure maintenance and migration.

## Key Concepts
- Hardcoded secrets
- Backup scripts
- Credent
[summary compaction; truncated from 800 tokens]