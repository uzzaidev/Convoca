---
consolidated_at: '2026-05-16T16:17:53.095Z'
consolidated_from: [{date: '2026-05-16T16:17:53.095Z', path: facts/project/project_facts_snapshot_2026_05_16.md, reason: 'These are overlapping project fact snapshots for the same date and domain, both summarizing the Convoca stack, billing, authentication, database portability, and documentation structure. The snapshot file is a narrower point-in-time derivative of the broader project_facts file, so they should be consolidated to avoid duplication.'}]
---
## Reason
Curate extracted project facts from RLM context, preserving the broader project fact base and the 2026-05-16 snapshot details.

## Raw Concept
**Task:**
Capture the main project facts and stack details described in the curated context, including the latest durable snapshot.

**Changes:**
- Identified Stripe billing and API migration as key project knowledge areas
- Identified PostgreSQL as a documented infrastructure fact
- Identified authentication and backup credential exposure as documented topics
- Captured the documented application stack.
- Recorded the knowledge organization approach.
- Recorded discovered database and backup-related scripts.
- Documented draw config, event settings, rankings, finances, invites, RSVP, voting, actions, search, lifecycle, SQL, and validation patterns
- Captured the current API surface and storage tables described in the context
- Preserved operational rules such as waitlist promotion, voting constraints, and error handling behavior
- Captured database portability guidance
- Captured billing subscription behavior
- Captured authentication and documentation structure facts
- Captured the core stack and architectural facts.
- Recorded billing fallback behavior and authentication design.
- Preserved the documentation organization pattern and curated knowledge areas.
- Documented the database portability preference.
- Recorded billing and subscription behavior.
- Captured auth, stack, and documentation structure facts.
- Captured the current project knowledge snapshot from the RLM context.
- Preserved the live project knowledge inventory as a point-in-time snapshot dated 2026-05-16.
- Recorded current curated domains and topic coverage.
- Preserved architecture, billing, auth, database, and security facts.
- Captured discovered files, scripts, and key entities.

**Files:**
- src/db/client.ts
- docs/02-architecture/PROJECT_SUMMARY.md
- docs/06-features/RANKING_LOGIC.md
- docs/06-features/PAYMENTS_GUIDE.md
- docs/06-features/ADMIN_MEMBER_SEPARATION.md
- src/db/backup-supabase.sh
- src/db/backup-supabase.bat

**Flow:**
context notes -> extract facts -> store in facts/project

**Timestamp:** 2026-05-16T16:00:59.860Z

**Author:** ByteRover context engineer

## Narrative
### Structure
This entry consolidates high-level project facts spanning persistence, billing, authentication, documentation structure, and the latest durable snapshot of the project knowledge base.

### Dependencies
Depends on the existing Convoca architecture and billing/auth context already present in the knowledge base, plus the live context-tree inventory as of 2026-05-16.

### Highlights
As of 2026-05-16, the project stack and organizational conventions are documented for recall and curation. The live snapshot emphasizes PostgreSQL portability, multi-plan billing, NextAuth Credentials authentication, and backup-related operational scripts.

### Rules
Do not treat the project as documented in a single monolithic README; use domain-based context entries instead.

### Examples
Examples include /api/groups/[groupId]/draw-config, /api/events/[eventId]/teams/swap, /api/groups/[groupId]/my-stats, and /api/users/search?q=email_or_name.

## Facts
- **database**: The project uses PostgreSQL and aims to keep database features portable across providers. [project]
- **billing**: Billing architecture supports multi-plan subscriptions with optional planId and Stripe price fallback. [project]
- **authentication**: Authentication uses NextAuth Credentials against public.users with custom signup and password reset flows. [project]
- **tech_stack**: The stack includes Stripe v21 and Resend. [project]
- **documentation_structure**: Project knowledge is organized into domain docs such as architecture, facts, and security rather than a single monolithic README. [project]
- **context_tree_domains**: The context tree currently includes architecture, facts, and security/operations domains, plus domain docs for billing, database, provider migration, and backup credential exposure. [project]
- **database_stack**: The project database stack is built on PostgreSQL with portable/common features to reduce provider lock-in. [project]
- **billing_architecture_snapshot**: Billing architecture supports multi-plan subscriptions and keeps planId optional, with fallback to STRIPE_PRICE_ID when absent. [project]
- **auth_flow_snapshot**: The auth flow uses NextAuth Credentials against public.users, with custom signup and password reset via token and expiry fields. [project]
- **db_files_snapshot**: Discovered files and scripts include src/db/client.ts, src/db/backup-supabase.sh, and src/db/backup-supabase.bat. [project]
- **key_entities_snapshot**: Key entities include subscription_plans, group_subscriptions, public.users, Stripe v21, and Resend. [project]