-- Migration: Add draw_configs table
-- Date: 2025-01-01
-- Description: Add table to store draw configuration settings per group

-- Draw configurations (configurações de sorteio por grupo)
CREATE TABLE IF NOT EXISTS draw_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  players_per_team INTEGER DEFAULT 7 CHECK (players_per_team >= 1 AND players_per_team <= 22),
  reserves_per_team INTEGER DEFAULT 2 CHECK (reserves_per_team >= 0 AND reserves_per_team <= 11),
  gk_count INTEGER DEFAULT 1 CHECK (gk_count >= 0 AND gk_count <= 5),
  defender_count INTEGER DEFAULT 2 CHECK (defender_count >= 0 AND defender_count <= 11),
  midfielder_count INTEGER DEFAULT 2 CHECK (midfielder_count >= 0 AND midfielder_count <= 11),
  forward_count INTEGER DEFAULT 2 CHECK (forward_count >= 0 AND forward_count <= 11),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_draw_configs_group ON draw_configs(group_id);