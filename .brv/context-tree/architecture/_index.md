---
children_hash: ef5841257a709ba1b67188e2bd9a8e7e1b59f3237dc3f9d8469c1c26ce48d49a
compression_ratio: 0.33198789101917253
condensation_order: 2
covers: [billing-system-and-database-portability.md, billing/_index.md, context.md, credential-management-across-domains.md, database/_index.md]
covers_token_total: 1982
summary_level: d2
token_count: 658
type: summary
---
# Structural Summary of Knowledge Entries

## Billing Overview
The billing architecture focuses on the integration and migration of Stripe v21 API, impacting invoice handling and subscription management.

- **Key Changes**:
  - **Invoice API**: Renamed from `invoices.retrieveUpcoming()` to `invoices.createPreview()`.
  - **Subscription Management**: Fields `current_period_start` and `current_period_end` moved to `SubscriptionItem`.
  - **Promotion Codes**: Transitioned from `PromotionCode.coupon` to `PromotionCode.promotion.coupon`.
  - **Invoice Status**: Shifted to using `invoice.status === "paid"`.

- **Related Topics**:
  - **Multi Plan Subscription System**: Detailed in `architecture/billing/multi_plan_subscription_system.md`, covering subscription architecture.
  - **Stripe V21 API Migration**: Documented in `architecture/billing/stripe_v21_api_migration.md`, outlining critical API changes.
  - **Project Facts**: Found in `facts/project/peladeiros_billing_and_stripe_facts.md`, detailing concrete billing facts.

## Billing System and Database Portability
The billing system's architecture must adapt to database portability to mitigate operational risks.

- **Key Points**:
  - Alignment with API changes is crucial for migration readiness.
  - Updating configurations and auditing references are necessary for secure migrations.

## Credential Management Across Domains
Effective credential management is essential during migrations to maintain security.

- **Key Evidence**:
  - Billing changes must align with API shape changes, emphasizing credential management.
  - Hardcoded credentials in backup scripts pose security risks, necessitating rotation during migrations.

## Database Architecture Overview
The database architecture emphasizes provider-specific coupling and migration readiness.

- **Key Concepts**:
  - **Provider Abstraction**: Focus on schema portability and operational credential risks.
  - **Authentication**: Implemented via NextAuth Credentials using raw SQL against `public.users`.

- **Provider Migration Diagnosis**:
  - The application does not utilize Supabase SDK, relying instead on raw SQL for authentication.
  - Migration considerations include updating `DATABASE_URL`, migrating schema/data, and rotating credentials.
  - The application is largely portable across PostgreSQL providers, with migration challenges primarily in configuration and legacy scripts. 

This summary encapsulates the essential changes and architecture of the billing system, database considerations, and credential management, providing a clear pathway for further exploration of detailed entries.