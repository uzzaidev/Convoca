---
children_hash: f0a6685bd1f8772d5f026eee4642cd30f5dc029e69dd780dd385a1e9166d192c
compression_ratio: 0.24527509449811002
condensation_order: 1
covers: [context.md, multi_plan_subscription_system.md, stripe_v21_api_migration.md]
covers_token_total: 2381
summary_level: d1
token_count: 584
type: summary
---
# Structural Summary of Billing Knowledge Entries

## Billing Overview
The billing architecture documents critical changes in Stripe v21 API affecting invoice handling, subscription management, and promotion codes. Key concepts include:

- **Invoice Changes**: Renaming of APIs and changes in data access paths.
- **Subscription Management**: Adjustments in subscription period fields and handling of promotion codes.
- **Migration Details**: Documentation of the multi-plan subscription system and its integration with billing.

## Key Concepts
- **Invoice Preview API**: Renamed from `invoices.retrieveUpcoming()` to `invoices.createPreview()`.
- **Subscription Fields**: Relocation of `current_period_start` and `current_period_end` from `Subscription` to `SubscriptionItem`.
- **Promotion Code Structure**: Change from `PromotionCode.coupon` to `PromotionCode.promotion.coupon`.
- **Invoice Status Handling**: Migration from `invoice.paid` to using `invoice.status === "paid"`.

## Related Topics
- **Multi Plan Subscription System**: Detailed in `architecture/billing/multi_plan_subscription_system.md`, documenting the implemented subscription architecture.
- **Stripe V21 API Migration**: Changes affecting billing paths are outlined in `architecture/billing/stripe_v21_api_migration.md`.
- **Project Facts**: Concrete billing facts extracted from implementation notes are found in `facts/project/peladeiros_billing_and_stripe_facts.md`.

## Multi Plan Subscription System
- **Task**: Document the multi-plan subscription system.
- **Changes**: Implementation of `subscription_plans`, admin and public APIs, and UI components for plan selection.
- **Flow**: Describes how plans are defined, exposed, and persisted through webhooks.
- **Dependencies**: Relies on Migration 006 and Stripe pricing structures.

## Stripe V21 API Migration
- **Task**: Document critical changes in the Stripe v21 API.
- **Changes**: Includes renaming methods and adjusting data access paths.
- **Flow**: Steps to upgrade the SDK and ensure compatibility with existing billing logic.
- **Dependencies**: Applies to code paths using Stripe for invoice retrieval and subscription management. 

This summary encapsulates the essential changes and architecture of the billing system, providing a clear pathway for further exploration of detailed entries.