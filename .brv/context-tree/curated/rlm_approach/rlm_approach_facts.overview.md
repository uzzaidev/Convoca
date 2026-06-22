- Fixed scoring tiebreaker persistence display bug.
- scoring_configs.tiebreakers JSONB saved correctly in Postgres.
- Postgres client returned scoring_configs.tiebreakers as a JSON string.
- Existing code only accepted arrays.
- GET /api/groups/[groupId]/scoring-config normalized string to default tiebreakers.
- Added normalizeTiebreakers function to parse and validate JSON strings.
- Updated APIs and group page to use normalizeTiebreakers.

<structure>
- Reason: Curate extracted facts using RLM approach.
- Raw Concept: Task and changes related to RLM factual statements.
- Narrative: Organized factual statements by subject.
- Facts: Detailed factual statements regarding scoring tiebreakers and API updates.
</structure>

<entities>
- scoring tiebreaker
- scoring_configs.tiebreakers
- Postgres client
- GET /api/groups/[groupId]/scoring-config
- normalizeTiebreakers function
- scoring-config API
- group page
</entities>