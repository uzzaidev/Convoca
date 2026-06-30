---
children_hash: defcd1fe31f5929de7c2744fc15dbf0a2bbe9ad4ec242f34421f797cb226fa56
compression_ratio: 0.3032042085126734
condensation_order: 2
covers: [billing-system-and-database-portability.md, billing/_index.md, context.md, database/_index.md]
covers_token_total: 2091
summary_level: d2
token_count: 634
type: summary
---
# Structural Summary

## Billing

The billing domain focuses on the integration with Stripe v21 and the multi-plan subscription system, emphasizing the need for compatibility with Stripe's updated API.

### Core Structure
- **`context.md`**: Overview of billing impacts from Stripe v21, including invoice handling and subscription management.
- **`stripe_v21_api_migration.md`**: Details on the migration to Stripe v21, including compatibility rules and API changes.
- **`multi_plan_subscription_system.md`**: Describes the architecture for multi-plan billing, including plan selection and webhook persistence.

### Key Architectural Relationships
- Two layers:
  1. **Stripe v21 Migration Layer**: Updates invoice and subscription handling.
  2. **Multi-Plan Subscription Architecture**: Introduces `subscription_plans` and webhook-driven persistence.
- Dependencies include Stripe pricing, Migration 006, and webhook synchronization.

### Important Rules and Decisions
- Use `invoices.createPreview()` instead of `invoices.retrieveUpcoming()`.
- Handle `planId` as optional, with fallbacks to `STRIPE_PRICE_ID`.

### Relevant Files and Endpoints
- APIs: `api/admin/plans/route.ts`, `api/stripe/checkout/route.ts`, and others.
- Schema: Migration 006 adds `subscription_plans` and related fields.

## Billing System and Database Portability

The billing system's architecture must adapt to database portability to mitigate operational risks.

### Evidence
- Billing changes must align with API shape changes.
- Migration readiness involves updating configurations, migrating schema/data, and auditing references.

## Database

The database domain addresses provider abstraction, schema portability, and operational credential risks, framing migration as a configuration issue rather than a core rewrite.

### Structural Overview
- The application is mostly provider-portable due to generic PostgreSQL access.
- Migration involves switching `DATABASE_URL` and migrating schema/data.

### Child Entries for Drill-Down
- **`provider_migration_diagnosis.md`**: Assesses migration readiness and identifies remaining dependencies on Supabase.
- **`migration-readiness-is-split-between-code-portability-and-operational-cleanup.md`**: Concludes that operational cleanup is the main limiting factor for migration.

### Key Relationships
- Database provider abstraction minimizes code-level lock-in.
- Authentication access is SQL-based, enhancing portability.
- Operational credential risks are a separate concern linked to security operations.