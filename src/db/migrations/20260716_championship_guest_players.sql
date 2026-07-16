-- Allow championship team players without a user account (guest players)
ALTER TABLE championship_team_players
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ALTER COLUMN user_id DROP NOT NULL;

-- Either user_id or guest_name must be set
ALTER TABLE championship_team_players
  ADD CONSTRAINT chk_player_identity
  CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_name <> ''));
