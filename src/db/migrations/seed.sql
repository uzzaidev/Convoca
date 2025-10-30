-- Peladeiros App - Seed Data para Testes
-- Este arquivo cria dados de exemplo para visualizar o funcionamento completo da aplicação
--
-- ATENÇÃO: Execute este script apenas em ambiente de desenvolvimento/teste!
-- Ele irá DELETAR todos os dados existentes antes de inserir os dados de teste.
--
-- Para executar:
-- 1. No Neon Console: Copie e cole este conteúdo
-- 2. Ou via CLI: neon sql < seed.sql

-- Limpar dados existentes (cuidado!)
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
-- USUÁRIOS DE TESTE
-- ============================================================================
-- Senha para todos: "senha123" (hash bcrypt)
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

-- ============================================================================
-- GRUPOS
-- ============================================================================
INSERT INTO groups (id, name, description, privacy, created_by, created_at) VALUES
  ('aaaabbbb-cccc-dddd-eeee-111111111111', 'Pelada do Parque', 'Pelada de sábado no Parque da Cidade. Racha toda semana!', 'private', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '90 days'),
  ('aaaabbbb-cccc-dddd-eeee-222222222222', 'Futebol de Quinta', 'Racha de quinta-feira à noite. Jogadores experientes.', 'private', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '60 days');

-- ============================================================================
-- MEMBROS DOS GRUPOS
-- ============================================================================
-- Grupo 1: Pelada do Parque (12 membros)
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

-- Grupo 2: Futebol de Quinta (10 membros)
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

-- ============================================================================
-- VENUES (LOCAIS)
-- ============================================================================
INSERT INTO venues (id, group_id, name, address, created_at) VALUES
  ('venue111-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'Campo do Parque da Cidade', 'Av. Principal, 1000 - Parque da Cidade', NOW() - INTERVAL '90 days'),
  ('venue222-2222-2222-2222-222222222222', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'Society Vila Nova', 'Rua das Flores, 500 - Vila Nova', NOW() - INTERVAL '85 days'),
  ('venue333-3333-3333-3333-333333333333', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'Arena Sport Center', 'Av. Esportiva, 200 - Centro', NOW() - INTERVAL '60 days');

-- ============================================================================
-- EVENTOS (PELADAS)
-- ============================================================================

-- Eventos PASSADOS do Grupo 1 (últimos 2 meses)
INSERT INTO events (id, group_id, starts_at, venue_id, max_players, max_goalkeepers, status, created_by, created_at) VALUES
  -- Há 8 semanas
  ('event111-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '56 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '63 days'),
  -- Há 7 semanas
  ('event222-2222-2222-2222-222222222222', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '49 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '56 days'),
  -- Há 6 semanas
  ('event333-3333-3333-3333-333333333333', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '42 days', 'venue222-2222-2222-2222-222222222222', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '49 days'),
  -- Há 5 semanas
  ('event444-4444-4444-4444-444444444444', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '35 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '42 days'),
  -- Há 4 semanas
  ('event555-5555-5555-5555-555555555555', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '28 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '35 days'),
  -- Há 3 semanas
  ('event666-6666-6666-6666-666666666666', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '21 days', 'venue222-2222-2222-2222-222222222222', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '28 days'),
  -- Há 2 semanas
  ('event777-7777-7777-7777-777777777777', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '14 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '21 days'),
  -- Há 1 semana
  ('event888-8888-8888-8888-888888888888', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() - INTERVAL '7 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'finished', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '14 days');

-- Eventos FUTUROS do Grupo 1
INSERT INTO events (id, group_id, starts_at, venue_id, max_players, max_goalkeepers, status, created_by, created_at) VALUES
  -- Próximo sábado
  ('eventFUT1-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() + INTERVAL '6 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'scheduled', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
  -- Daqui a 2 semanas
  ('eventFUT2-2222-2222-2222-222222222222', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() + INTERVAL '13 days', 'venue222-2222-2222-2222-222222222222', 10, 2, 'scheduled', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day'),
  -- Daqui a 3 semanas
  ('eventFUT3-3333-3333-3333-333333333333', 'aaaabbbb-cccc-dddd-eeee-111111111111', NOW() + INTERVAL '20 days', 'venue111-1111-1111-1111-111111111111', 10, 2, 'scheduled', '11111111-1111-1111-1111-111111111111', NOW());

-- Eventos PASSADOS do Grupo 2
INSERT INTO events (id, group_id, starts_at, venue_id, max_players, max_goalkeepers, status, created_by, created_at) VALUES
  ('eventG2-1-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-222222222222', NOW() - INTERVAL '35 days', 'venue333-3333-3333-3333-333333333333', 10, 2, 'finished', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '42 days'),
  ('eventG2-2-2222-2222-2222-222222222222', 'aaaabbbb-cccc-dddd-eeee-222222222222', NOW() - INTERVAL '21 days', 'venue333-3333-3333-3333-333333333333', 10, 2, 'finished', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '28 days'),
  ('eventG2-3-3333-3333-3333-333333333333', 'aaaabbbb-cccc-dddd-eeee-222222222222', NOW() - INTERVAL '7 days', 'venue333-3333-3333-3333-333333333333', 10, 2, 'finished', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '14 days');

-- Eventos FUTUROS do Grupo 2
INSERT INTO events (id, group_id, starts_at, venue_id, max_players, max_goalkeepers, status, created_by, created_at) VALUES
  ('eventG2F1-1111-1111-1111-111111111111', 'aaaabbbb-cccc-dddd-eeee-222222222222', NOW() + INTERVAL '4 days', 'venue333-3333-3333-3333-333333333333', 10, 2, 'scheduled', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days');

-- ============================================================================
-- ATTENDANCE / RSVP
-- ============================================================================

-- Event 1 (há 8 semanas) - 10 jogadores confirmados
INSERT INTO event_attendance (event_id, user_id, role, status, checked_in_at, order_of_arrival) VALUES
  ('event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'line', 'yes', NOW() - INTERVAL '56 days', 1),
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'gk', 'yes', NOW() - INTERVAL '56 days', 2),
  ('event111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'line', 'yes', NOW() - INTERVAL '56 days', 3),
  ('event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'line', 'yes', NOW() - INTERVAL '56 days', 4),
  ('event111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'line', 'yes', NOW() - INTERVAL '56 days', 5),
  ('event111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'line', 'yes', NOW() - INTERVAL '56 days', 6),
  ('event111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'line', 'yes', NOW() - INTERVAL '56 days', 7),
  ('event111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'line', 'yes', NOW() - INTERVAL '56 days', 8),
  ('event111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'line', 'yes', NOW() - INTERVAL '56 days', 9),
  ('event111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'line', 'yes', NOW() - INTERVAL '56 days', 10);

-- Event 2 (há 7 semanas) - 10 jogadores
INSERT INTO event_attendance (event_id, user_id, role, status, checked_in_at, order_of_arrival) VALUES
  ('event222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'line', 'yes', NOW() - INTERVAL '49 days', 1),
  ('event222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'gk', 'yes', NOW() - INTERVAL '49 days', 2),
  ('event222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'line', 'yes', NOW() - INTERVAL '49 days', 3),
  ('event222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'line', 'yes', NOW() - INTERVAL '49 days', 4),
  ('event222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'line', 'yes', NOW() - INTERVAL '49 days', 5),
  ('event222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'line', 'yes', NOW() - INTERVAL '49 days', 6),
  ('event222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'line', 'yes', NOW() - INTERVAL '49 days', 7),
  ('event222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', 'line', 'yes', NOW() - INTERVAL '49 days', 8),
  ('event222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'line', 'yes', NOW() - INTERVAL '49 days', 9),
  ('event222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gk', 'yes', NOW() - INTERVAL '49 days', 10);

-- Event 3 (há 6 semanas) - 10 jogadores
INSERT INTO event_attendance (event_id, user_id, role, status, checked_in_at, order_of_arrival) VALUES
  ('event333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'line', 'yes', NOW() - INTERVAL '42 days', 1),
  ('event333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'gk', 'yes', NOW() - INTERVAL '42 days', 2),
  ('event333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'line', 'yes', NOW() - INTERVAL '42 days', 3),
  ('event333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'line', 'yes', NOW() - INTERVAL '42 days', 4),
  ('event333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'line', 'yes', NOW() - INTERVAL '42 days', 5),
  ('event333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'line', 'yes', NOW() - INTERVAL '42 days', 6),
  ('event333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'line', 'yes', NOW() - INTERVAL '42 days', 7),
  ('event333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888', 'line', 'yes', NOW() - INTERVAL '42 days', 8),
  ('event333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', 'line', 'yes', NOW() - INTERVAL '42 days', 9),
  ('event333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'line', 'yes', NOW() - INTERVAL '42 days', 10);

-- Eventos 4-8 (seguir mesmo padrão) - Simplificando para não ficar muito longo
-- Event 4
INSERT INTO event_attendance (event_id, user_id, role, status, checked_in_at, order_of_arrival) VALUES
  ('event444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'line', 'yes', NOW() - INTERVAL '35 days', 1),
  ('event444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'gk', 'yes', NOW() - INTERVAL '35 days', 2),
  ('event444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'line', 'yes', NOW() - INTERVAL '35 days', 3),
  ('event444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'line', 'yes', NOW() - INTERVAL '35 days', 4),
  ('event444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'line', 'yes', NOW() - INTERVAL '35 days', 5),
  ('event444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'line', 'yes', NOW() - INTERVAL '35 days', 6),
  ('event444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', 'line', 'yes', NOW() - INTERVAL '35 days', 7),
  ('event444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'line', 'yes', NOW() - INTERVAL '35 days', 8),
  ('event444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'line', 'yes', NOW() - INTERVAL '35 days', 9),
  ('event444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gk', 'yes', NOW() - INTERVAL '35 days', 10);

-- Event 8 (mais recente) - 10 jogadores
INSERT INTO event_attendance (event_id, user_id, role, status, checked_in_at, order_of_arrival) VALUES
  ('event888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'line', 'yes', NOW() - INTERVAL '7 days', 1),
  ('event888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'gk', 'yes', NOW() - INTERVAL '7 days', 2),
  ('event888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'line', 'yes', NOW() - INTERVAL '7 days', 3),
  ('event888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'line', 'yes', NOW() - INTERVAL '7 days', 4),
  ('event888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'line', 'yes', NOW() - INTERVAL '7 days', 5),
  ('event888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'line', 'yes', NOW() - INTERVAL '7 days', 6),
  ('event888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'line', 'yes', NOW() - INTERVAL '7 days', 7),
  ('event888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'line', 'yes', NOW() - INTERVAL '7 days', 8),
  ('event888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'line', 'yes', NOW() - INTERVAL '7 days', 9),
  ('event888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gk', 'yes', NOW() - INTERVAL '7 days', 10);

-- RSVP para próximos eventos (alguns confirmados, alguns na lista de espera)
INSERT INTO event_attendance (event_id, user_id, role, status) VALUES
  -- Próximo evento: 8 confirmados, 2 na waitlist
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

-- ============================================================================
-- TIMES SORTEADOS (apenas para eventos passados)
-- ============================================================================

-- Event 1: Time A vs Time B
INSERT INTO teams (id, event_id, name, seed, is_winner) VALUES
  ('teamA-event111-1111-1111-111111111111', 'event111-1111-1111-1111-111111111111', 'Time A', 1, true),
  ('teamB-event111-1111-1111-1111-111111111111', 'event111-1111-1111-1111-111111111111', 'Time B', 2, false);

INSERT INTO team_members (team_id, user_id, position) VALUES
  -- Time A (5 jogadores)
  ('teamA-event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'gk'),
  ('teamA-event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'line'),
  ('teamA-event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'line'),
  ('teamA-event111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'line'),
  ('teamA-event111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'line'),
  -- Time B (5 jogadores)
  ('teamB-event111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'line'),
  ('teamB-event111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'line'),
  ('teamB-event111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'line'),
  ('teamB-event111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'line'),
  ('teamB-event111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'line');

-- Event 8 (mais recente): Time A vs Time B
INSERT INTO teams (id, event_id, name, seed, is_winner) VALUES
  ('teamA-event888-8888-8888-888888888888', 'event888-8888-8888-8888-888888888888', 'Time A', 1, false),
  ('teamB-event888-8888-8888-888888888888', 'event888-8888-8888-8888-888888888888', 'Time B', 2, true);

INSERT INTO team_members (team_id, user_id, position) VALUES
  -- Time A
  ('teamA-event888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'gk'),
  ('teamA-event888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'line'),
  ('teamA-event888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'line'),
  ('teamA-event888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'line'),
  ('teamA-event888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'line'),
  -- Time B
  ('teamB-event888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gk'),
  ('teamB-event888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'line'),
  ('teamB-event888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'line'),
  ('teamB-event888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'line'),
  ('teamB-event888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'line');

-- ============================================================================
-- AÇÕES DE JOGO (GOLS, ASSISTÊNCIAS, ETC)
-- ============================================================================

-- Event 1: Time A 4 x 2 Time B
INSERT INTO event_actions (event_id, actor_user_id, action_type, subject_user_id, team_id, minute) VALUES
  -- Gols Time A
  ('event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'goal', NULL, 'teamA-event111-1111-1111-1111-111111111111', 5),
  ('event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'assist', '44444444-4444-4444-4444-444444444444', 'teamA-event111-1111-1111-1111-111111111111', 5),
  ('event111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'goal', NULL, 'teamA-event111-1111-1111-1111-111111111111', 12),
  ('event111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'goal', NULL, 'teamA-event111-1111-1111-1111-111111111111', 23),
  ('event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'assist', '77777777-7777-7777-7777-777777777777', 'teamA-event111-1111-1111-1111-111111111111', 23),
  ('event111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'goal', NULL, 'teamA-event111-1111-1111-1111-111111111111', 38),
  -- Gols Time B
  ('event111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'goal', NULL, 'teamB-event111-1111-1111-1111-111111111111', 18),
  ('event111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'assist', '99999999-9999-9999-9999-999999999999', 'teamB-event111-1111-1111-1111-111111111111', 18),
  ('event111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'goal', NULL, 'teamB-event111-1111-1111-1111-111111111111', 35),
  -- Defesas do goleiro
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'save', NULL, 'teamA-event111-1111-1111-1111-111111111111', 15),
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'save', NULL, 'teamA-event111-1111-1111-1111-111111111111', 28);

-- Event 8 (mais recente): Time A 3 x 4 Time B
INSERT INTO event_actions (event_id, actor_user_id, action_type, subject_user_id, team_id, minute) VALUES
  -- Gols Time A
  ('event888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'goal', NULL, 'teamA-event888-8888-8888-888888888888', 8),
  ('event888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'assist', '11111111-1111-1111-1111-111111111111', 'teamA-event888-8888-8888-888888888888', 8),
  ('event888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'goal', NULL, 'teamA-event888-8888-8888-888888888888', 15),
  ('event888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'goal', NULL, 'teamA-event888-8888-8888-888888888888', 30),
  -- Gols Time B
  ('event888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'goal', NULL, 'teamB-event888-8888-8888-888888888888', 10),
  ('event888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'assist', '44444444-4444-4444-4444-444444444444', 'teamB-event888-8888-8888-888888888888', 10),
  ('event888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'goal', NULL, 'teamB-event888-8888-8888-888888888888', 20),
  ('event888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'goal', NULL, 'teamB-event888-8888-8888-888888888888', 25),
  ('event888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'assist', '88888888-8888-8888-8888-888888888888', 'teamB-event888-8888-8888-888888888888', 25),
  ('event888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'goal', NULL, 'teamB-event888-8888-8888-888888888888', 40),
  -- Cartão amarelo
  ('event888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'yellow_card', NULL, 'teamA-event888-8888-8888-888888888888', 28),
  -- Defesas
  ('event888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'save', NULL, 'teamB-event888-8888-8888-888888888888', 12),
  ('event888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'save', NULL, 'teamB-event888-8888-8888-888888888888', 35);

-- ============================================================================
-- PLAYER RATINGS (AVALIAÇÕES)
-- ============================================================================

-- Event 1: Alguns jogadores avaliando outros
INSERT INTO player_ratings (event_id, rater_user_id, rated_user_id, score, tags) VALUES
  -- Avaliações do Carlos (11111111)
  ('event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 9, ARRAY['mvp', 'artilheiro']),
  ('event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 8, ARRAY['paredao']),
  ('event111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 7, ARRAY['guerreiro']),
  -- Avaliações do João (22222222)
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 9, ARRAY['mvp']),
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 8, ARRAY['garcom']),
  ('event111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 8, NULL);

-- Event 8: Avaliações recentes
INSERT INTO player_ratings (event_id, rater_user_id, rated_user_id, score, tags) VALUES
  -- Avaliações do jogo mais recente
  ('event888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 10, ARRAY['mvp', 'artilheiro', 'garcom']),
  ('event888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 9, ARRAY['craque']),
  ('event888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 10, ARRAY['mvp']),
  ('event888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 8, ARRAY['paredao']),
  ('event888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 9, ARRAY['artilheiro']),
  ('event888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', '99999999-9999-9999-9999-999999999999', 9, ARRAY['garcom']);

-- ============================================================================
-- WALLETS
-- ============================================================================
INSERT INTO wallets (owner_type, owner_id, balance_cents) VALUES
  -- Carteiras dos grupos
  ('group', 'aaaabbbb-cccc-dddd-eeee-111111111111', 25000), -- R$ 250,00
  ('group', 'aaaabbbb-cccc-dddd-eeee-222222222222', 18000), -- R$ 180,00
  -- Carteiras de alguns usuários
  ('user', '11111111-1111-1111-1111-111111111111', 5000),
  ('user', '22222222-2222-2222-2222-222222222222', 3000),
  ('user', '44444444-4444-4444-4444-444444444444', -2000); -- deve R$ 20,00

-- ============================================================================
-- INVITES
-- ============================================================================
INSERT INTO invites (group_id, code, created_by, expires_at, max_uses, used_count) VALUES
  ('aaaabbbb-cccc-dddd-eeee-111111111111', 'PARQUE2024', '11111111-1111-1111-1111-111111111111', NULL, NULL, 10),
  ('aaaabbbb-cccc-dddd-eeee-222222222222', 'QUINTA123', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '30 days', 20, 8);

-- ============================================================================
-- REFRESH MATERIALIZED VIEW
-- ============================================================================
REFRESH MATERIALIZED VIEW mv_event_scoreboard;

-- ============================================================================
-- VERIFICAÇÃO DOS DADOS
-- ============================================================================
SELECT
  'Usuários' as tabela,
  COUNT(*) as total
FROM users
UNION ALL
SELECT 'Grupos', COUNT(*) FROM groups
UNION ALL
SELECT 'Membros de Grupos', COUNT(*) FROM group_members
UNION ALL
SELECT 'Eventos', COUNT(*) FROM events
UNION ALL
SELECT 'RSVPs', COUNT(*) FROM event_attendance
UNION ALL
SELECT 'Times', COUNT(*) FROM teams
UNION ALL
SELECT 'Ações de Jogo', COUNT(*) FROM event_actions
UNION ALL
SELECT 'Avaliações', COUNT(*) FROM player_ratings;

-- ============================================================================
-- PRONTO!
-- ============================================================================
-- Agora você tem:
-- ✅ 15 usuários de teste (senha: senha123)
-- ✅ 2 grupos ativos
-- ✅ 8 eventos passados com jogos completos
-- ✅ 3-4 eventos futuros com RSVPs
-- ✅ Times sorteados
-- ✅ Gols, assistências, defesas registradas
-- ✅ Avaliações de jogadores
-- ✅ Dados para rankings e estatísticas
--
-- Faça login com qualquer dos emails acima (ex: carlos@test.com)
-- Senha: senha123
-- ============================================================================
