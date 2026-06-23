---
title: Curated Facts
summary: Curated factual statements extracted from context.
tags: []
related: []
keywords: []
createdAt: '2026-06-23T13:58:43.191Z'
updatedAt: '2026-06-23T13:58:43.191Z'
---
## Reason
Curate from RLM context

## Raw Concept
**Task:**
Curate factual statements

**Timestamp:** 2026-06-23T13:58:43.189Z

## Narrative
### Structure
Curated facts organized by subject

### Highlights
Extraction and deduplication successful

## Facts
- **Convoca**: Season finish route used groups.draw_config, but production schema has no draw_config column on groups.
- **Convoca**: Switched to scoring_configs and applied configured tiebreakers when snapshot ordering is frozen.
- **Convoca**: Frequency views were incorrectly counting presence only when event_attendance.checked_in_at was non-null.
- **Convoca**: Real data had many status='yes' rows with checked_in_at null, so frequency displayed 0%.
- **Convoca**: Updated group page, rankings route, and stats route to count status='yes' as participation and keep DM excluded from percentage denominator.
- **Convoca**: Goalkeeper tab previously ranked by save actions.
- **Convoca**: Changed it to rank actual goalkeepers (event_attendance.role='gk') by goals conceded ascending.
- **Convoca**: Using the team assigned in that event to compute goals suffered including own goals.
