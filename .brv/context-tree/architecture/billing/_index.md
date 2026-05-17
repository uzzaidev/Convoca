---
children_hash: f9a56147ad545abb67efed3ac6ac4e5b84dc639dfd8769bc02aa19f6cb4afb60
compression_ratio: 0.31327433628318585
condensation_order: 1
covers: [billing-changes-are-constrained-by-stripe-api-compatibility.md, context.md, multi_plan_subscription_system.md, stripe_v21_api_migration.md]
covers_token_total: 2825
summary_level: d1
token_count: 885
type: summary
---
# Billing

The billing topic centers on Stripe v21 compatibility and the multi-plan subscription system that depends on it. These entries show that billing logic, webhook persistence, and UI state are tightly coupled to Stripe’s updated object model, so subscription design must track API shape changes closely.

## Core structure

- **`context.md`**: High-level topic summary for billing. It frames the area as Stripe v21 breaking changes affecting invoice handling, subscription field access, promotion codes, and billing-related type handling.
- **`stripe_v21_api_migration.md`**: Documents the Stripe SDK upgrade impacts and the exact compatibility rules required in code.
- **`multi_plan_subscription_system.md`**: Documents the implemented multi-plan billing architecture, including plan selection, persistence, admin/public APIs, and billing UI.

## Key architectural relationships

- The billing system has **two linked layers**:
  1. **Stripe v21 migration layer** — updates invoice, subscription, promotion code, and status access patterns.
  2. **Multi-plan subscription architecture** — introduces `subscription_plans`, optional `planId` handling, and webhook-driven persistence into `group_subscriptions`.
- The multi-plan system depends on **Stripe subscription pricing**, **Migration 006**, **webhook synchronization**, and the **`STRIPE_PRICE_ID` fallback**.
- Billing changes must preserve compatibility with Stripe v21 because the same objects and fields are used across checkout, webhook processing, and UI display.

## Important rules and decisions

### From `stripe_v21_api_migration.md`
- Use `invoices.createPreview()` instead of `invoices.retrieveUpcoming()`.
- Read subscription period dates from `subscription.items.data[0]`.
- Access invoice subscription via `Invoice.parent.subscription_details.subscription`.
- Access promotion coupons via `PromotionCode.promotion.coupon`.
- Replace `invoice.paid` with `invoice.status === "paid"`.
- Treat `hosted_invoice_url` as nullable and normalize with `?? null`.
- `Invoice.status` is a `Status` enum, not a plain string.

### From `multi_plan_subscription_system.md`
- `planId` is optional in checkout and group creation.
- When `planId` is present, resolve `stripe_price_id` and `trial_days` from `subscription_plans`.
- Fall back to `STRIPE_PRICE_ID` if lookup fails or no plan is provided.
- Webhook events persist both `plan_id` and `stripe_price_id` into `group_subscriptions`.
- Subscription cancellation uses `cancel_at_period_end: true`.
- Installments are **not** modeled as Stripe subscriptions; they use one-time payments instead.
- The semestral plan uses `month` interval with `interval_count: 6`.

## Relevant files and endpoints

### Billing APIs and UI
- `api/admin/plans/route.ts`
- `api/admin/plans/[planId]/route.ts`
- `api/plans/route.ts`
- `api/groups/[groupId]/billing/route.ts`
- `api/stripe/checkout/route.ts`
- `api/groups/route.ts`
- `components/groups/plan-selector.tsx`
- `components/groups/group-billing-tab.tsx`
- `components/admin/admin-plans-tab.tsx`

### Schema and storage
- Migration 006 creates `subscription_plans`.
- Migration 006 also adds `plan_id` and `stripe_price_id` to `group_subscriptions`.

## Drill-down map

- **`stripe_v21_api_migration.md`** — exact Stripe API renames, field relocations, and status/type handling.
- **`multi_plan_subscription_system.md`** — full billing architecture, plan APIs, webhook persistence, and UI integration.
- **`context.md`** — compact overview of the billing topic and its related areas.