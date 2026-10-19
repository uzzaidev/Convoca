---
title: Stripe Group Deletion Facts
summary: Facts about the deletion process for groups and associated Stripe subscriptions.
tags: []
related: []
keywords: []
createdAt: '2026-10-19T17:58:20.855Z'
updatedAt: '2026-10-19T17:58:20.855Z'
---
## Reason
Curating facts about Stripe group deletion architecture.

## Raw Concept
**Task:**
Documenting the Stripe group deletion process and its implications on billing.

**Files:**
- src/app/api/groups/[groupId]/route.ts
- src/app/(app)/dashboard/page.tsx

**Flow:**
Delete group -> Cancel subscriptions -> Update group status

**Timestamp:** 2026-10-19T17:58:20.852Z

## Narrative
### Structure
Details the API endpoints involved in group deletion and the associated billing implications.

### Highlights
Ensures subscriptions are canceled before group deletion occurs.

## Facts
- **group_deletion**: Soft-deleting a group in `DELETE /api/groups/[groupId]` must cancel all active/trialing/past_due Stripe subscriptions in `group_subscriptions` via `getStripe().subscriptions.cancel(...)` and set `status = "canceled", canceled_at = NOW()` before setting `groups.deleted_at = NOW()`. [project]
- **group_settings**: `GroupSettingsPage` (`/groups/[groupId]/settings`) passes `requireActiveGroup: false` to `requireGroupAccess` for admins of inactive/pending_payment groups. [project]
- **dashboard**: Users with `stripe_customer_id` have a `ManageStripeButton` ("Minhas Assinaturas") on `/dashboard` that opens the Stripe Customer Portal (`POST /api/stripe/portal`). [project]
- **event_deletion**: Event & Match Deletion: `DELETE /api/events/[eventId]?permanent=true` performs a hard delete (`DELETE FROM events`) cascading to attendance, teams, actions, ratings, and tiebreakers. [project]
