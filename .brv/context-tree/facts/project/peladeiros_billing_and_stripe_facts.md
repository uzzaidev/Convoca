---
title: Peladeiros Billing And Stripe Facts
tags: []
related: [architecture/billing/stripe_v21_api_migration.md, architecture/billing/multi_plan_subscription_system.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-01T14:38:31.887Z'
updatedAt: '2026-04-01T14:38:31.887Z'
---
## Raw Concept
**Task:**
Capture durable project facts for Peladeiros billing, Stripe integration, and build diagnostics

**Changes:**
- Recorded Stripe v21 migration facts
- Recorded multi-plan subscription architecture facts
- Recorded Windows SWC build diagnostic fact

**Flow:**
knowledge captured -> facts deduplicated -> grouped by subject -> stored for future project recall

**Timestamp:** 2026-04-01

## Narrative
### Structure
This fact record consolidates concrete billing and Stripe implementation facts that are likely to be reused across debugging, onboarding, and architectural recall. It includes API path changes from Stripe v21, plan-related file locations, checkout fallback behavior, subscription persistence details, and Windows build heuristics.

### Dependencies
Useful when maintaining Stripe billing code, diagnosing type or API breakage after SDK upgrades, tracing plan selection behavior, or interpreting Windows-specific build exit codes.

### Highlights
Captured 23 deduplicated factual statements across 23 subjects. These facts include schema, endpoint, component, policy, and environment-level implementation details.

### Examples
Examples include the rename to invoices.createPreview(), fallback to STRIPE_PRICE_ID, persistence of plan_id and stripe_price_id, and the interpretation of exit code 3221225477 as an SWC DLL issue rather than an application build failure.

## Facts
- **stripe_invoice_preview_method**: stripe@21.x.x renamed invoices.retrieveUpcoming() to invoices.createPreview(). [project]
- **stripe_subscription_period_fields**: In stripe@21.x.x, current_period_start and current_period_end moved from Subscription to SubscriptionItem and should be accessed via subscription.items.data[0]. [project]
- **stripe_invoice_subscription_field**: In stripe@21.x.x, Invoice.subscription moved to Invoice.parent.subscription_details.subscription. [project]
- **stripe_promotion_coupon_field**: In stripe@21.x.x, PromotionCode.coupon moved to PromotionCode.promotion.coupon. [project]
- **stripe_invoice_paid_check**: In stripe@21.x.x, invoice.paid was removed and invoice.status === "paid" should be used instead. [project]
- **stripe_hosted_invoice_url_nullability**: In stripe@21.x.x, hosted_invoice_url can be undefined and should use ?? null. [project]
- **stripe_invoice_status_type**: In stripe@21.x.x, Invoice.status is a Status enum rather than a plain string and may need casting as string | null. [project]
- **subscription_plan_schema**: Migration 006 creates the subscription_plans table and adds plan_id and stripe_price_id columns to group_subscriptions. [project]
- **admin_plans_api_files**: The admin plans API is implemented in api/admin/plans/route.ts and api/admin/plans/[planId]/route.ts. [project]
- **public_plans_api_file**: The public plans API is implemented in api/plans/route.ts for active plans used in checkout. [project]
- **group_billing_api_file**: The billing API is implemented in api/groups/[groupId]/billing/route.ts for billing info and cancel/reactivate actions. [project]
- **plan_selector_component**: The plan selector UI is implemented in components/groups/plan-selector.tsx and is shown in create-group-form and payment-button. [project]
- **group_billing_tab_component**: The billing tab UI is implemented in components/groups/group-billing-tab.tsx as the 8th tab in group settings. [project]
- **admin_plans_tab_component**: The admin plans tab UI is implemented in components/admin/admin-plans-tab.tsx as the 5th tab in the admin dashboard. [project]
- **checkout_plan_id_support**: Both api/stripe/checkout/route.ts and api/groups/route.ts accept an optional planId in the checkout flow. [project]
- **plan_lookup_fields**: When planId is provided, the system looks up subscription_plans for stripe_price_id and trial_days. [project]
- **stripe_price_fallback**: If no planId is provided or the plan is not found, checkout falls back to the STRIPE_PRICE_ID environment variable. [project]
- **webhook_subscription_plan_persistence**: The Stripe webhook stores plan_id and stripe_price_id on group_subscriptions. [project]
- **semestral_plan_billing_cycle**: The semestral plan uses interval month with interval_count 6 and charges the full amount every 6 months. [project]
- **stripe_installments_support**: Installments are not supported with Stripe subscriptions and are only available with one-time payments. [project]
- **subscription_cancel_policy**: Subscription cancellation uses cancel_at_period_end: true so access remains until the end of the paid period. [project]
- **windows_swc_exit_code**: On Windows, exit code 3221225477 indicates SWC DLL initialization failure rather than a real build error. [environment]
- **windows_build_success_heuristic**: A Windows build can still be considered successful if static pages are generated and Finalizing page optimization appears. [environment]
