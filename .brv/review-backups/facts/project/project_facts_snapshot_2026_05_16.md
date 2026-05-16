---
title: Project Facts Snapshot 2026-05-16
summary: Snapshot of current project facts covering stack, architecture organization, billing, database, auth, and curation workflow notes.
tags: []
related: [architecture/billing/context.md, architecture/database/context.md, facts/project/context.md]
keywords: []
createdAt: '2026-05-16T16:01:00.518Z'
updatedAt: '2026-05-16T16:01:00.518Z'
---
## Reason
Curate compact project facts from provided context into existing facts domain

## Raw Concept
**Task:**
Preserve high-level project facts and stack notes from the curated context.

**Changes:**
- Captured stack and architecture facts
- Recorded billing and auth implementation notes
- Preserved context-tree organization guidance

**Flow:**
context input -> fact extraction -> durable knowledge curation -> verification

**Timestamp:** 2026-05-16T16:00:54.434Z

**Author:** ByteRover context engineer

## Narrative
### Structure
The project knowledge base is split into domain-oriented documentation such as architecture, facts, and security instead of one large README.

### Dependencies
Billing and auth details rely on existing architecture knowledge for subscriptions, Stripe metadata, and public.users usage.

### Highlights
Current durable notes emphasize PostgreSQL, NextAuth Credentials, Resend, Stripe v21, optional planId handling, and Stripe price fallback behavior.

## Facts
- **database_stack**: The project uses PostgreSQL as its database stack. [project]
- **billing_model**: The billing architecture supports multi-plan subscriptions. [project]
- **billing_plan_id**: The planId field is optional in billing checkout and group creation flows. [project]
- **stripe_price_fallback**: Stripe price ID is used as a fallback when planId is absent. [project]
- **auth_provider**: Authentication uses NextAuth Credentials against public.users. [project]
- **knowledge_organization**: The project knowledge is organized by domain docs rather than a single monolithic README. [convention]
- **tech_stack**: The main documented stack includes PostgreSQL, NextAuth Credentials, Resend, and Stripe v21. [project]
