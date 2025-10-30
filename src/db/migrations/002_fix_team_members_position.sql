-- Fix team_members position constraint to allow detailed positions
-- This allows storing the actual positions instead of just 'gk' or 'line'

-- Drop the old constraint
ALTER TABLE team_members
DROP CONSTRAINT IF EXISTS team_members_position_check;

-- Add new constraint with detailed positions
ALTER TABLE team_members
ADD CONSTRAINT team_members_position_check 
CHECK (position IN ('gk', 'defender', 'midfielder', 'forward', 'line'));

-- Add comment explaining the positions
COMMENT ON COLUMN team_members.position IS 'Posição do jogador no time (goleiro, zagueiro, meio-campo, atacante, ou linha genérica)';
