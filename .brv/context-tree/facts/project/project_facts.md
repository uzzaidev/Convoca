---
title: Project Facts
summary: Project facts covering Convoca stack, billing, auth, database, and documentation organization.
tags: []
related: [architecture/context.md, security/context.md, architecture/billing/context.md, architecture/database/context.md, security/operations/context.md]
keywords: []
createdAt: '2026-05-16T15:52:49.980Z'
updatedAt: '2026-05-16T16:01:06.494Z'
---
## Reason
Curate extracted project facts from RLM context

## Raw Concept
**Task:**
Capture the main project facts and stack details described in the curated context.

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

**Files:**
- src/db/client.ts
- docs/02-architecture/PROJECT_SUMMARY.md
- docs/06-features/RANKING_LOGIC.md
- docs/06-features/PAYMENTS_GUIDE.md
- docs/06-features/ADMIN_MEMBER_SEPARATION.md

**Flow:**
context notes -> extract facts -> store in facts/project

**Timestamp:** 2026-05-16T16:00:59.860Z

**Author:** ByteRover context engineer

## Narrative
### Structure
This entry consolidates high-level project facts spanning persistence, billing, authentication, and documentation structure.

### Dependencies
Depends on the existing Convoca architecture and billing/auth context already present in the knowledge base.

### Highlights
As of 2026-05-16, the project stack and organizational conventions are documented for recall and curation.

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
