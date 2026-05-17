---
children_hash: 138d40048671b4a753e8df22a10d1a0c2fcb2f090c2f521017581d714521e62c
compression_ratio: 0.8115785688601223
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, security/_index.md]
covers_token_total: 2781
summary_level: d3
token_count: 2257
type: summary
---
# Level d3 Structural Summary

## Architecture and Database
The architecture branch is centered on infrastructure decisions and persistence boundaries, with two main drill-down areas: **billing** and **database**.

### Billing
Billing is constrained by **Stripe v21 compatibility** and a **multi-plan subscription model**. The main relationship is that subscription flow, webhook persistence, and UI state all depend on Stripe’s updated object model, so billing changes must remain aligned with API shape changes.

**Drill-down entries**
- `stripe_v21_api_migration.md` — Stripe SDK upgrade rules and field/type compatibility.
- `multi_plan_subscription_system.md` — multi-plan billing architecture, plan selection, persistence, and UI integration.
- `context.md` — compact billing overview.

**Core rules and decisions**
- Use `invoices.createPreview()` instead of `invoices.retrieveUpcoming()`.
- Read subscription period dates from `subscription.items.data[0]`.
- Access invoice subscription via `Invoice.parent.subscription_details.subscription`.
- Access promotion coupons via `PromotionCode.promotion.coupon`.
- Replace `invoice.paid` with `invoice.status === "paid"`.
- Treat `hosted_invoice_url` as nullable and normalize with `?? null`.
- `Invoice.status` is a `Status` enum, not a plain string.

**Multi-plan structure**
- `planId` is optional in checkout and group creation.
- When `planId` exists, resolve `stripe_price_id` and `trial_days` from `subscription_plans`.
- Fall back to `STRIPE_PRICE_ID` when lookup fails or no plan is provided.
- Webhooks persist both `plan_id` and `stripe_price_id` into `group_subscriptions`.
- Cancellation uses `cancel_at_period_end: true`.
- Installments are not modeled as Stripe subscriptions; they use one-time payments.
- The semestral plan uses `month` interval with `interval_count: 6`.

**Related surfaces**
- Admin and public routes: `api/admin/plans/route.ts`, `api/admin/plans/[planId]/route.ts`, `api/plans/route.ts`, `api/groups/[groupId]/billing/route.ts`, `api/stripe/checkout/route.ts`, `api/groups/route.ts`
- UI components: `components/groups/plan-selector.tsx`, `components/groups/group-billing-tab.tsx`, `components/admin/admin-plans-tab.tsx`
- Migration 006 creates `subscription_plans` and adds `plan_id` and `stripe_price_id` to `group_subscriptions`

### Database
The database branch focuses on **provider abstraction**, **auth data access**, **schema portability**, and **operational credential risk**. The central conclusion is that provider migration is mostly an operations and configuration problem rather than a full application rewrite.

**Drill-down entries**
- `provider_migration_diagnosis.md` — readiness diagnosis and source-level evidence.
- `migration-readiness-is-split-between-code-portability-and-operational-cleanup.md` — synthesis of migration readiness and remaining blockers.
- `context.md` — domain overview.

**Main findings**
- The app is largely provider-portable because it uses generic PostgreSQL access.
- Authentication is custom and SQL-based, using **NextAuth Credentials** against `public.users`, not Supabase SDK auth.
- Password recovery depends on `reset_token`, `reset_token_expiry`, and **Resend** email delivery.
- The main migration path is a `DATABASE_URL` switch plus schema/data migration and cleanup of provider-specific references.
- The biggest blockers are operational leftovers and exposed secrets in backup tooling.

**Schema and portability characteristics**
- Standard PostgreSQL features support portability: `uuid-ossp`, `JSONB`, `TEXT[]`, materialized views, `plpgsql`, and triggers.
- Migration readiness depends on updating configuration, migrating schema/data, auditing references, and rotating credentials.
- Security overlaps with this area because backup scripts contain hardcoded credentials and other secret exposure risks.

**Key relationship**
- Database provider abstraction reduces lock-in at the code level, but operational credential hygiene remains a separate concern and connects directly to **security/operations**.

---

## Facts
The facts branch is a high-signal recall layer for durable project knowledge, with a narrow scope focused on stable, reusable information.

### `context.md`
Defines the `facts` domain as a place for standalone project facts such as technology choices, environment facts, operational facts, and stable implementation details. It intentionally excludes long-form design rationale and user-facing docs.

### Project facts cluster
The project facts cluster groups the main factual baseline, infrastructure diagnosis, billing facts, and curation workflow rules.

**Drill-down entries**
- `project_facts.md` — broad factual baseline for the application.
- `peladeiros_infrastructure_facts_2026_03_31.md` — point-in-time infrastructure diagnosis.
- `peladeiros_billing_and_stripe_facts.md` — primary billing and Stripe reference.
- `curate_workflow_rlm_approach.md` — consolidated curation workflow rules.
- `rlm_curate_workflow_facts.md` — compact workflow fact snapshot.

**Core baseline**
- PostgreSQL is the primary database.
- Stripe v21 is used for billing.
- NextAuth Credentials authenticates against `public.users`.
- Signup and password reset flows are custom.
- Documentation is organized by domain rather than a monolithic README.
- Core entities include `subscription_plans` and `group_subscriptions`.

**Infrastructure diagnosis**
- No runtime Supabase SDK/API usage.
- Raw SQL is used via `postgres` in `src/db/client.ts`.
- Provider portability mostly depends on `DATABASE_URL` plus schema/data migration.
- Standard PostgreSQL features include `uuid-ossp`, `JSONB`, `TEXT[]`, materialized views, `plpgsql`, and triggers.
- Legacy backup scripts contain hardcoded Supabase/Neon credentials and are a security risk to rotate.

**Billing and Stripe facts**
- Stripe v21 migration affects API usage and field access patterns.
- Migration 006 adds support for `subscription_plans`, `plan_id`, and `stripe_price_id`.
- Main surfaces include admin plans, public plans, group billing, checkout, and plan selection.
- Checkout falls back to `STRIPE_PRICE_ID`.
- Webhooks persist billing identifiers.
- `cancel_at_period_end: true` is used.
- The Windows SWC exit-code heuristic is `3221225477`.

**Curation workflow**
- Reuse precomputed recon results.
- Use single-pass curation for small contexts.
- Deduplicate and group extracted facts.
- Verify using `result.summary` and `result.applied[].filePath`.
- These rules are captured as durable knowledge for future curation.

**Key relationships**
- `context.md` is the top-level facts overview.
- `project_facts.md` provides the broad baseline.
- `peladeiros_infrastructure_facts_2026_03_31.md` and `peladeiros_billing_and_stripe_facts.md` are the main drill-down points for infrastructure/auth/database and billing/Stripe.
- The workflow entries document how knowledge should be curated in this tree.

---

## Security / Operations
This branch is centered on **operational security risks** tied to provider migration and maintenance scripts. The focus is not application-layer authorization, but **exposed credentials in backup tooling** and the need for rotation and cleanup.

### `context.md`
Defines the security domain for credential management risks, secret rotation requirements, operational script security, and exposure remediation notes. It excludes feature authorization logic and user-facing security guidance.

### Operational security topic
The main topic is **hardcoded secrets in backup scripts**.

**Drill-down entry**
- `backup_credential_exposure.md` — concrete exposure finding and remediation constraint.

**Main risk pattern**
- Backup scripts for **Supabase** and **Neon** contain embedded credentials.
- The risk is documented across `src/db/backup-supabase.sh` and `src/db/backup-supabase.bat`.
- The operational flow is:
  **infrastructure review -> inspect backup scripts -> detect embedded credentials -> treat as exposure risk -> rotate credentials after migration**
- Mitigation depends on:
  - finding every script with embedded credentials
  - replacing static secrets with environment injection or secret management
  - rotating affected database users/passwords
- Rule: **hardcoded credentials in operational scripts must be treated as exposed secrets and rotated after migration or audit discovery.**

### Cross-cutting synthesis
#### `provider-portability-depends-on-secrets-hygiene.md`
This synthesis connects architecture, facts, and security:
- The application is largely PostgreSQL-portable at runtime.
- Migration risk includes both schema/data portability and **secret hygiene**.
- Residual coupling remains in `.env` values pointing `DATABASE_URL` at a **Supabase host** and legacy backup scripts with **hardcoded Supabase/Neon credentials**.
- Conclusion: **provider portability depends on secrets cleanup and rotation, not only on database abstraction.**

Use this entry as the bridge between architectural portability and operational security remediation.