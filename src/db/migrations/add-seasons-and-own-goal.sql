-- Migration: Temporadas (Seasons) + Gols Contra (Own Goals)
-- Data: 2026-03-19

-- 1. Adicionar 'own_goal' ao CHECK constraint de event_actions
ALTER TABLE event_actions DROP CONSTRAINT IF EXISTS event_actions_action_type_check;
ALTER TABLE event_actions ADD CONSTRAINT event_actions_action_type_check
  CHECK (action_type IN (
    'goal', 'assist', 'save', 'tackle', 'error',
    'yellow_card', 'red_card', 'period_start', 'period_end', 'own_goal'
  ));

-- 2. Criar tabela de temporadas
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('active', 'finished', 'upcoming')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_seasons_group ON seasons(group_id);
CREATE INDEX IF NOT EXISTS idx_seasons_group_status ON seasons(group_id, status);

-- 3. Criar tabela de snapshots de ranking por temporada
CREATE TABLE IF NOT EXISTS season_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  own_goals INTEGER NOT NULL DEFAULT 0,
  mvp_count INTEGER NOT NULL DEFAULT 0,
  team_goals INTEGER NOT NULL DEFAULT 0,
  goals_conceded INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  player_name VARCHAR(255),
  player_image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(season_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_season_snapshots_season ON season_snapshots(season_id);

-- 4. Recriar materialized view com suporte a own_goal
DROP MATERIALIZED VIEW IF EXISTS mv_event_scoreboard;

CREATE MATERIALIZED VIEW mv_event_scoreboard AS
SELECT
  ea.event_id,
  ea.team_id,
  t.name AS team_name,
  COUNT(CASE WHEN ea.action_type = 'goal' THEN 1 END) AS goals,
  COUNT(CASE WHEN ea.action_type = 'assist' THEN 1 END) AS assists,
  COUNT(CASE WHEN ea.action_type = 'own_goal' THEN 1 END) AS own_goals
FROM event_actions ea
LEFT JOIN teams t ON ea.team_id = t.id
WHERE ea.action_type IN ('goal', 'assist', 'own_goal')
GROUP BY ea.event_id, ea.team_id, t.name;

CREATE UNIQUE INDEX idx_mv_scoreboard_event_team ON mv_event_scoreboard(event_id, team_id);
