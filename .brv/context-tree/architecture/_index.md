---
children_hash: 66f90d26e0bd9f6f031483c066907bce8b4514d468b47430de33db4dcc3ef202
compression_ratio: 0.3202170963364993
condensation_order: 2
covers: [billing-system-and-database-portability.md, billing/_index.md, context.md, credential-management-across-domains.md, database-portability-and-security.md, database/_index.md]
covers_token_total: 2211
summary_level: d2
token_count: 708
type: summary
---
# Structural Summary of Knowledge Entries

## Billing Overview
The billing architecture documents critical changes in the Stripe v21 API, impacting invoice handling, subscription management, and promotion codes.

- **Invoice Changes**: API renaming and data access path modifications.
- **Subscription Management**: Adjustments in subscription period fields and promotion code handling.
- **Migration Details**: Implementation of a multi-plan subscription system.

### Key Concepts
- **Invoice Preview API**: Renamed from `invoices.retrieveUpcoming()` to `invoices.createPreview()`.
- **Subscription Fields**: `current_period_start` and `current_period_end` moved from `Subscription` to `SubscriptionItem`.
- **Promotion Code Structure**: Changed from `PromotionCode.coupon` to `PromotionCode.promotion.coupon`.
- **Invoice Status Handling**: Shift from `invoice.paid` to checking `invoice.status === "paid"`.

### Related Topics
- **Multi Plan Subscription System**: Detailed in `architecture/billing/multi_plan_subscription_system.md`.
- **Stripe V21 API Migration**: Changes outlined in `architecture/billing/stripe_v21_api_migration.md`.
- **Project Facts**: Found in `facts/project/peladeiros_billing_and_stripe_facts.md`.

## Billing System and Database Portability
The billing system's architecture must adapt to database portability concerns to mitigate operational risks.

- **Key Evidence**: Billing changes must align with API shape changes; migration readiness involves updating configurations and auditing references.

## Credential Management Across Domains
Effective credential management is critical for maintaining security during migrations.

- **Key Evidence**: Aligning billing changes with API shape changes includes managing credentials; hardcoded credentials in backup scripts pose security risks.

## Database Architecture Overview
Focuses on database architecture, emphasizing provider-specific coupling and migration readiness.

### Key Concepts
- **Database Provider Abstraction**: Ensures flexibility across different database providers.
- **Operational Credential Risk**: Highlights the importance of managing credentials during migrations.

### Provider Migration Diagnosis
- **Key Findings**: The application does not rely on Supabase SDK; authentication is via NextAuth Credentials using raw SQL against `public.users`.
- **Migration Considerations**: Updating `DATABASE_URL`, migrating schema/data, and cleaning up hardcoded credentials are essential.

## Database Portability and Security
Maintaining database portability requires attention to secret hygiene during migrations.

- **Key Evidence**: The application is largely portable across PostgreSQL providers, with migration challenges primarily in configuration and legacy scripts. Cleaning hardcoded secrets is crucial for secure migrations.