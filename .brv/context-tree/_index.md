---
children_hash: 2ae9e5472b66baed57bf1567de875fe9eee48358b5767ac913e84776a5684a55
compression_ratio: 0.70291146761735
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, security/_index.md]
covers_token_total: 3366
summary_level: d3
token_count: 2366
type: summary
---
# Knowledge Structure Summary

## Top-level domains
- `architecture/_index.md` — infrastructure architecture for billing and database portability
- `facts/_index.md` — durable project facts distilled from architecture and operations
- `security/_index.md` — operational security scope and credential-exposure remediation

## Cross-domain pattern
Peladeiros consistently favors **application-layer control over provider-managed abstractions**:
- database access uses generic PostgreSQL via `src/db/client.ts`
- auth logic is implemented in app code (`src/lib/auth.ts`, auth API routes) rather than Supabase Auth
- billing logic resolves plans and writes subscription metadata in app/backend/webhook layers rather than delegating plan semantics entirely to Stripe
- main residual risk is **operational hygiene**, especially hardcoded credentials in backup tooling

This relationship is visible across:
- `architecture/database/provider_migration_diagnosis.md`
- `architecture/billing/multi_plan_subscription_system.md`
- `architecture/billing/stripe_v21_api_migration.md`
- `security/operations/backup_credential_exposure.md`
- `facts/project/peladeiros_infrastructure_facts_2026_03_31.md`
- `facts/project/peladeiros_billing_and_stripe_facts.md`

---

## Architecture domain
Ref: `architecture/_index.md`

### Topic map
- `billing/_index.md`
  - `stripe_v21_api_migration.md`
  - `multi_plan_subscription_system.md`
- `database/_index.md`
  - `provider_migration_diagnosis.md`

### Billing architecture
Ref: `architecture/billing/_index.md`

#### 1) Stripe v21 compatibility layer
Ref: `stripe_v21_api_migration.md`

Durable SDK/API changes:
- `invoices.retrieveUpcoming()` → `invoices.createPreview()`
- subscription period data moves to `subscription.items.data[0]`
- invoice subscription reference moves to `Invoice.parent.subscription_details.subscription`
- promotion coupon access moves from `PromotionCode.coupon` to `PromotionCode.promotion.coupon`
- paid detection changes from `invoice.paid` to `invoice.status === "paid"`
- `hosted_invoice_url` must be handled as nullable (`?? null`)
- `Invoice.status` should be treated as enum-typed

Affected surfaces:
- invoice preview generation
- billing lifecycle display
- promotion code handling
- invoice status checks
- TypeScript typing safety

#### 2) Multi-plan subscription system
Ref: `multi_plan_subscription_system.md`

Core decision:
- migration `006` introduces `subscription_plans`
- `group_subscriptions` persists both `plan_id` and `stripe_price_id`

Flow:
- admin manages plans
- public API exposes active plans
- checkout/group creation optionally receives `planId`
- backend resolves `stripe_price_id` and `trial_days`
- Stripe webhook writes selected plan metadata back to `group_subscriptions`
- billing UI reflects resulting subscription state

Backend/API surfaces:
- `api/admin/plans/route.ts`
- `api/admin/plans/[planId]/route.ts`
- `api/plans/route.ts`
- `api/stripe/checkout/route.ts`
- `api/groups/route.ts`
- `api/groups/[groupId]/billing/route.ts`

UI surfaces:
- `components/groups/plan-selector.tsx`
- `components/groups/group-billing-tab.tsx`
- `components/admin/admin-plans-tab.tsx`

Rules and constraints:
- `planId` is optional in checkout and group creation
- if present, backend looks up `stripe_price_id` and `trial_days`
- fallback pricing uses `STRIPE_PRICE_ID`
- cancellation uses `cancel_at_period_end: true`
- semestral plan is modeled as `interval: month` + `interval_count: 6`
- installment-style `parcelamento` is not represented by Stripe subscriptions; requires one-time payments

Relationship:
- `multi_plan_subscription_system.md` depends on object-access and typing changes from `stripe_v21_api_migration.md`

### Database architecture
Ref: `architecture/database/_index.md`, `provider_migration_diagnosis.md`

#### Core database design
- main connectivity goes through `src/db/client.ts`
- project is built around **generic PostgreSQL access**
- provider lock-in is low because runtime flows avoid Supabase-specific core APIs

#### Auth/account data flow
Key files:
- `src/lib/auth.ts` — NextAuth Credentials login with raw SQL against `public.users`
- `src/app/api/auth/signup/route.ts` — inserts into `users`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/lib/email.ts` — Resend integration for password recovery email

Data pattern:
- login reads `public.users`
- signup writes `users`
- forgot-password uses `users.reset_token` and `users.reset_token_expiry`
- reset-password validates token and updates password

#### Migration readiness
Migration between providers is mostly operational:
- update `DATABASE_URL`
- move schema/data
- audit lingering provider references
- rotate exposed credentials

#### Schema portability
Ref: `src/db/migrations/schema.sql`

Portable PostgreSQL features in use:
- `uuid-ossp`
- `JSONB`
- `TEXT[]`
- materialized views
- `plpgsql`
- triggers

#### Residual coupling/risk
- local `.env` still points `DATABASE_URL` to a Supabase host
- legacy scripts:
  - `src/db/backup-supabase.sh`
  - `src/db/backup-supabase.bat`
- these connect directly to `security/operations/backup_credential_exposure.md`

---

## Facts domain
Ref: `facts/_index.md`

### Role of this domain
A condensed fact layer that captures stable implementation choices and risks without full architectural rationale. It aggregates from:
- `facts/project/peladeiros_infrastructure_facts_2026_03_31.md`
- `facts/project/peladeiros_billing_and_stripe_facts.md`

### Infrastructure facts
Ref: `peladeiros_infrastructure_facts_2026_03_31.md`

Stable facts:
- runtime does not use Supabase SDK/API
- auth uses NextAuth Credentials + raw SQL in `src/lib/auth.ts`
- signup/password-reset flows live in auth API routes and `src/lib/email.ts`
- database access uses generic Postgres client in `src/db/client.ts`
- provider migration is mainly `DATABASE_URL` + schema/data transfer
- local `.env` still contains Supabase-host configuration
- backup scripts contain hardcoded Supabase/Neon credentials

### Billing and Stripe facts
Ref: `peladeiros_billing_and_stripe_facts.md`

Stable facts preserved from architecture:
- Stripe v21 API shape changes listed in `stripe_v21_api_migration.md`
- migration `006` adds `subscription_plans`
- `group_subscriptions` gains `plan_id` and `stripe_price_id`
- admin/public/group-billing API split is explicit
- UI split spans selector, group billing tab, and admin plans tab
- checkout in `api/stripe/checkout/route.ts` and `api/groups/route.ts` accepts optional `planId`
- if `planId` exists, app resolves `stripe_price_id` and `trial_days`; else fallback is `STRIPE_PRICE_ID`
- webhooks persist both `plan_id` and `stripe_price_id`

Additional durable constraints:
- semestral plan = `interval=month`, `interval_count=6`
- Stripe installments do not apply to subscriptions
- cancellation uses `cancel_at_period_end: true`
- Windows build exit code `3221225477` is treated as likely SWC DLL init failure; if static generation completes and “Finalizing page optimization” appears, build is still considered successful

### Relationship to other domains
`facts/_index.md` functions as the compressed recall layer for:
- `architecture/database/provider_migration_diagnosis.md`
- `architecture/billing/multi_plan_subscription_system.md`
- `architecture/billing/stripe_v21_api_migration.md`
- `security/operations/backup_credential_exposure.md`

---

## Security domain
Ref: `security/_index.md`

### Domain scope
Focused on operational security knowledge:
- credential management risks
- secret rotation requirements
- operational script security
- exposure remediation notes

Explicitly excludes:
- feature authorization logic
- user-facing security guidance

### Operations topic
Ref: `security/operations/_index.md`, `backup_credential_exposure.md`

#### Backup credential exposure
Core finding:
- operational backup automation still includes provider-specific scripts with embedded credentials

Files:
- `src/db/backup-supabase.sh`
- `src/db/backup-supabase.bat`

Risk flow:
- infrastructure review
- inspect backup scripts
- detect embedded credentials
- treat as exposed secrets
- rotate credentials after migration/audit

Key rule:
- hardcoded credentials in operational scripts must be treated as exposed secrets and rotated after migration or discovery

Dependencies for mitigation:
- inventory all scripts with embedded secrets
- replace static credentials with env-injected or managed secrets
- rotate affected database users/passwords
- apply remediation across providers, not only the active one

Facts preserved:
- backup scripts for Supabase and Neon contain hardcoded credentials
- credential rotation is recommended after migration because secrets are exposed

Relationship:
- `backup_credential_exposure.md` is directly related to `architecture/database/provider_migration_diagnosis.md`

---

## Drill-down guide
For detail on specific concerns:
- Stripe SDK/type migration: `architecture/billing/stripe_v21_api_migration.md`
- Subscription model and plan wiring: `architecture/billing/multi_plan_subscription_system.md`
- Postgres portability and auth/data flow: `architecture/database/provider_migration_diagnosis.md`
- Durable implementation facts: `facts/project/peladeiros_infrastructure_facts_2026_03_31.md`, `facts/project/peladeiros_billing_and_stripe_facts.md`
- Credential exposure and remediation: `security/operations/backup_credential_exposure.md`