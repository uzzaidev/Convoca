---
children_hash: fc1cf6fd5337e9d4fb908d709af5274388ce808ff2777c25a600faf97f847fbf
compression_ratio: 0.566128067025733
condensation_order: 2
covers: [context.md, project/_index.md]
covers_token_total: 1671
summary_level: d2
token_count: 946
type: summary
---
# facts / project

Durable fact layer for Peladeiros: stable implementation choices, infrastructure signals, billing behavior, and operational risks. It complements deeper design detail in `architecture/database`, `architecture/billing`, and `security/operations`.

## What this topic covers
- `context.md`: standalone high-signal project facts, not long-form rationale.
- `peladeiros_infrastructure_facts_2026_03_31.md`: auth, database portability, environment and script risks.
- `peladeiros_billing_and_stripe_facts.md`: Stripe v21 changes, plan/subscription wiring, product billing rules, Windows build heuristic.

## Core facts

### Auth and data access
From `peladeiros_infrastructure_facts_2026_03_31.md`:
- Runtime does **not** use Supabase SDK/API.
- Auth uses NextAuth Credentials + raw SQL in `src/lib/auth.ts`.
- Signup: `src/app/api/auth/signup/route.ts`.
- Password reset uses `reset_token` / `reset_token_expiry` plus Resend via:
  - `src/app/api/auth/forgot-password/route.ts`
  - `src/app/api/auth/reset-password/route.ts`
  - `src/lib/email.ts`
- Database access uses generic Postgres client in `src/db/client.ts`.

### Provider portability
From `peladeiros_infrastructure_facts_2026_03_31.md`:
- Migration between DB providers is mainly `DATABASE_URL` + schema/data move.
- Schema depends on standard PostgreSQL features: `uuid-ossp`, `JSONB`, `TEXT[]`, materialized views, `plpgsql`, triggers.
- Local `.env` still references a Supabase host, indicating residual provider-specific config.

### Billing and Stripe
From `peladeiros_billing_and_stripe_facts.md`:
- Stripe v21 durable changes:
  - `invoices.retrieveUpcoming()` → `invoices.createPreview()`
  - subscription period fields now come from `subscription.items.data[0]`
  - `Invoice.subscription` → `Invoice.parent.subscription_details.subscription`
  - `PromotionCode.coupon` → `PromotionCode.promotion.coupon`
  - `invoice.paid` removed; use `invoice.status === "paid"`
  - `hosted_invoice_url ?? null`
- Multi-plan model:
  - migration `006` creates `subscription_plans`
  - `group_subscriptions` gains `plan_id` and `stripe_price_id`
- API split:
  - admin plans: `api/admin/plans/route.ts`, `api/admin/plans/[planId]/route.ts`
  - public plans: `api/plans/route.ts`
  - group billing: `api/groups/[groupId]/billing/route.ts`
- UI split:
  - `components/groups/plan-selector.tsx`
  - `components/groups/group-billing-tab.tsx`
  - `components/admin/admin-plans-tab.tsx`
- Checkout in `api/stripe/checkout/route.ts` and `api/groups/route.ts` accepts optional `planId`; if present it resolves `subscription_plans` for `stripe_price_id` and `trial_days`, otherwise falls back to `STRIPE_PRICE_ID`.
- Webhooks persist both `plan_id` and `stripe_price_id`.

### Product and operational constraints
- Semestral plan = `interval=month`, `interval_count=6`.
- Stripe installments do not apply to subscriptions.
- Cancellation uses `cancel_at_period_end: true`.
- Legacy scripts `src/db/backup-supabase.sh` and `src/db/backup-supabase.bat` contain hardcoded Supabase/Neon credentials.
- On Windows, exit code `3221225477` is treated as likely SWC DLL init failure; successful static generation + “Finalizing page optimization” still indicates build success.

## Key structure and relationships
- `peladeiros_infrastructure_facts_2026_03_31.md`: custom auth + generic Postgres + residual Supabase/credential debt.
- `peladeiros_billing_and_stripe_facts.md`: Stripe API migration + multi-plan subscription wiring across migration, API, UI, checkout, and webhook layers.
- Drill down:
  - `architecture/database/provider_migration_diagnosis.md`
  - `architecture/billing/multi_plan_subscription_system.md`
  - `architecture/billing/stripe_v21_api_migration.md`
  - `security/operations/backup_credential_exposure.md`