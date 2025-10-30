-- Add position preferences for event attendance
-- This allows players to select their preferred positions for team draw

-- Add columns to event_attendance table for position preferences
ALTER TABLE event_attendance
ADD COLUMN IF NOT EXISTS preferred_position VARCHAR(20) CHECK (preferred_position IN ('gk', 'defender', 'midfielder', 'forward')),
ADD COLUMN IF NOT EXISTS secondary_position VARCHAR(20) CHECK (secondary_position IN ('gk', 'defender', 'midfielder', 'forward'));

-- Create index for position-based queries
CREATE INDEX IF NOT EXISTS idx_event_attendance_positions ON event_attendance(event_id, preferred_position, secondary_position);

-- Add comment explaining the positions
COMMENT ON COLUMN event_attendance.preferred_position IS 'Primeira posição preferida do jogador (goleiro, zagueiro, meio-campo, atacante)';
COMMENT ON COLUMN event_attendance.secondary_position IS 'Segunda posição preferida do jogador como alternativa';
