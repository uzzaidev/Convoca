---
children_hash: f5639643390f39dd7110fcc6c4f93c7ae43d2ddcba12b59d7cb24467ad54b478
compression_ratio: 0.24687760199833472
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, security/_index.md]
covers_token_total: 2402
summary_level: d3
token_count: 593
type: summary
---
## Architecture and Database

### Overview
The architecture domain focuses on infrastructure decisions and persistence design, with billing and database topics highlighting implementation constraints and migration boundaries.

### Billing
- **Stripe v21 Compatibility**: Key decisions include using `invoices.createPreview()` and treating `hosted_invoice_url` as nullable.
- **Multi-plan Subscription**: Supports optional `planId` with fallback mechanisms and specific webhook persistence.

#### Drill-down Entries
- **`stripe_v21_api_migration.md`**: Details on SDK upgrade rules.
- **`multi_plan_subscription_system.md`**: Architecture and UI integration.

### Database
- **Provider Abstraction**: Emphasizes PostgreSQL portability and custom SQL-based authentication.
- **Migration Path**: Focuses on `DATABASE_URL` switch and operational cleanup.

#### Drill-down Entries
- **`provider_migration_diagnosis.md`**: Readiness and evidence.
- **`migration-readiness-is-split-between-code-portability-and-operational-cleanup.md`**: Synthesis of readiness and blockers.

## Facts Domain

### Overview
Provides standalone project facts for quick recall, focusing on technology choices and operational facts.

### Key Concepts
- **Infrastructure**: Covers Peladeiros infrastructure and database configurations.
- **Billing and Authentication**: Details on Stripe integration and NextAuth Credentials.

### Related Topics
- **Architecture/Database**: Migration and portability.
- **Security/Operations**: Credential management risks.

## Security Domain

### Overview
Focuses on operational security, credential management, and exposure remediation.

### Key Topics

#### Operational Security in Backup Tooling
- **Risks**: Hardcoded credentials in scripts necessitate rotation and cleanup.

#### Backup Credential Exposure
- **Remediation**: Rotate credentials post-migration and transition to environment-based management.

#### Provider Portability and Secrets Hygiene
- **Migration Safety**: Emphasizes secret hygiene beyond schema changes.

### Relationships
- **Credential Management**: Central to all topics, highlighting the importance of proper secret management.

This summary provides a condensed view of key architectural decisions, security risks, and project facts, focusing on relationships and strategies across billing, authentication, and database management.