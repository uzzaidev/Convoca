---
title: RLM Approach Facts
summary: Curated factual statements from RLM context.
tags: []
related: []
keywords: []
createdAt: '2026-06-22T13:12:16.854Z'
updatedAt: '2026-06-22T13:12:16.854Z'
---
## Reason
Curate extracted facts using RLM approach

## Raw Concept
**Task:**
Curate RLM factual statements

**Changes:**
- Extracted and curated new facts

**Timestamp:** 2026-06-22T13:12:16.853Z

## Narrative
### Structure
Organized factual statements by subject after deduplication.

## Facts
- **scoring tiebreaker**: Fixed scoring tiebreaker persistence display bug.
- **scoring_configs.tiebreakers**: scoring_configs.tiebreakers JSONB was saved correctly in Postgres.
- **Postgres client**: Postgres client returned scoring_configs.tiebreakers as a JSON string in this environment.
- **existing code**: Existing code only accepted arrays.
- **GET /api/groups/[groupId]/scoring-config**: GET /api/groups/[groupId]/scoring-config and rankings/page code normalized the string to default tiebreakers after refresh.
- **normalizeTiebreakers function**: Added src/lib/scoring-tiebreakers.ts normalizeTiebreakers(raw) to parse string JSON, validate allowed keys, dedupe, enforce games_played vs games_played_asc exclusivity, and fallback to defaults.
- **scoring-config API**: Updated scoring-config API, rankings API, group page, and scoring config form to use normalizeTiebreakers.
- **group page**: Group page now selects tiebreakers and applies configured order when sorting general ranking ties.
