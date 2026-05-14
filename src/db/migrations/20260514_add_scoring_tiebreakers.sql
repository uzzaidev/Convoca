-- Add configurable tiebreaker criteria to scoring_configs.
-- Each item is one of: 'wins', 'goal_difference', 'goals', 'games_played',
-- 'games_played_asc' (fewer games first), 'assists', 'mvp_count'.
-- The array is applied in order, after the main 'points DESC' sort.
BEGIN;

ALTER TABLE scoring_configs
ADD COLUMN IF NOT EXISTS tiebreakers JSONB
NOT NULL DEFAULT '["wins", "goal_difference", "goals", "games_played"]'::jsonb;

COMMIT;
