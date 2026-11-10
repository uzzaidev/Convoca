---
children_hash: d7c9412fa2ca1ab7e014c7e0b9293dcede0d39f72edb2b98a92c9f60e0fb4f32
compression_ratio: 0.32744453574363186
condensation_order: 2
covers: [billing-system-and-database-portability.md, billing/_index.md, context.md, credential-management-across-domains.md, database-portability-and-secret-hygiene.md, database-portability-and-security.md, database/_index.md]
covers_token_total: 2434
summary_level: d2
token_count: 797
type: summary
---
# Structural Summary of Knowledge Entries

## Billing Overview
The billing architecture outlines significant changes in the Stripe v21 API, focusing on invoice handling, subscription management, and promotion codes.

- **Invoice Changes**: API renaming and altered data access paths.
- **Subscription Management**: Adjustments in subscription period fields and promotion code handling.
- **Migration Details**: Documentation of the multi-plan subscription system and its integration with billing.

### Key Concepts
- **Invoice Preview API**: Renamed from `invoices.retrieveUpcoming()` to `invoices.createPreview()`.
- **Subscription Fields**: `current_period_start` and `current_period_end` moved to `SubscriptionItem`.
- **Promotion Code Structure**: Transition from `PromotionCode.coupon` to `PromotionCode.promotion.coupon`.
- **Invoice Status Handling**: Shift from `invoice.paid` to `invoice.status === "paid"`.

### Related Topics
- **Multi Plan Subscription System**: Detailed in `architecture/billing/multi_plan_subscription_system.md`, covering subscription architecture.
- **Stripe V21 API Migration**: Changes affecting billing paths outlined in `architecture/billing/stripe_v21_api_migration.md`.
- **Project Facts**: Extracted billing facts in `facts/project/peladeiros_billing_and_stripe_facts.md`.

## Database Architecture Overview
The database architecture emphasizes provider-specific coupling, migration readiness, and operational risks.

### Key Concepts
- **Provider Migration Diagnosis**: 
  - The application does not use Supabase SDK or storage APIs.
  - Authentication via NextAuth Credentials with raw SQL against `public.users`.
  - Password reset functionality relies on `users.reset_token` fields.
  - Local configurations reference Supabase, posing security risks.

### Migration Considerations
- Updating `DATABASE_URL`, migrating schema/data, auditing references, and rotating credentials are essential for provider migration.
- The application is largely portable across PostgreSQL providers, with migration challenges primarily in environment configuration and legacy scripts.

## Credential Management Across Domains
Effective credential management is crucial for maintaining security during migrations.

### Key Evidence
- **Architecture**: Billing changes must align with API shape changes, including credential management.
- **Security**: Hardcoded credentials in backup scripts pose risks, necessitating rotation during migrations.

## Database Portability and Secret Hygiene
Maintaining database portability requires effective secret hygiene during migrations.

### Key Evidence
- **Architecture**: Cleaning hardcoded secrets is vital for secure migrations.
- **Security**: Emphasizes the importance of secret hygiene to avoid risks during database migrations.

## Database Portability and Security
Both architecture and security domains stress the significance of database portability and secret hygiene during migrations.

### Key Evidence
- The application is generally portable across PostgreSQL providers, with migration challenges in configuration and legacy scripts.
- Cleaning hardcoded secrets is essential for secure database migrations.