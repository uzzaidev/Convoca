---
children_hash: 666ce561d72573996335edc86a76a5bf3138acf80c4c3b831316f6d716d3c5ed
compression_ratio: 0.1269948302989436
condensation_order: 1
covers: [context.md, curate_workflow_rlm_approach.md, peladeiros_billing_and_stripe_facts.md, peladeiros_infrastructure_facts_2026_03_31.md, project_facts.md]
covers_token_total: 4449
summary_level: d1
token_count: 565
type: summary
---
# Project Knowledge Summary

## Overview
The project knowledge captures key facts about the Peladeiros infrastructure, billing, authentication, and database management, providing a structured reference for implementation choices and architectural decisions.

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
  - **database**: Detailed migration diagnosis and provider migration strategies.
  - **security**: Risks related to credential exposure in backup scripts.

## Curation Workflow
- **RLM Approach**: 
  - Consolidates workflow requirements for context extraction and verification.
  - Emphasizes single-pass execution for small contexts.
  - Highlights the importance of deduplication and organization of extracted facts.

## Billing and Stripe Integration
- **Peladeiros Billing Facts**:
  - Captures key facts about Stripe integration and billing architecture.
  - Documents API changes and subscription management strategies.

## Infrastructure Facts
- **Assessment Date**: 2026-03-31.
- **Key Findings**: 
  - No reliance on Supabase SDK.
  - Custom authentication flows and exposed credentials in backup tooling.

## Project Facts
- **Snapshot Date**: 2026-05-16.
- **Core Stack**: 
  - PostgreSQL with a focus on portability.
  - Multi-plan billing architecture with fallback mechanisms.
  - Organized documentation structure across various domains.

## Highlights
- The project emphasizes a modular architecture with a focus on security, billing flexibility, and robust authentication mechanisms.
- Key entities include subscription plans, user management, and billing APIs, ensuring comprehensive coverage of project requirements.