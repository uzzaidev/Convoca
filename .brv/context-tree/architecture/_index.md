---
children_hash: ad5fb57923578f3a8bcf2cebb50fb817c8cc81c93bfef0b603d0588a201f0df2
compression_ratio: 0.48284063880394157
condensation_order: 2
covers: [billing/_index.md, context.md, database/_index.md]
covers_token_total: 2943
summary_level: d2
token_count: 1421
type: summary
---
# Architecture

## Domain scope
Application architecture knowledge is organized around two active topics:

- `billing/_index.md` — Stripe billing compatibility and the multi-plan subscription system
- `database/_index.md` — PostgreSQL portability, auth/account data access, and migration risk

The domain emphasizes infrastructure/runtime/persistence design rather than end-user feature behavior. See `context.md` for the domain boundary: architecture decisions, database client design, provider migration constraints, and infrastructure risks.

## Topic map

### Billing
Primary drill-down:
- `stripe_v21_api_migration.md`
- `multi_plan_subscription_system.md`

This topic has two layers:

1. **Stripe SDK compatibility layer** (`stripe_v21_api_migration.md`)
   - Required Stripe v21 migration changes:
     - `invoices.retrieveUpcoming()` → `invoices.createPreview()`
     - subscription period fields move to `subscription.items.data[0]`
     - invoice subscription reference moves to `Invoice.parent.subscription_details.subscription`
     - promotion code coupon access moves to `PromotionCode.promotion.coupon`
     - paid detection changes from `invoice.paid` to `invoice.status === "paid"`
     - `hosted_invoice_url` must be nullable-safe
     - `Invoice.status` is enum-typed, not a plain string
   - Affects invoice preview generation, lifecycle display, promotion code handling, invoice status checks, and TypeScript safety.

2. **Application subscription architecture** (`multi_plan_subscription_system.md`)
   - Architectural decision: introduce a dedicated `subscription_plans` model in Migration `006`.
   - Persist both `plan_id` and `stripe_price_id` in `group_subscriptions`.
   - `planId` remains optional in checkout and group creation; fallback is `STRIPE_PRICE_ID`.
   - Stripe webhook is responsible for writing selected plan metadata back into `group_subscriptions`.

#### Billing flow
- Admin manages plans
- Public API exposes active plans
- Checkout/group creation optionally accepts `planId`
- Backend resolves `stripe_price_id` and `trial_days`
- Stripe webhook persists plan linkage
- Billing UI reflects subscription state

#### Billing surfaces
Backend:
- `api/admin/plans/route.ts`
- `api/admin/plans/[planId]/route.ts`
- `api/plans/route.ts`
- `api/stripe/checkout/route.ts`
- `api/groups/route.ts`
- `api/groups/[groupId]/billing/route.ts`

UI:
- `components/groups/plan-selector.tsx`
- `components/groups/group-billing-tab.tsx`
- `components/admin/admin-plans-tab.tsx`

#### Key billing rules
- `planId` drives lookup of `stripe_price_id` and `trial_days`
- fallback pricing uses `STRIPE_PRICE_ID`
- cancellation uses `cancel_at_period_end: true`
- semestral plan is modeled as `interval: month` with `interval_count: 6`
- installment-style `parcelamento` is not modeled via Stripe subscriptions; it requires one-time payments

#### Relationship inside billing
`multi_plan_subscription_system.md` depends on the object access and type-safety rules documented in `stripe_v21_api_migration.md`.

---

### Database
Primary drill-down:
- `provider_migration_diagnosis.md`

This topic centers on provider portability and the fact that the project is built on **generic PostgreSQL access**, not a managed-provider SDK.

#### Core architectural decisions
- Main DB connectivity goes through `src/db/client.ts`.
- The app is largely portable across PostgreSQL providers because it avoids Supabase-specific application APIs.
- Authentication/account lifecycle logic lives in the application layer, not provider auth services.

#### Auth and account flow
Key files:
- `src/lib/auth.ts` — NextAuth Credentials login using raw SQL against `public.users`
- `src/app/api/auth/signup/route.ts` — inserts into `users`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/lib/email.ts` — password recovery email via Resend

Data pattern:
- login reads `public.users`
- signup writes `users`
- forgot-password uses `users.reset_token` and `users.reset_token_expiry`
- reset-password validates token and updates password

#### Migration readiness
`provider_migration_diagnosis.md` concludes provider lock-in is low because:
- no Supabase SDK dependency in core app flows
- no Supabase auth/storage dependency in core architecture
- migration work is mostly operational:
  - update `DATABASE_URL`
  - migrate schema/data
  - audit remaining provider references
  - rotate exposed credentials

#### Schema portability
Relevant file:
- `src/db/migrations/schema.sql`

The schema relies on common PostgreSQL capabilities:
- `uuid-ossp`
- `JSONB`
- `TEXT[]`
- materialized views
- `plpgsql`
- triggers

This indicates migration friction is mostly config/ops-related rather than blocked by proprietary APIs.

#### Residual coupling and risk
Provider-specific leftovers:
- local `.env` still pointing `DATABASE_URL` to a Supabase host
- legacy backup scripts:
  - `src/db/backup-supabase.sh`
  - `src/db/backup-supabase.bat`

Operational risk pattern:
- hardcoded credentials in Supabase and Neon backup scripts
- credentials should be rotated after migration
- this connects directly to `security/operations`

## Cross-topic patterns
- Both topics document **infrastructure-facing architecture**, not product copy or user guides.
- `billing/_index.md` is about Stripe-backed monetization architecture and SDK compatibility.
- `database/_index.md` is about PostgreSQL abstraction, auth data flows, and migration/secret exposure risk.
- Shared architectural theme: the system favors **application-layer control** over provider-managed abstractions, which improves portability but makes file-level operational hygiene critical.