---
children_hash: c0547723ce529fb0a3d9707fba4d177a9f24f5109b61c35f2654f53f6cb1b601
compression_ratio: 0.5479892761394102
condensation_order: 2
covers: [billing/_index.md, context.md, database/_index.md]
covers_token_total: 1865
summary_level: d2
token_count: 1022
type: summary
---
# Architecture and Database

The architecture domain centers on infrastructure-level decisions and persistence design, with the billing and database topics showing the main implementation constraints and migration boundaries.

## Billing

Billing is shaped by Stripe v21 compatibility and a multi-plan subscription model. The key relationship is that subscription flow, webhook persistence, and UI state all depend on Stripe’s updated object model, so billing changes must stay aligned with API shape changes.

### Drill-down entries
- **`stripe_v21_api_migration.md`** — Stripe SDK upgrade rules and field/type compatibility.
- **`multi_plan_subscription_system.md`** — multi-plan billing architecture, plan selection, persistence, and UI integration.
- **`context.md`** — compact billing overview.

### Main decisions and rules
- Use `invoices.createPreview()` instead of `invoices.retrieveUpcoming()`.
- Read subscription period dates from `subscription.items.data[0]`.
- Access invoice subscription via `Invoice.parent.subscription_details.subscription`.
- Access promotion coupons via `PromotionCode.promotion.coupon`.
- Replace `invoice.paid` with `invoice.status === "paid"`.
- Treat `hosted_invoice_url` as nullable and normalize with `?? null`.
- `Invoice.status` is a `Status` enum, not a plain string.

### Multi-plan system structure
- `planId` is optional in checkout and group creation.
- When `planId` exists, resolve `stripe_price_id` and `trial_days` from `subscription_plans`.
- Fall back to `STRIPE_PRICE_ID` when lookup fails or no plan is provided.
- Webhooks persist both `plan_id` and `stripe_price_id` into `group_subscriptions`.
- Cancellation uses `cancel_at_period_end: true`.
- Installments are not modeled as Stripe subscriptions; they use one-time payments.
- The semestral plan uses `month` interval with `interval_count: 6`.

### Related APIs and storage
- Admin and public billing routes: `api/admin/plans/route.ts`, `api/admin/plans/[planId]/route.ts`, `api/plans/route.ts`, `api/groups/[groupId]/billing/route.ts`, `api/stripe/checkout/route.ts`, `api/groups/route.ts`
- UI components: `components/groups/plan-selector.tsx`, `components/groups/group-billing-tab.tsx`, `components/admin/admin-plans-tab.tsx`
- Migration 006 creates `subscription_plans` and adds `plan_id` and `stripe_price_id` to `group_subscriptions`

## Database

The database domain focuses on provider abstraction, auth data access, schema portability, and operational credential risk. The central conclusion is that provider migration is mostly an operations and configuration problem rather than a full application rewrite.

### Drill-down entries
- **`provider_migration_diagnosis.md`** — readiness diagnosis and source-level evidence.
- **`migration-readiness-is-split-between-code-portability-and-operational-cleanup.md`** — synthesis of migration readiness and remaining blockers.
- **`context.md`** — domain overview.

### Main findings
- The app is largely provider-portable because it uses generic PostgreSQL access.
- Authentication is custom and SQL-based, using **NextAuth Credentials** against `public.users`, not Supabase SDK auth.
- Password recovery depends on `reset_token`, `reset_token_expiry`, and **Resend** email delivery.
- The main migration path is a `DATABASE_URL` switch plus schema/data migration and cleanup of provider-specific references.
- The most serious blockers are operational leftovers and exposed secrets in backup tooling.

### Schema and portability characteristics
- Standard PostgreSQL features support portability: `uuid-ossp`, `JSONB`, `TEXT[]`, materialized views, `plpgsql`, and triggers.
- Migration readiness depends on updating configuration, migrating schema/data, auditing references, and rotating credentials.
- Security overlaps with this area because backup scripts contain hardcoded credentials and other secret exposure risks.

### Key relationship
- Database provider abstraction reduces lock-in at the code level, but operational credential hygiene remains a separate concern and connects directly to **security/operations**.