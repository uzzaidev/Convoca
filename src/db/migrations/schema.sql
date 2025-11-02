-- Peladeiros App - Database Schema
-- Fase 1: MVP Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  password_hash TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  privacy VARCHAR(20) DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
  photo_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Group members (with role)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_goalkeeper BOOLEAN DEFAULT FALSE,
  base_rating INTEGER DEFAULT 5 CHECK (base_rating >= 0 AND base_rating <= 10),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Venues (locations/quadras)
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events (partidas)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  starts_at TIMESTAMP NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  max_players INTEGER DEFAULT 10,
  max_goalkeepers INTEGER DEFAULT 2,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'canceled')),
  waitlist_enabled BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event attendance (RSVP + checkin)
CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'line' CHECK (role IN ('gk', 'line')),
  status VARCHAR(20) DEFAULT 'no' CHECK (status IN ('yes', 'no', 'waitlist', 'dm')),
  preferred_position VARCHAR(20) CHECK (preferred_position IN ('gk', 'defender', 'midfielder', 'forward')),
  secondary_position VARCHAR(20) CHECK (secondary_position IN ('gk', 'defender', 'midfielder', 'forward')),
  checked_in_at TIMESTAMP,
  order_of_arrival INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Teams (times sorteados para cada evento)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  seed INTEGER DEFAULT 0,
  is_winner BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team members (jogadores em cada time)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position VARCHAR(20) DEFAULT 'line' CHECK (position IN ('gk', 'defender', 'midfielder', 'forward', 'line')),
  starter BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Event actions (gols, assistências, etc)
CREATE TABLE IF NOT EXISTS event_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN (
    'goal', 'assist', 'save', 'tackle', 'error',
    'yellow_card', 'red_card', 'period_start', 'period_end'
  )),
  subject_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  minute INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Player ratings (avaliações pós-jogo)
CREATE TABLE IF NOT EXISTS player_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 10),
  tags TEXT[], -- ['mvp', 'pereba', 'paredao', 'garcom', etc]
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, rater_user_id, rated_user_id)
);

-- Invites (convites para grupos)
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wallets (carteiras - grupo e usuário)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type VARCHAR(10) CHECK (owner_type IN ('group', 'user')),
  owner_id UUID NOT NULL,
  balance_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Charges (cobranças)
CREATE TABLE IF NOT EXISTS charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('monthly', 'daily', 'fine', 'other')),
  amount_cents INTEGER NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_events_group ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_user ON event_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_event_actions_event ON event_actions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_actions_type ON event_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_player_ratings_event ON player_ratings(event_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_rated ON player_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_charges_user_status ON charges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_charges_due_date ON charges(due_date);

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

-- Materialized view for event scoreboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_event_scoreboard AS
SELECT
  ea.event_id,
  ea.team_id,
  t.name AS team_name,
  COUNT(CASE WHEN ea.action_type = 'goal' THEN 1 END) AS goals,
  COUNT(CASE WHEN ea.action_type = 'assist' THEN 1 END) AS assists
FROM event_actions ea
LEFT JOIN teams t ON ea.team_id = t.id
WHERE ea.action_type IN ('goal', 'assist')
GROUP BY ea.event_id, ea.team_id, t.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_scoreboard_event_team ON mv_event_scoreboard(event_id, team_id);

-- Function to refresh scoreboard
CREATE OR REPLACE FUNCTION refresh_event_scoreboard()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_event_scoreboard;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-refresh scoreboard
CREATE OR REPLACE TRIGGER trigger_refresh_scoreboard
AFTER INSERT OR UPDATE OR DELETE ON event_actions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_event_scoreboard();
