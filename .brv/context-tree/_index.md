---
children_hash: 57e25760ced361e0065b3cb20e810fbb9010a5cb54a2fd4836b7b07813ed9139
compression_ratio: 0.32147937411095306
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, security/_index.md]
covers_token_total: 2109
summary_level: d3
token_count: 678
type: summary
---
# Structural Summary

## Architecture

### Billing
- **Focus**: Integration with Stripe v21 and multi-plan subscription architecture.
- **Core Structure**:
  - **`context.md`**: Overview of billing impacts from Stripe v21.
  - **`stripe_v21_api_migration.md`**: Migration details and compatibility rules.
  - **`multi_plan_subscription_system.md`**: Architecture for multi-plan billing.
- **Key Relationships**:
  - **Layers**: Migration Layer (invoice handling) and Subscription Architecture (webhook persistence).
  - **Dependencies**: Stripe pricing, Migration 006.
- **Important Rules**: Use `invoices.createPreview()`; handle `planId` as optional.

### Database
- **Focus**: Provider abstraction and schema portability.
- **Overview**: Mostly provider-portable with PostgreSQL access; migration involves switching `DATABASE_URL`.
- **Child Entries**:
  - **`provider_migration_diagnosis.md`**: Assesses migration readiness.
  - **`migration-readiness-is-split-between-code-portability-and-operational-cleanup.md`**: Identifies operational cleanup as a limiting factor.
- **Key Relationships**: Minimizes code-level lock-in; SQL-based authentication enhances portability.

## Facts

### Domain Overview
- **Purpose**: Provides standalone project facts for quick recall.
- **Scope**: Includes technology choices and operational facts; excludes long-form design rationale.
- **Ownership**: Managed by Peladeiros engineering.

### Key Concepts
- **Infrastructure**: Covers Peladeiros infrastructure and database configurations.
- **Billing**: Details on Stripe v21 migration and subscription architecture.
- **Authentication**: Utilizes NextAuth and PostgreSQL features.

### Project Facts
- **Core Stack**: PostgreSQL, Stripe v21, focusing on database portability.
- **Key Entities**: Subscription plans and public.users.
- **Files**: Includes src/db/client.ts and key API routes.

## Security

### Domain Overview
- **Purpose**: Focuses on operational security, credential management, and exposure mitigation.
- **Scope**: Includes credential management risks and secret rotation requirements.
- **Ownership**: Managed by Peladeiros engineering.

### Key Entries
- **Credential Management Across Domains**: Highlights risks from hardcoded credentials in backup scripts.
- **Operational Security in Backup Tooling**: Necessitates credential rotation to mitigate risks.
- **Provider Portability and Secrets Hygiene**: Emphasizes maintaining secret hygiene during migrations.

### Conclusion
The architecture emphasizes critical operational practices across billing, database management, and security, highlighting the importance of migration strategies, credential management, and the integration of Stripe v21.