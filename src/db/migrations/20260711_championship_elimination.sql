-- ============================================================
-- Módulo Eliminatórias — suporte a single_elimination
-- 2026-07-11
-- ============================================================
-- Aplique com: pnpm db:migrate -- --only 20260711_championship_elimination.sql
-- ============================================================

-- Nome da rodada para exibição no bracket (ex: "Final", "Semifinais")
ALTER TABLE championship_rounds ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Posição da partida dentro da rodada (para rastrear bracket e auto-avançar vencedor)
ALTER TABLE championship_matches ADD COLUMN IF NOT EXISTS match_position INTEGER;

-- Permite times nulos (TBD) em slots futuros do bracket de eliminação
ALTER TABLE championship_matches ALTER COLUMN home_team_id DROP NOT NULL;
ALTER TABLE championship_matches ALTER COLUMN away_team_id DROP NOT NULL;
