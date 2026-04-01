---
title: Multi Plan Subscription System
tags: []
related: [architecture/billing/stripe_v21_api_migration.md, facts/project/peladeiros_billing_and_stripe_facts.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-01T14:38:31.884Z'
updatedAt: '2026-04-01T14:38:31.884Z'
---
## Raw Concept
**Task:**
Document the implemented multi-plan subscription system and related billing architecture

**Changes:**
- Added subscription_plans support with schema migration 006
- Implemented admin and public plan APIs
- Integrated optional planId into checkout and group creation flows
- Stored selected plan metadata in group_subscriptions via webhook
- Added plan selector, billing tab, and admin plans tab UI components

**Flow:**
admin defines plans -> public API exposes active plans -> checkout or group creation accepts optional planId -> plan lookup resolves stripe_price_id and trial_days -> Stripe webhook persists plan metadata on group_subscriptions -> billing tab reflects subscription state

**Timestamp:** 2026-04-01

## Narrative
### Structure
The billing architecture adds a dedicated subscription_plans model and threads plan selection through admin management, public discovery, checkout, subscription persistence, and group billing management. UI support exists in the group plan selector, the group billing tab, and the admin plans tab.

### Dependencies
Depends on Migration 006, Stripe subscription pricing, the STRIPE_PRICE_ID fallback environment variable, webhook synchronization, and billing endpoints for cancellation and reactivation behavior.

### Highlights
Semestral plans are modeled as month interval subscriptions with interval_count 6, plan selection is optional in checkout, and the system persists both plan_id and stripe_price_id on group_subscriptions.

### Rules
1. Accept planId as optional in checkout and group creation flows.
2. When planId is present, resolve stripe_price_id and trial_days from subscription_plans.
3. Fall back to STRIPE_PRICE_ID if planId is missing or lookup fails.
4. Persist plan_id and stripe_price_id from webhook events into group_subscriptions.
5. Use cancel_at_period_end: true for subscription cancellation.
6. Do not model installments as Stripe subscriptions; use one-time payments for parcelamento.

### Examples
Example components and endpoints: api/admin/plans/route.ts and api/admin/plans/[planId]/route.ts for administration, api/plans/route.ts for public checkout options, api/groups/[groupId]/billing/route.ts for billing actions, and components/groups/plan-selector.tsx for UI selection.

## Facts
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
