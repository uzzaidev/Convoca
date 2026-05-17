---
children_hash: 84402664d60e77a6e8e6258544bef4281f4bb5752ffb252dd654a80e8880821d
compression_ratio: 0.262315021285222
condensation_order: 1
covers: [context.md, curate_workflow_rlm_approach.md, peladeiros_billing_and_stripe_facts.md, peladeiros_infrastructure_facts_2026_03_31.md, project_facts.md, rlm_curate_workflow_facts.md]
covers_token_total: 4933
summary_level: d1
token_count: 1294
type: summary
---
# d1 Structural Summary

## Overview
These entries split into three knowledge areas: general project facts, infrastructure/database/auth facts, and the RLM curation workflow. Together they document the project’s stack, billing behavior, portability constraints, operational risks, and the rules for how future knowledge curation should be performed.

## Project Facts
### `context.md`
A compact topic entry for `facts/project` that captures the current factual snapshot of Peladeiros/Convoca infrastructure and implementation choices. It points readers toward deeper drill-down in `architecture/database` and `security/operations`, and serves as the top-level facts entry for the project’s durable knowledge.

### `project_facts.md`
The broad project fact base summarizing the application stack and documentation organization. Key preserved facts include:
- PostgreSQL is the primary database, with an emphasis on portability across providers.
- Billing uses Stripe v21 with multi-plan subscriptions and optional `planId` support.
- Authentication uses NextAuth Credentials against `public.users`, with custom signup and password reset flows.
- The knowledge base is organized into domain docs such as architecture, facts, and security rather than a monolithic README.
- Core entities and scripts include `subscription_plans`, `group_subscriptions`, `src/db/client.ts`, `src/db/backup-supabase.sh`, and `src/db/backup-supabase.bat`.

This entry also records snapshot-level knowledge about the current API surface, billing fallback behavior, and the overall curated domain structure.

## Infrastructure and Implementation Facts
### `peladeiros_infrastructure_facts_2026_03_31.md`
A point-in-time infrastructure diagnosis from 2026-03-31. It captures:
- No runtime Supabase SDK/API usage for auth or storage.
- Auth is implemented with NextAuth Credentials and raw SQL against `public.users`.
- Signup and password recovery are custom flows using internal routes and email delivery via Resend.
- Database access uses the generic `postgres` library in `src/db/client.ts`.
- Provider migration is mostly a `DATABASE_URL` change plus schema/data movement.
- The schema relies on standard PostgreSQL features such as `uuid-ossp`, `JSONB`, `TEXT[]`, materialized views, `plpgsql`, and triggers.
- Legacy backup scripts still exist, and some contain hardcoded Supabase/Neon credentials that should be rotated.

This entry is the main drill-down for auth/database portability and backup credential exposure.

### `peladeiros_billing_and_stripe_facts.md`
A billing and Stripe fact collection focused on Stripe v21 migration, multi-plan subscriptions, and build diagnostics. It preserves:
- Stripe v21 API changes, including renamed or relocated fields and methods.
- Subscription plan schema support via migration 006, including `subscription_plans`, `plan_id`, and `stripe_price_id`.
- API locations for admin plans, public plans, group billing, checkout, and group creation checkout flow.
- UI locations for plan selection, group billing, and admin plans tabs.
- Checkout fallback behavior to `STRIPE_PRICE_ID` when `planId` is absent or invalid.
- Webhook persistence of `plan_id` and `stripe_price_id`.
- Subscription policy details such as `cancel_at_period_end: true`.
- A Windows-specific build heuristic where exit code `3221225477` indicates SWC DLL initialization failure rather than a real app build error.

This is the primary billing/Stripe reference entry and links to the Stripe migration and subscription system topics.

## RLM Curation Workflow
### `curate_workflow_rlm_approach.md`
A consolidated workflow entry describing how RLM-based curation should process small, precomputed single-pass contexts. It emphasizes:
- Use precomputed recon results instead of calling recon again.
- Proceed directly to extraction in single-pass mode.
- Deduplicate and group extracted facts before curating.
- Verify using `result.summary` and `result.applied[].filePath`, not by rereading files.
- Preserve workflow constraints as durable knowledge for future curation.

It also records that the current context is small enough for single-pass handling and that verification must not rely on `readFile`.

### `rlm_curate_workflow_facts.md`
A more concise fact entry for the same curation workflow rules. It reinforces:
- Single-pass curation when recon suggests it.
- Precomputed recon must not be repeated.
- Verification must use `result.applied[].filePath`.
- The context is a small, preprocessed curation task.

This entry overlaps with the consolidated workflow knowledge and functions as a factual snapshot of the curation process.

## Key Relationships
- `context.md` provides the top-level `facts/project` overview, while `project_facts.md` and the two dated fact entries supply the detailed durable facts underneath it.
- `peladeiros_infrastructure_facts_2026_03_31.md` and `peladeiros_billing_and_stripe_facts.md` are the main drill-down points for infrastructure and billing/Stripe knowledge.
- The workflow entries (`curate_workflow_rlm_approach.md` and `rlm_curate_workflow_facts.md`) document the operational rules for how this knowledge base is curated and verified.