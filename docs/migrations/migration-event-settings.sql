-- Migration: Add event_settings and update draw_configs tables
-- Date: 2025-01-01
-- Description: Add event settings table and update draw configs for better event management

-- Event settings (configurações de eventos por grupo)
CREATE TABLE IF NOT EXISTS event_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  min_players INTEGER DEFAULT 4 CHECK (min_players >= 1 AND min_players <= 22),
  max_players INTEGER DEFAULT 22 CHECK (max_players >= 1 AND max_players <= 50),
  max_waitlist INTEGER DEFAULT 10 CHECK (max_waitlist >= 0 AND max_waitlist <= 50),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_event_settings_group ON event_settings(group_id);

-- Update events table to have more flexible defaults
-- (This will only affect new events, existing ones keep their values)
ALTER TABLE events ALTER COLUMN max_players SET DEFAULT 22;

-- Insert default event settings for existing groups
INSERT INTO event_settings (group_id, min_players, max_players, max_waitlist)
SELECT
  g.id,
  4,  -- min_players
  22, -- max_players
  10  -- max_waitlist
FROM groups g
WHERE NOT EXISTS (
  SELECT 1 FROM event_settings es WHERE es.group_id = g.id
);