---
title: Project Facts Snapshot 2026-05-16
summary: Snapshot of current project facts including domains, stack, billing, auth, database, and backup-related knowledge.
tags: []
related: [architecture/billing/context.md, architecture/database/context.md, facts/project/context.md, architecture/context.md, security/context.md, architecture/billing/context.md, architecture/database/context.md, security/operations/context.md, facts/project/context.md]
keywords: []
createdAt: '2026-05-16T16:01:00.518Z'
updatedAt: '2026-05-16T16:01:42.323Z'
---
## Reason
Curate concise project facts extracted from the provided RLM context

## Raw Concept
**Task:**
Capture the current project knowledge snapshot from the RLM context

**Changes:**
- Captured stack and architecture facts
- Recorded billing and auth implementation notes
- Preserved context-tree organization guidance
- Captured snapshot metadata for the current project knowledge base
- Captured the active working module as a durable knowledge note
- Recorded current curated domains and topic coverage
- Preserved core architecture facts about database, billing, and authentication
- Preserved the project facts snapshot as durable knowledge
- Captured architecture, billing, auth, and database implementation facts
- Recorded the curation workflow note that this snapshot was curated from RLM context
- Collected current architecture, billing, auth, database, and security facts
- Recorded the latest project snapshot for durable recall
- Captured the latest project context snapshot for recall.
- Recorded the current snapshot date
- Preserved the latest curated knowledge inventory
- Recorded the current knowledge tree structure and major project facts
- Preserved stack, billing, authentication, and database details
- Captured discovered files, scripts, and key entities

**Files:**
- src/db/client.ts

**Flow:**
context provided -> facts extracted -> snapshot curated -> knowledge stored

**Timestamp:** 2026-05-16T16:01:29.853Z

**Author:** ByteRover context engineer

## Narrative
### Structure
This entry summarizes the live project knowledge snapshot and ties together the main documented areas currently present in the context tree.

### Dependencies
Relies on existing context tree topics for architecture, billing, database, authentication, and security operations.

### Highlights
As of 2026-05-16, the project knowledge emphasizes PostgreSQL portability, multi-plan billing, NextAuth credentials authentication, and backup-related operational scripts.

### Examples
Use this snapshot as the quick reference for current project facts and cross-cutting implementation details.

## Facts
- **context_tree_domains**: The context tree currently includes architecture, facts, and security/operations domains, plus domain docs for billing, database, provider migration, and backup credential exposure. [project]
- **database_stack**: The project database stack is built on PostgreSQL with portable/common features to reduce provider lock-in. [project]
- **billing_architecture**: Billing architecture supports multi-plan subscriptions and keeps planId optional, with fallback to STRIPE_PRICE_ID when absent. [project]
- **auth_flow**: The auth flow uses NextAuth Credentials against public.users, with custom signup and password reset via token and expiry fields. [project]
- **db_files**: Discovered files and scripts include src/db/client.ts, src/db/backup-supabase.sh, and src/db/backup-supabase.bat. [project]
- **key_entities**: Key entities include subscription_plans, group_subscriptions, public.users, Stripe v21, and Resend. [project]
