---
children_hash: d5e5bcfaf35833303e014cd08187cb30fd9dc90dd9ced0ebe127f0ac52a817e6
compression_ratio: 0.783816425120773
condensation_order: 2
covers: [context.md, project/_index.md]
covers_token_total: 828
summary_level: d2
token_count: 649
type: summary
---
# Summary of Knowledge Entries

## Domain: Facts

### Purpose and Scope
- **Purpose**: Provides standalone project facts for quick recall.
- **Scope**: Includes technology choices, environment facts, operational facts, and stable implementation details. Excludes long-form design rationale and user-facing docs.
- **Ownership**: Managed by Peladeiros engineering.
- **Usage**: For high-signal factual recall about the project.

## Project Overview

### Key Concepts
- **Infrastructure and Implementation**: Covers Peladeiros infrastructure, Supabase SDK, authentication, and database configurations.
- **Billing and Stripe Integration**: Details on Stripe v21 migration, subscription architecture, and billing diagnostics.
- **Authentication and Database Portability**: Utilizes NextAuth Credentials, PostgreSQL features, and migration strategies.

### Related Topics
- **Architecture/Database**: Migration diagnosis and database portability.
- **Security/Operations**: Risks related to secret exposure and credential management.

## RLM Curation Workflow

### Workflow Structure
- **Single-Pass Processing**: Focuses on extraction and organization using precomputed recon results.
- **Verification**: Uses result.applied[].filePath for verification, minimizing raw context printing.

### Dependencies
- **Tools**: Employs tools.curation.recon, tools.curation.mapExtract, and tools.curate.
- **Task Constraints**: Emphasizes single-pass mode and verification through applied file paths.

## Peladeiros Billing and Infrastructure Facts

### Billing and Stripe Facts
- **API Changes**: Stripe v21 updates, method renames, and field relocations.
- **Subscription Architecture**: Supports multi-plan with optional planId and fallback mechanisms.

### Infrastructure Facts
- **Auth and Database**: Custom auth flows with NextAuth and generic PostgreSQL access.
- **Backup and Migration**: Legacy Supabase scripts and migration strategies.

## Project Facts and Documentation

### Project Knowledge
- **Core Stack**: Includes PostgreSQL, Stripe v21, and Resend, focusing on database portability and authentication flows.
- **Documentation Structure**: Organized into domain-specific entries.

### Key Entities and Files
- **Entities**: Subscription plans, group subscriptions, and public.users.
- **Files**: Includes src/db/client.ts, backup scripts, and key API routes.

## Summary

This summary consolidates high-level project facts, RLM curation workflows, and infrastructure details, highlighting key architectural decisions and relationships across billing, authentication, and database management.