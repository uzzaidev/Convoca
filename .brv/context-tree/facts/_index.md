---
children_hash: d54bfa6b6fe90192e311cc72094c7d33d73ae513fcda683eca16e2119e0678af
compression_ratio: 0.7797695262483995
condensation_order: 2
covers: [context.md, project/_index.md]
covers_token_total: 781
summary_level: d2
token_count: 609
type: summary
---
# Project Knowledge Summary

## Overview
The project knowledge captures key facts about the Peladeiros infrastructure, billing, authentication, and database management, providing a structured reference for implementation choices and architectural decisions.

## Domain: Facts
- **Purpose**: Contains standalone project facts for easy recall.
- **Scope**:
  - **Included**: Technology choices, environment facts, operational facts, stable implementation details.
  - **Excluded**: Long-form design rationale, user-facing docs.
- **Ownership**: Peladeiros engineering.
- **Usage**: High-signal factual recall about the project.

## Key Concepts
- **Infrastructure and Implementation**:
  - **supabase_sdk_usage**: No Supabase SDK used for auth/storage.
  - **auth_implementation**: Utilizes NextAuth Credentials with raw SQL queries.
  - **signup_flow**: User creation via API routes.
  - **password_recovery**: Managed through token-based email recovery.
  - **database_client**: Generic PostgreSQL library for database access.
  - **provider_migration**: Simplified by changing DATABASE_URL.
  - **postgres_features**: Utilizes standard PostgreSQL features.
  - **legacy_backup_scripts**: Existing scripts contain hardcoded credentials needing rotation.

## Related Topics
- **Architecture**:
  - **database**: Migration diagnosis and provider migration strategies.
  - **security**: Risks related to credential exposure in backup scripts.

## Curation Workflow
- **RLM Approach**: Consolidates workflow requirements for context extraction and verification, emphasizing single-pass execution and deduplication.

## Billing and Stripe Integration
- **Peladeiros Billing Facts**: Key facts about Stripe integration and billing architecture, documenting API changes and subscription management strategies.

## Infrastructure Facts
- **Assessment Date**: 2026-03-31.
- **Key Findings**: No reliance on Supabase SDK, custom authentication flows, and exposed credentials in backup tooling.

## Project Facts
- **Snapshot Date**: 2026-05-16.
- **Core Stack**: PostgreSQL with a focus on portability, multi-plan billing architecture, and organized documentation structure.

## Highlights
- Emphasizes a modular architecture with a focus on security, billing flexibility, and robust authentication mechanisms.
- Key entities include subscription plans, user management, and billing APIs, ensuring comprehensive coverage of project requirements.