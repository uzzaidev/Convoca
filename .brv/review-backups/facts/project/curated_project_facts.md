---
title: Curated Project Facts
summary: Curated factual statements extracted from project context.
tags: []
related: []
keywords: []
createdAt: '2026-06-22T12:51:19.464Z'
updatedAt: '2026-06-22T12:51:19.464Z'
---
## Reason
Curate extracted facts for durable knowledge

## Raw Concept
**Task:**
Curate project facts

**Timestamp:** 2026-06-22T12:51:19.459Z

**Author:** Auto-curate

## Narrative
### Structure
Curated facts extracted and organized by subject.

### Highlights
Includes key project details and factual statements.

## Facts
- **SeasonManager**: Implemented season date handling fix.
- **SeasonManager**: Added src/lib/season-dates.ts to accept valid YYYY-MM-DD inputs from SeasonManager HTML date fields.
- **SeasonManager**: Normalize inputs to start/end-of-day timestamps in POST/PATCH season routes.
- **SeasonManager**: Changed season creation so ended historical seasons are not marked finished automatically.
- **SeasonManager**: Finished now remains reserved for the finish endpoint that creates season_snapshots.
- **SeasonManager**: SeasonManager now allows finishing any non-finished season whose start date has passed.
- **SeasonManager**: Labels such retroactive seasons as Aberta.
