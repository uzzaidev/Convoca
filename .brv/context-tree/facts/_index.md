---
children_hash: 314ccf18c42c44454066f0b115fbf2bc24137c70f13d402de3cc9aa32e9f3a8a
compression_ratio: 0.6306068601583114
condensation_order: 2
covers: [context.md, project/_index.md]
covers_token_total: 1516
summary_level: d2
token_count: 956
type: summary
---
## Level d2 Structural Summary

### facts domain
`context.md` defines the `facts` domain as a high-signal recall layer for standalone project facts. Its scope is intentionally narrow: technology choices, environment facts, operational facts, and stable implementation details, while excluding long-form design rationale and user-facing docs. Ownership is with Peladeiros engineering, and the domain exists to make durable facts easy to retrieve without broader architecture context.

### project facts cluster
The `project/_index.md` summary groups the project knowledge into three areas: general project facts, infrastructure/database/auth facts, and the RLM curation workflow. It also establishes that the knowledge base is organized by domain docs rather than a monolithic README, and highlights core references such as `src/db/client.ts`, `src/db/backup-supabase.sh`, and `src/db/backup-supabase.bat`.

#### `project_facts.md`
This is the broad factual baseline for the application. It preserves the main stack and structure: PostgreSQL as the primary database, Stripe v21 for billing, NextAuth Credentials against `public.users` for authentication, custom signup/password reset flows, and domain-oriented documentation layout. It also captures billing fallback behavior, core entities like `subscription_plans` and `group_subscriptions`, and the project’s curated knowledge organization.

#### `peladeiros_infrastructure_facts_2026_03_31.md`
This entry is the point-in-time infrastructure diagnosis. Key facts include no runtime Supabase SDK/API usage, raw SQL via `postgres` in `src/db/client.ts`, custom auth and recovery flows, provider portability mostly depending on `DATABASE_URL` plus schema/data migration, and reliance on standard PostgreSQL features like `uuid-ossp`, `JSONB`, `TEXT[]`, materialized views, `plpgsql`, and triggers. It also flags legacy backup scripts with hardcoded Supabase/Neon credentials as a security risk to rotate.

#### `peladeiros_billing_and_stripe_facts.md`
This is the primary billing and Stripe reference. It records Stripe v21 API migration effects, migration 006 support for `subscription_plans`, `plan_id`, and `stripe_price_id`, and the main API/UI surfaces for admin plans, public plans, group billing, checkout, and plan selection. It also preserves checkout fallback behavior to `STRIPE_PRICE_ID`, webhook persistence of billing identifiers, `cancel_at_period_end: true`, and the Windows SWC exit-code heuristic `3221225477`.

### RLM curation workflow cluster
The workflow entries define how knowledge should be curated when the context is already precomputed and small enough for single-pass handling.

#### `curate_workflow_rlm_approach.md`
This consolidated workflow entry says to reuse precomputed recon results, proceed directly to extraction in single-pass mode, deduplicate and group extracted facts, and verify using `result.summary` plus `result.applied[].filePath` rather than rereading files. It frames these rules as durable knowledge for future curation.

#### `rlm_curate_workflow_facts.md`
This shorter fact entry reinforces the same operational rules: do not repeat recon when already provided, use single-pass curation for small preprocessed contexts, and verify via `result.applied[].filePath`. It overlaps with the consolidated workflow entry as a compact factual snapshot.

### key relationships
- `context.md` is the top-level `facts` domain overview.
- `project_facts.md` provides the broad project baseline.
- `peladeiros_infrastructure_facts_2026_03_31.md` and `peladeiros_billing_and_stripe_facts.md` are the main drill-down points for infrastructure/auth/database and billing/Stripe.
- `curate_workflow_rlm_approach.md` and `rlm_curate_workflow_facts.md` document the operational rules for curating and verifying knowledge in this context tree.