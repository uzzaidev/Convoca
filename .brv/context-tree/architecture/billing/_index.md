---
children_hash: 6e61c0eef5936f2bc5b7eccd3949f41cd1415394316b49775f2ea22bb64c062f
compression_ratio: 0.696078431372549
condensation_order: 1
covers: [context.md, multi_plan_subscription_system.md, stripe_v21_api_migration.md]
covers_token_total: 2346
summary_level: d1
token_count: 1633
type: summary
---
# Billing

## Overview
The `billing` topic captures two connected layers of billing knowledge:

- `stripe_v21_api_migration` documents SDK-level breaking changes required to keep Stripe billing code working after upgrading to `stripe@21.x.x`.
- `multi_plan_subscription_system` documents the application-level subscription architecture built on top of Stripe, including plan modeling, checkout integration, webhook persistence, and UI/admin surfaces.

This topic is explicitly related to:
- `architecture/billing/multi_plan_subscription_system`
- `facts/project` for implementation-level billing and infrastructure facts

## Structural Map

### 1) Stripe compatibility layer
Drill down: `stripe_v21_api_migration`

This entry defines the migration rules for billing code paths that touch invoices, subscriptions, promotion codes, and TypeScript typings.

Key API changes:
- `invoices.retrieveUpcoming()` → `invoices.createPreview()`
- Subscription period fields moved from `Subscription` to `subscription.items.data[0]`
  - `current_period_start`
  - `current_period_end`
- Invoice subscription reference moved:
  - old: `Invoice.subscription`
  - new: `Invoice.parent.subscription_details.subscription`
- Promotion code coupon access moved:
  - old: `PromotionCode.coupon`
  - new: `PromotionCode.promotion.coupon`
- `invoice.paid` removed; paid detection now uses:
  - `invoice.status === "paid"`
- `hosted_invoice_url` must be treated as nullable/optional
- `Invoice.status` is now a typed status enum, not a plain string

Preserved rule pattern:
- `^paid$` for expected invoice status matching

Impact areas:
- invoice preview generation
- subscription lifecycle display
- promotion code lookup
- invoice status checks
- nullability and enum-safe TypeScript handling

## 2) Multi-plan subscription architecture
Drill down: `multi_plan_subscription_system`

This entry describes the product billing architecture that adds configurable subscription plans and threads plan selection through backend flows, persistence, and UI.

Core architectural decision:
- Introduce a dedicated `subscription_plans` model via Migration `006`
- Store both `plan_id` and `stripe_price_id` in `group_subscriptions`
- Keep `planId` optional in checkout and group creation
- Use a fallback `STRIPE_PRICE_ID` when no valid plan is resolved

Primary flow:
- admin defines plans
- public API exposes active plans
- checkout/group creation optionally accepts `planId`
- backend resolves `stripe_price_id` and `trial_days`
- Stripe webhook persists plan metadata into `group_subscriptions`
- billing tab reflects subscription state

## Main backend surfaces

### Admin plan management
Referenced in `multi_plan_subscription_system`:
- `api/admin/plans/route.ts`
- `api/admin/plans/[planId]/route.ts`

Purpose:
- CRUD/admin management of subscription plans

### Public plan discovery
Referenced in `multi_plan_subscription_system`:
- `api/plans/route.ts`

Purpose:
- expose active plans for checkout selection

### Checkout and group creation integration
Referenced in `multi_plan_subscription_system`:
- `api/stripe/checkout/route.ts`
- `api/groups/route.ts`

Behavior:
- both accept optional `planId`
- when present, lookup resolves:
  - `stripe_price_id`
  - `trial_days`
- if absent or invalid, fallback to `STRIPE_PRICE_ID`

### Billing management API
Referenced in `multi_plan_subscription_system`:
- `api/groups/[groupId]/billing/route.ts`

Purpose:
- billing info retrieval
- cancel/reactivate behavior

## Persistence and webhook behavior
Drill down: `multi_plan_subscription_system`

Database/persistence pattern:
- Migration `006` creates `subscription_plans`
- Migration `006` also adds:
  - `plan_id`
  - `stripe_price_id`
  to `group_subscriptions`

Webhook responsibility:
- Stripe webhook writes selected plan metadata back to `group_subscriptions`

This creates a consistent linkage between:
- admin-defined plan catalog
- checkout selection
- Stripe subscription price
- persisted group subscription state

## UI structure
Drill down: `multi_plan_subscription_system`

Billing-related UI components:
- `components/groups/plan-selector.tsx`
  - used in create-group and payment flows
- `components/groups/group-billing-tab.tsx`
  - billing tab in group settings
- `components/admin/admin-plans-tab.tsx`
  - admin dashboard plans tab

UI relationship pattern:
- plan selector supports subscription choice before checkout
- group billing tab reflects current subscription lifecycle/state
- admin plans tab manages the available plan catalog

## Billing rules and decisions

### Stripe migration rules
From `stripe_v21_api_migration`:
1. Use `invoices.createPreview()`
2. Read subscription period fields from `subscription.items.data[0]`
3. Access subscription via `Invoice.parent.subscription_details.subscription`
4. Access coupon via `PromotionCode.promotion.coupon`
5. Replace `invoice.paid` with `invoice.status === "paid"`
6. Normalize `hosted_invoice_url` with `?? null`
7. Cast `Invoice.status` when string semantics are required

### Subscription-system rules
From `multi_plan_subscription_system`:
1. `planId` is optional in checkout and group creation
2. `planId` drives lookup of `stripe_price_id` and `trial_days`
3. fallback is `STRIPE_PRICE_ID`
4. webhook persists `plan_id` and `stripe_price_id`
5. cancellation uses `cancel_at_period_end: true`
6. installments (`parcelamento`) are not modeled as Stripe subscriptions; they require one-time payments

## Important billing facts

### Plan modeling
From `multi_plan_subscription_system`:
- semestral plan is modeled as:
  - interval: `month`
  - `interval_count: 6`
- charge occurs once every 6 months, not as installments

### Cancellation policy
From `multi_plan_subscription_system`:
- cancellations set `cancel_at_period_end: true`
- access remains active through the paid period

### Installment limitation
From `multi_plan_subscription_system`:
- Stripe subscriptions do not support installment-style parcelamento
- installment flows must use one-time payments

## Cross-entry relationship
The two child entries form a layered model:

- `stripe_v21_api_migration` defines how Stripe objects and methods must be accessed safely after the v21 upgrade.
- `multi_plan_subscription_system` defines the app’s subscription-plan architecture that depends on those Stripe billing primitives.

In practice:
- the multi-plan system relies on correct Stripe invoice/subscription handling
- the Stripe migration ensures the higher-level billing flows remain compatible and type-safe