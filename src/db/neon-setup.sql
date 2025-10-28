-- ============================================================================
-- Peladeiros App - Setup Completo para Neon
-- ============================================================================
-- COPIE TODO ESTE ARQUIVO e COLE no Neon SQL Editor
-- ============================================================================

-- PARTE 1: CRIAR TABELAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  password_hash TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  privacy VARCHAR(20) DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
  photo_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_goalkeeper BOOLEAN DEFAULT FALSE,
  base_rating INTEGER DEFAULT 5 CHECK (base_rating >= 0 AND base_rating <= 10),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'line' CHECK (role IN ('gk', 'line')),
  status VARCHAR(20) DEFAULT 'no' CHECK (status IN ('yes', 'no', 'waitlist')),
  checked_in_at TIMESTAMP,
  order_of_arrival INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  seed INTEGER DEFAULT 0,
  is_winner BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position VARCHAR(20) DEFAULT 'line' CHECK (position IN ('gk', 'line')),
  starter BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS player_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 10),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, rater_user_id, rated_user_id)
);

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type VARCHAR(10) CHECK (owner_type IN ('group', 'user')),
  owner_id UUID NOT NULL,
  balance_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('monthly', 'daily', 'fine', 'other')),
  amount_cents INTEGER NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,
  type VARCHAR(10) CHECK (type IN ('credit', 'debit')),
  amount_cents INTEGER NOT NULL,
  method VARCHAR(20) CHECK (method IN ('cash', 'pix', 'card', 'transfer', 'other')),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
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

-- Materialized view
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

CREATE OR REPLACE FUNCTION refresh_event_scoreboard()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_event_scoreboard;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_refresh_scoreboard ON event_actions;
CREATE TRIGGER trigger_refresh_scoreboard
AFTER INSERT OR UPDATE OR DELETE ON event_actions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_event_scoreboard();

-- ============================================================================
-- PARTE 2: LIMPAR DADOS (SE JÁ EXISTIREM)
-- ============================================================================

TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE charges CASCADE;
TRUNCATE TABLE wallets CASCADE;
TRUNCATE TABLE invites CASCADE;
TRUNCATE TABLE player_ratings CASCADE;
TRUNCATE TABLE event_actions CASCADE;
TRUNCATE TABLE team_members CASCADE;
TRUNCATE TABLE teams CASCADE;
TRUNCATE TABLE event_attendance CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE venues CASCADE;
TRUNCATE TABLE group_members CASCADE;
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE users CASCADE;

-- ============================================================================
-- PARTE 3: DADOS DE TESTE
-- ============================================================================

-- Usuários (senha: senha123)
INSERT INTO users (id, name, email, password_hash, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Carlos Silva', 'carlos@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '90 days'),
  ('22222222-2222-2222-2222-222222222222', 'João Santos', 'joao@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '85 days'),
  ('33333333-3333-3333-3333-333333333333', 'Pedro Costa', 'pedro@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '80 days'),
  ('44444444-4444-4444-4444-444444444444', 'Lucas Oliveira', 'lucas@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '75 days'),
  ('55555555-5555-5555-5555-555555555555', 'Fernando Lima', 'fernando@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '70 days'),
  ('66666666-6666-6666-6666-666666666666', 'Rafael Souza', 'rafael@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '65 days'),
  ('77777777-7777-7777-7777-777777777777', 'Marcelo Alves', 'marcelo@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '60 days'),
  ('88888888-8888-8888-8888-888888888888', 'Bruno Ferreira', 'bruno@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '55 days'),
  ('99999999-9999-9999-9999-999999999999', 'Diego Pereira', 'diego@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '50 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Thiago Rodrigues', 'thiago@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '45 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Gustavo Martins', 'gustavo@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '40 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'André Barbosa', 'andre@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '35 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Felipe Araújo', 'felipe@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '30 days'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Rodrigo Cunha', 'rodrigo@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '25 days'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Gabriel Rocha', 'gabriel@test.com', '$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2', NOW() - INTERVAL '20 days');

-- Grupos
INSERT INTO groups (id, name, description, privacy, created_by, created_at) VALUES
  ('aaaabbbb-cccc-dddd-eeee-111111111111', 'Pelada do Parque', 'Pelada de sábado no Parque da Cidade. Racha toda semana!', 'private', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '90 days'),
  ('aaaabbbb-cccc-dddd-eeee-222222222222', 'Futebol de Quinta', 'Racha de quinta-feira à noite. Jogadores experientes.', 'private', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '60 days');

-- Membros do Grupo 1
INSERT INTO group_members (user_id, group_id, role, is_goalkeeper, base_rating, joined_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'admin', false, 7, NOW() - INTERVAL '90 days'),
  ('22222222-2222-2222-2222-222222222222', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', true, 8, NOW() - INTERVAL '89 days'),
  ('33333333-3333-3333-3333-333333333333', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', false, 6, NOW() - INTERVAL '88 days'),
  ('44444444-4444-4444-4444-444444444444', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', false, 8, NOW() - INTERVAL '87 days'),
  ('55555555-5555-5555-5555-555555555555', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', false, 7, NOW() - INTERVAL '86 days'),
  ('66666666-6666-6666-6666-666666666666', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', false, 5, NOW() - INTERVAL '85 days'),
  ('77777777-7777-7777-7777-777777777777', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', false, 7, NOW() - INTERVAL '84 days'),
  ('88888888-8888-8888-8888-888888888888', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', false, 6, NOW() - INTERVAL '83 days'),
  ('99999999-9999-9999-9999-999999999999', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', false, 8, NOW() - INTERVAL '82 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', false, 7, NOW() - INTERVAL '81 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', true, 7, NOW() - INTERVAL '80 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'member', false, 6, NOW() - INTERVAL '79 days');

-- Membros do Grupo 2
INSERT INTO group_members (user_id, group_id, role, is_goalkeeper, base_rating, joined_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'admin', false, 8, NOW() - INTERVAL '60 days'),
  ('33333333-3333-3333-3333-333333333333', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'member', false, 7, NOW() - INTERVAL '59 days'),
  ('55555555-5555-5555-5555-555555555555', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'member', true, 8, NOW() - INTERVAL '58 days'),
  ('77777777-7777-7777-7777-777777777777', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'member', false, 7, NOW() - INTERVAL '57 days'),
  ('99999999-9999-9999-9999-999999999999', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'member', false, 6, NOW() - INTERVAL '56 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'member', false, 7, NOW() - INTERVAL '55 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'member', false, 8, NOW() - INTERVAL '54 days'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'member', true, 7, NOW() - INTERVAL '53 days'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'member', false, 6, NOW() - INTERVAL '52 days'),
  ('11111111-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'member', false, 7, NOW() - INTERVAL '51 days');

-- Venues
INSERT INTO venues (id, group_id, name, address, created_at) VALUES
  ('venue111-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'Campo do Parque da Cidade', 'Av. Principal, 1000', NOW() - INTERVAL '90 days'),
  ('venue222-2222-2222-2222-222222222222', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'Society Vila Nova', 'Rua das Flores, 500', NOW() - INTERVAL '85 days');

-- Eventos passados
INSERT INTO events (id, group_id, starts_at, venue_id, max_players, max_goalkeepers, status, created_by, created_at) VALUES
  ('event111-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '14 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '21 days'),
  ('event222-2222-2222-2222-222222222222', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '7 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '14 days');

-- Eventos futuros
INSERT INTO events (id, group_id, starts_at, venue_id, max_players, max_goalkeepers, status, created_by, created_at) VALUES
  ('eventFUT1-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() + INTERVAL '6 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'scheduled', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
  ('eventFUT2-2222-2222-2222-222222222222', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() + INTERVAL '13 days', 'venue222-2222-2222-2222-222222222222', 10, 2, 'scheduled', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day');

-- Attendance
INSERT INTO event_attendance (event_id, user_id, role, status, checked_in_at, order_of_arrival) VALUES
  ('event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'line', 'yes', NOW() - INTERVAL '14 days', 1),
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'gk', 'yes', NOW() - INTERVAL '14 days', 2),
  ('event111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'line', 'yes', NOW() - INTERVAL '14 days', 3),
  ('event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'line', 'yes', NOW() - INTERVAL '14 days', 4),
  ('event111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'line', 'yes', NOW() - INTERVAL '14 days', 5),
  ('event111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'line', 'yes', NOW() - INTERVAL '14 days', 6),
  ('event111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'line', 'yes', NOW() - INTERVAL '14 days', 7),
  ('event111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'line', 'yes', NOW() - INTERVAL '14 days', 8),
  ('event111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'line', 'yes', NOW() - INTERVAL '14 days', 9),
  ('event111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'line', 'yes', NOW() - INTERVAL '14 days', 10);

INSERT INTO event_attendance (event_id, user_id, role, status) VALUES
  ('eventFUT1-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'line', 'yes'),
  ('eventFUT1-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'gk', 'yes'),
  ('eventFUT1-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'line', 'yes'),
  ('eventFUT1-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'line', 'yes'),
  ('eventFUT1-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'line', 'yes'),
  ('eventFUT1-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'line', 'yes'),
  ('eventFUT1-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'line', 'yes'),
  ('eventFUT1-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'line', 'yes'),
  ('eventFUT1-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'line', 'waitlist'),
  ('eventFUT1-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'line', 'waitlist');

-- Times
INSERT INTO teams (id, event_id, name, seed, is_winner) VALUES
  ('teamA-event111-1111-1111-111111111111', 'event111-1111-1111-1111-111111111111', 'Time A', 1, true),
  ('teamB-event111-1111-1111-1111-111111', 'event111-1111-1111-1111-111111111111', 'Time B', 2, false);

INSERT INTO team_members (team_id, user_id, position) VALUES
  ('teamA-event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'gk'),
  ('teamA-event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'line'),
  ('teamA-event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'line'),
  ('teamA-event111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'line'),
  ('teamA-event111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'line'),
  ('teamB-event111-1111-1111-1111-111111', '33333333-3333-3333-3333-333333333333', 'line'),
  ('teamB-event111-1111-1111-1111-111111', '66666666-6666-6666-6666-666666666666', 'line'),
  ('teamB-event111-1111-1111-1111-111111', '88888888-8888-8888-8888-888888888888', 'line'),
  ('teamB-event111-1111-1111-1111-111111', '99999999-9999-9999-9999-999999999999', 'line'),
  ('teamB-event111-1111-1111-1111-111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'line');

-- Ações de jogo (Time A 4 x 2 Time B)
INSERT INTO event_actions (event_id, actor_user_id, action_type, subject_user_id, team_id, minute) VALUES
  ('event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'goal', NULL, 'teamA-event111-1111-1111-1111-111111111111', 5),
  ('event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'assist', '44444444-4444-4444-4444-444444444444', 'teamA-event111-1111-1111-1111-111111111111', 5),
  ('event111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'goal', NULL, 'teamA-event111-1111-1111-1111-111111111111', 12),
  ('event111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'goal', NULL, 'teamA-event111-1111-1111-1111-111111111111', 23),
  ('event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'assist', '77777777-7777-7777-7777-777777777777', 'teamA-event111-1111-1111-1111-111111111111', 23),
  ('event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'goal', NULL, 'teamA-event111-1111-1111-1111-111111111111', 38),
  ('event111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'goal', NULL, 'teamB-event111-1111-1111-1111-111111', 18),
  ('event111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'assist', '99999999-9999-9999-9999-999999999999', 'teamB-event111-1111-1111-1111-111111', 18),
  ('event111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'goal', NULL, 'teamB-event111-1111-1111-1111-111111', 35),
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'save', NULL, 'teamA-event111-1111-1111-1111-111111111111', 15),
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'save', NULL, 'teamA-event111-1111-1111-1111-111111111111', 28);

-- Avaliações
INSERT INTO player_ratings (event_id, rater_user_id, rated_user_id, score, tags) VALUES
  ('event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 9, ARRAY['mvp', 'artilheiro']),
  ('event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 8, ARRAY['paredao']),
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 9, ARRAY['mvp']),
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 8, ARRAY['garcom']);

-- Wallets
INSERT INTO wallets (owner_type, owner_id, balance_cents) VALUES
  ('group', 'aaaabbbb-cccc-dddd-eeee-111111111111', 25000),
  ('group', 'aaaabbbb-cccc-dddd-eeee-222222222222', 18000);

-- Invites
INSERT INTO invites (group_id, code, created_by, expires_at, max_uses, used_count) VALUES
  ('aaaabbbb-cccc-dddd-eeee-111111111111', 'PARQUE2024', '11111111-1111-1111-1111-111111111111', NULL, NULL, 10);

-- Refresh view
REFRESH MATERIALIZED VIEW mv_event_scoreboard;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT 'Usuários' as tabela, COUNT(*) as total FROM users
UNION ALL SELECT 'Grupos', COUNT(*) FROM groups
UNION ALL SELECT 'Membros', COUNT(*) FROM group_members
UNION ALL SELECT 'Eventos', COUNT(*) FROM events
UNION ALL SELECT 'RSVPs', COUNT(*) FROM event_attendance
UNION ALL SELECT 'Times', COUNT(*) FROM teams
UNION ALL SELECT 'Ações', COUNT(*) FROM event_actions
UNION ALL SELECT 'Avaliações', COUNT(*) FROM player_ratings;

-- ============================================================================
-- Login: carlos@test.com | Senha: senha123
-- ============================================================================
