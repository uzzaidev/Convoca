---
title: Season Management
summary: Details on explicit season rows, ranking defaults, and validation in Convoca.
tags: []
related: []
keywords: []
createdAt: '2026-06-22T12:55:29.492Z'
updatedAt: '2026-06-22T12:55:29.492Z'
---
## Reason
Document season management in Convoca focusing on explicit season rows and ranking behavior.

## Raw Concept
**Task:**
Explain season management in Convoca

**Changes:**
- Clarified season row storage
- Specified ranking defaults
- Outlined datetime validation in SeasonManager

**Flow:**
store explicit season rows -> check active season -> process rankings -> validate dates

**Timestamp:** 2026-06-22

## Narrative
### Structure
SeasonManager handles explicit season rows without virtual/current-season fallback.

### Dependencies
Depends on accurate season row status to determine rankings.

### Highlights
Rankings default to active season; aggregates finished events otherwise.

### Rules
HTML date inputs used for season creation; date validation normalizes to timestamps.
