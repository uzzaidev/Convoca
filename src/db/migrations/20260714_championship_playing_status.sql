-- Adiciona status 'playing' em championship_matches para partidas ao vivo
-- Permite registrar início da partida antes do resultado final

ALTER TABLE championship_matches
  DROP CONSTRAINT IF EXISTS championship_matches_status_check;

ALTER TABLE championship_matches
  ADD CONSTRAINT championship_matches_status_check
  CHECK (status IN ('scheduled', 'playing', 'finished', 'cancelled'));
