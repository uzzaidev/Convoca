---
children_hash: e612f2c887d2783295123de603800abd0a2d5f11f347b981e7052042a2e0f83b
compression_ratio: 0.2976605276256844
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, security/_index.md]
covers_token_total: 2009
summary_level: d3
token_count: 598
type: summary
---
# Structural Summary of Knowledge Entries

## Architecture Overview
The architecture focuses on billing integration and database portability, emphasizing security and migration readiness.

### Billing System
- **Key Changes**:
  - **Invoice API**: Transitioned from `invoices.retrieveUpcoming()` to `invoices.createPreview()`.
  - **Subscription Management**: Fields `current_period_start` and `current_period_end` moved to `SubscriptionItem`.
  - **Promotion Codes**: Updated from `PromotionCode.coupon` to `PromotionCode.promotion.coupon`.

- **Related Topics**:
  - **Multi Plan Subscription System**: Detailed in `architecture/billing/multi_plan_subscription_system.md`.
  - **Stripe V21 API Migration**: Documented in `architecture/billing/stripe_v21_api_migration.md`.

### Database Architecture
- **Key Concepts**:
  - **Provider Abstraction**: Focus on schema portability and credential risks.
  - **Authentication**: Implemented via NextAuth Credentials using raw SQL against `public.users`.

- **Migration Considerations**:
  - Update `DATABASE_URL` and migrate schema/data.
  - Challenges primarily in configuration and legacy scripts.

## Project Knowledge Summary
The project knowledge captures essential facts about Peladeiros infrastructure, billing, authentication, and database management.

### Domain: Facts
- **Purpose**: Standalone project facts for easy recall.
- **Scope**: Includes technology choices, operational facts, and implementation details.

### Key Concepts
- **Infrastructure**:
  - No Supabase SDK used; authentication via NextAuth with raw SQL.
  - User creation and password recovery managed through API routes.

### Related Topics
- **Security**: Risks related to credential exposure in backup scripts.

## Security Overview
The security domain focuses on credential management and exposure mitigation.

### Key Points
- Effective credential management is crucial during migrations.
- Hardcoded credentials in backup scripts pose significant security risks.

### Operations Overview
- **Focus**: Tracks operational security findings related to credentials and scripts.
- **Backup Credential Exposure**: Identified risks linked to hardcoded credentials and migration processes.

This summary encapsulates the critical architectural decisions, security considerations, and project facts, providing a clear pathway for further exploration of detailed entries.