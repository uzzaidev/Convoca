---
children_hash: 5175efc343abcbf76ddda9b709ced9c32fa42c3795d922e4febd195d877a57fe
compression_ratio: 0.6889616463985033
condensation_order: 1
covers: [context.md, peladeiros_billing_and_stripe_facts.md, peladeiros_infrastructure_facts_2026_03_31.md]
covers_token_total: 2138
summary_level: d1
token_count: 1473
type: summary
---
# project

Point-in-time factual recall for Peladeiros implementation choices, with emphasis on infrastructure portability, authentication, billing/Stripe behavior, and operational risk. This topic acts as a fact layer that complements deeper analysis in `architecture/database`, `architecture/billing`, and `security/operations`.

## Scope and role
- `context.md` defines this topic as a durable store of factual statements about infrastructure and implementation choices.
- Main relationship paths:
  - `architecture/database` for provider migration diagnosis
  - `architecture/billing` for Stripe migration and subscription architecture
  - `security/operations` for credential exposure risk

## Core implementation facts

### Auth and user flows
From `peladeiros_infrastructure_facts_2026_03_31.md`:
- The app does not use the Supabase SDK or Supabase API for runtime auth/storage.
- Authentication is implemented with NextAuth Credentials and raw SQL against `public.users` in `src/lib/auth.ts`.
- Signup creates users through `src/app/api/auth/signup/route.ts`.
- Password recovery uses `reset_token` and `reset_token_expiry` on `users`, with email delivery via Resend through:
  - `src/app/api/auth/forgot-password/route.ts`
  - `src/app/api/auth/reset-password/route.ts`
  - `src/lib/email.ts`

### Database and provider portability
From `peladeiros_infrastructure_facts_2026_03_31.md`:
- Database access uses the generic `postgres` client in `src/db/client.ts`.
- Provider migration is framed as mostly:
  - changing `DATABASE_URL`
  - moving schema
  - moving data
- The schema is portable because it relies on standard PostgreSQL capabilities:
  - `uuid-ossp`
  - `JSONB`
  - `TEXT[]`
  - materialized views
  - `plpgsql`
  - triggers
- A local `.env` still points `DATABASE_URL` to a Supabase host, showing lingering provider-specific environment state.

## Billing and Stripe facts

### Stripe v21 API decisions
From `peladeiros_billing_and_stripe_facts.md`:
- `stripe@21.x.x` changes captured as durable migration facts:
  - `invoices.retrieveUpcoming()` → `invoices.createPreview()`
  - `Subscription.current_period_start` / `current_period_end` moved to `subscription.items.data[0]`
  - `Invoice.subscription` moved to `Invoice.parent.subscription_details.subscription`
  - `PromotionCode.coupon` moved to `PromotionCode.promotion.coupon`
  - `invoice.paid` removed; use `invoice.status === "paid"`
  - `hosted_invoice_url` may be `undefined` and should be normalized with `?? null`
  - `Invoice.status` is a typed Status enum, sometimes requiring `string | null` casting

### Subscription and plan architecture
From `peladeiros_billing_and_stripe_facts.md`:
- Migration `006` creates `subscription_plans` and adds `plan_id` plus `stripe_price_id` to `group_subscriptions`.
- API surface is split by responsibility:
  - Admin plans: `api/admin/plans/route.ts`, `api/admin/plans/[planId]/route.ts`
  - Public active plans for checkout: `api/plans/route.ts`
  - Group billing actions/info: `api/groups/[groupId]/billing/route.ts`
- UI surface is likewise distributed:
  - Plan selector: `components/groups/plan-selector.tsx`
  - Group billing tab: `components/groups/group-billing-tab.tsx`
  - Admin plans tab: `components/admin/admin-plans-tab.tsx`
- Checkout flow supports optional `planId` in:
  - `api/stripe/checkout/route.ts`
  - `api/groups/route.ts`
- When `planId` exists, checkout reads `subscription_plans` for `stripe_price_id` and `trial_days`.
- Fallback behavior is explicit: if `planId` is absent or unresolved, checkout uses `STRIPE_PRICE_ID`.
- Stripe webhook persistence stores both `plan_id` and `stripe_price_id` on `group_subscriptions`.

## Business rules and product constraints
From `peladeiros_billing_and_stripe_facts.md`:
- The semestral plan is modeled as `interval=month` with `interval_count=6`, charging the full amount every 6 months.
- Stripe installments are not supported for subscriptions; they apply only to one-time payments.
- Subscription cancellation uses `cancel_at_period_end: true`, preserving access through the paid period.

## Operational and environment signals

### Legacy tooling and risk
From `peladeiros_infrastructure_facts_2026_03_31.md`:
- Legacy scripts remain in:
  - `src/db/backup-supabase.sh`
  - `src/db/backup-supabase.bat`
- Those scripts contain hardcoded Supabase and Neon credentials, creating secret-rotation and exposure concerns.

### Windows build diagnostics
From `peladeiros_billing_and_stripe_facts.md`:
- On Windows, exit code `3221225477` is treated as an SWC DLL initialization issue, not necessarily an app build failure.
- Build success can still be inferred when static page generation completes and “Finalizing page optimization” appears.

## Structural pattern across entries
- `peladeiros_infrastructure_facts_2026_03_31.md` captures infrastructure/auth/provider-portability facts.
- `peladeiros_billing_and_stripe_facts.md` captures billing, Stripe SDK migration, plan wiring, and build heuristics.
- Together they show a project architecture with:
  - custom auth and generic Postgres access rather than Supabase runtime coupling
  - a multi-plan subscription system wired across migration, API, UI, checkout, and webhook layers
  - residual operational debt in backup scripts and environment configuration
  - fact records intended for debugging, onboarding, and future architectural recall

## Drill-down map
- Infrastructure/auth/provider facts: `peladeiros_infrastructure_facts_2026_03_31.md`
- Billing/Stripe facts: `peladeiros_billing_and_stripe_facts.md`
- Migration diagnosis detail: `architecture/database/provider_migration_diagnosis.md`
- Subscription and Stripe architecture detail:
  - `architecture/billing/multi_plan_subscription_system.md`
  - `architecture/billing/stripe_v21_api_migration.md`
- Credential exposure detail: `security/operations/backup_credential_exposure.md`