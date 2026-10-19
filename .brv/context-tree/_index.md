---
children_hash: eb6288edcecaa0c3186a9a7ccb6d4033d7e6f6236e84463f251cf11056b053ca
compression_ratio: 0.25510204081632654
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, security/_index.md]
covers_token_total: 2156
summary_level: d3
token_count: 550
type: summary
---
# Structural Summary of Knowledge Entries

## Architecture Overview
The architecture focuses on the billing system and database portability, emphasizing critical changes in the Stripe v21 API.

### Key Concepts
- **Billing System**:
  - **Invoice Changes**: API renaming from `invoices.retrieveUpcoming()` to `invoices.createPreview()`.
  - **Subscription Management**: Fields like `current_period_start` and `current_period_end` shifted to `SubscriptionItem`.
  - **Promotion Code Structure**: Updated from `PromotionCode.coupon` to `PromotionCode.promotion.coupon`.
- **Database Portability**: Emphasizes the need for configurations to align with API changes and manage operational risks.

### Related Topics
- **Multi Plan Subscription System**: Detailed in `architecture/billing/multi_plan_subscription_system.md`.
- **Stripe V21 API Migration**: Changes outlined in `architecture/billing/stripe_v21_api_migration.md`.

## Facts Domain
The facts domain provides a high-level overview of project-specific details and operational facts.

### Key Concepts
- **Project Overview**: Covers technology choices, authentication flows, and database client usage.
- **Key Changes**: Migration facts for Stripe v21, multi-plan subscription architecture, and infrastructure diagnostics.
- **Exportação de PDF Mobile**: Documents solutions for mobile PDF export bugs.

### Related Topics
- **Security Operations**: Addresses credential exposure risks and management.

## Security Overview
The security domain focuses on operational security, particularly credential management and exposure risks.

### Key Concepts
- **Credential Management**: Highlights the importance of rotating hardcoded credentials in backup scripts during migrations.
- **Secret Hygiene**: Emphasizes the need for cleaning up hardcoded secrets to maintain database portability.

### Related Topics
- **Backup Credential Exposure**: Identifies risks associated with hardcoded credentials in backup scripts, advocating for environment-based secret management.

This summary encapsulates the structural relationships and key facts across the architecture, facts, and security domains, providing a cohesive overview for further exploration.