---
title: Season Finish Route Fix
summary: Fix for season finish route where snapshot insert failed TypeScript compilation. Adjusted types for better compatibility with PostgreSQL parameters.
tags: []
related: []
keywords: []
createdAt: '2026-06-23T14:09:44.797Z'
updatedAt: '2026-06-23T14:09:44.797Z'
---
## Reason
Documenting fix for season snapshot insert failure due to TypeScript compilation issues.

## Raw Concept
**Task:**
Documenting fix for TypeScript compilation issues in SQL template parameters.

**Changes:**
- Build fix for season finish route: season snapshot insert failed TypeScript compilation because sortedRankings was typed as Record<string, unknown>
- Replaced the loose RankingRow with a concrete typed shape for all selected columns
- Typed the query as sql<RankingRow[]> so insert parameters are accepted

**Flow:**
fixing compilation issues -> adjusting types -> ensuring parameter acceptance

**Timestamp:** 2026-06-23

**Author:** Development Team

## Narrative
### Structure
Fix addresses TypeScript compilation issues in the season finish route.

### Dependencies
Requires proper typing in the SQL query to avoid parameter inference issues.

### Highlights
Improved type safety and compatibility with PostgreSQL.

### Rules
Ensure all SQL parameters are properly typed to avoid inference issues.

### Examples
Example fix: Changed sortedRankings from Record<string, unknown> to a concrete typed shape.
