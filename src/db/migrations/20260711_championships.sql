-- ============================================================
-- Módulo de Campeonatos — Phase 1: Schema foundation
-- 2026-07-11
-- ============================================================
-- Aplique com: pnpm db:migrate -- --only 20260711_championships.sql
-- ============================================================

-- championships (campeonatos vinculados a grupos)
CREATE TABLE IF NOT EXISTS championships (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id         UUID         NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  format           VARCHAR(30)  NOT NULL DEFAULT 'round_robin'
                   CHECK (format IN ('round_robin', 'single_elimination', 'double_elimination', 'mixed')),
  team_formation   VARCHAR(20)  NOT NULL DEFAULT 'manual'
                   CHECK (team_formation IN ('manual', 'draw')),
  status           VARCHAR(20)  NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'active', 'finished', 'cancelled')),
  starts_at        DATE,
  ends_at          DATE,
  venue_id         UUID         REFERENCES venues(id) ON DELETE SET NULL,
  -- Regra "X minutos ou Y gols de diferença" — configurável por admin/capitão
  match_duration_minutes  INTEGER NOT NULL DEFAULT 10  CHECK (match_duration_minutes > 0),
  match_win_goal_diff     INTEGER NOT NULL DEFAULT 2   CHECK (match_win_goal_diff > 0),
  can_captain_edit_rules  BOOLEAN NOT NULL DEFAULT FALSE,
  -- Pontuação da tabela (pode divergir do scoring_configs da pelada)
  points_win       INTEGER      NOT NULL DEFAULT 3 CHECK (points_win >= 0),
  points_draw      INTEGER      NOT NULL DEFAULT 1 CHECK (points_draw >= 0),
  points_loss      INTEGER      NOT NULL DEFAULT 0 CHECK (points_loss >= 0),
  created_by       UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- championship_phases (fases: grupos, oitavas, semis, final…)
-- MVP usa apenas uma fase 'group_stage' por campeonato.
-- A tabela existe agora para que a V2 (mata-mata) não precise de refatoração.
CREATE TABLE IF NOT EXISTS championship_phases (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id   UUID        NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  phase_type        VARCHAR(30) NOT NULL DEFAULT 'group_stage'
                    CHECK (phase_type IN (
                      'group_stage', 'round_of_16', 'quarterfinals',
                      'semifinals', 'third_place', 'final'
                    )),
  name              VARCHAR(100) NOT NULL,
  "order"           INTEGER      NOT NULL DEFAULT 1,
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'finished')),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- championship_teams (times PERSISTENTES do campeonato)
-- Separados de 'teams' (efêmeros por sorteio de evento).
-- Sem limite de quantidade; mesmo nome permitido em campeonatos distintos.
CREATE TABLE IF NOT EXISTS championship_teams (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id  UUID         NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  color            VARCHAR(20)  NOT NULL DEFAULT '#6b7280',
  seed             INTEGER,     -- cabeça de chave para sorteio de grupos (futuro)
  is_bye           BOOLEAN      NOT NULL DEFAULT FALSE, -- time virtual para N ímpar
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- championship_team_players (jogadores de cada time do campeonato)
-- UNIQUE por time: mesmo jogador não pode aparecer duas vezes no mesmo time.
-- Um jogador em dois times do mesmo campeonato é bloqueado via trigger.
CREATE TABLE IF NOT EXISTS championship_team_players (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_team_id  UUID        NOT NULL REFERENCES championship_teams(id) ON DELETE CASCADE,
  user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_captain            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (championship_team_id, user_id)
);

-- Trigger: impede jogador em dois times do mesmo campeonato
CREATE OR REPLACE FUNCTION check_player_single_team_per_championship()
RETURNS TRIGGER AS $$
DECLARE
  v_championship_id UUID;
BEGIN
  SELECT championship_id INTO v_championship_id
  FROM championship_teams
  WHERE id = NEW.championship_team_id;

  IF EXISTS (
    SELECT 1
    FROM championship_team_players ctp
    JOIN championship_teams ct ON ct.id = ctp.championship_team_id
    WHERE ct.championship_id = v_championship_id
      AND ctp.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Jogador já está em outro time deste campeonato';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_player_single_team ON championship_team_players;
CREATE TRIGGER trg_check_player_single_team
BEFORE INSERT ON championship_team_players
FOR EACH ROW EXECUTE FUNCTION check_player_single_team_per_championship();

-- championship_rounds (rodadas de cada fase)
CREATE TABLE IF NOT EXISTS championship_rounds (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id     UUID        NOT NULL REFERENCES championship_phases(id) ON DELETE CASCADE,
  round_number INTEGER     NOT NULL,
  scheduled_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (phase_id, round_number)
);

-- championship_matches (confrontos individuais)
-- event_id: nullable — preenchido quando admin vincula/cria partida no calendário.
-- A geração de rodadas cria automaticamente os events e preenche este campo.
CREATE TABLE IF NOT EXISTS championship_matches (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      UUID        NOT NULL REFERENCES championship_rounds(id) ON DELETE CASCADE,
  home_team_id  UUID        NOT NULL REFERENCES championship_teams(id) ON DELETE RESTRICT,
  away_team_id  UUID        NOT NULL REFERENCES championship_teams(id) ON DELETE RESTRICT,
  event_id      UUID        REFERENCES events(id) ON DELETE SET NULL,
  home_score    INTEGER     CHECK (home_score >= 0),
  away_score    INTEGER     CHECK (away_score >= 0),
  status        VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'in_progress', 'finished', 'cancelled', 'postponed')),
  played_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (home_team_id != away_team_id)
);

-- FK reversa: events → championship_matches (additive, nullable)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS championship_match_id UUID
  REFERENCES championship_matches(id) ON DELETE SET NULL;

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_championships_group_id     ON championships(group_id);
CREATE INDEX IF NOT EXISTS idx_championships_status        ON championships(status);
CREATE INDEX IF NOT EXISTS idx_champ_phases_champ          ON championship_phases(championship_id);
CREATE INDEX IF NOT EXISTS idx_champ_teams_champ           ON championship_teams(championship_id);
CREATE INDEX IF NOT EXISTS idx_champ_team_players_team     ON championship_team_players(championship_team_id);
CREATE INDEX IF NOT EXISTS idx_champ_team_players_user     ON championship_team_players(user_id);
CREATE INDEX IF NOT EXISTS idx_champ_rounds_phase          ON championship_rounds(phase_id);
CREATE INDEX IF NOT EXISTS idx_champ_matches_round         ON championship_matches(round_id);
CREATE INDEX IF NOT EXISTS idx_champ_matches_home          ON championship_matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_champ_matches_away          ON championship_matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_champ_matches_event         ON championship_matches(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_champ_match          ON events(championship_match_id) WHERE championship_match_id IS NOT NULL;

-- ── Materialized View: Classificação ─────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_championship_standings AS
WITH match_results AS (
  SELECT
    ct.championship_id,
    ct.id         AS team_id,
    ct.name       AS team_name,
    ct.color      AS team_color,
    cm.id         AS match_id,
    CASE
      WHEN (cm.home_team_id = ct.id AND cm.home_score > cm.away_score)
        OR (cm.away_team_id = ct.id AND cm.away_score > cm.home_score)
      THEN 1 ELSE 0
    END AS is_win,
    CASE WHEN cm.home_score = cm.away_score THEN 1 ELSE 0 END AS is_draw,
    CASE
      WHEN (cm.home_team_id = ct.id AND cm.home_score < cm.away_score)
        OR (cm.away_team_id = ct.id AND cm.away_score < cm.home_score)
      THEN 1 ELSE 0
    END AS is_loss,
    CASE WHEN cm.home_team_id = ct.id
      THEN COALESCE(cm.home_score, 0)
      ELSE COALESCE(cm.away_score, 0)
    END AS goals_for,
    CASE WHEN cm.home_team_id = ct.id
      THEN COALESCE(cm.away_score, 0)
      ELSE COALESCE(cm.home_score, 0)
    END AS goals_against,
    c.points_win,
    c.points_draw
  FROM championship_teams ct
  JOIN championships c ON c.id = ct.championship_id
  LEFT JOIN championship_matches cm ON (
    (cm.home_team_id = ct.id OR cm.away_team_id = ct.id)
    AND cm.status = 'finished'
  )
  WHERE ct.is_bye = FALSE
)
SELECT
  championship_id,
  team_id,
  team_name,
  team_color,
  COUNT(match_id)::INT                                                       AS games_played,
  COALESCE(SUM(is_win),  0)::INT                                             AS wins,
  COALESCE(SUM(is_draw), 0)::INT                                             AS draws,
  COALESCE(SUM(is_loss), 0)::INT                                             AS losses,
  COALESCE(SUM(goals_for),     0)::INT                                       AS goals_for,
  COALESCE(SUM(goals_against), 0)::INT                                       AS goals_against,
  (COALESCE(SUM(goals_for), 0) - COALESCE(SUM(goals_against), 0))::INT      AS goal_diff,
  (COALESCE(SUM(is_win),  0) * MAX(points_win)
 + COALESCE(SUM(is_draw), 0) * MAX(points_draw))::INT                        AS points
FROM match_results
GROUP BY championship_id, team_id, team_name, team_color
WITH DATA;

-- Índice único obrigatório para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_champ_standings_pk
  ON mv_championship_standings(championship_id, team_id);

-- Função e trigger para refresh automático ao lançar resultado
CREATE OR REPLACE FUNCTION refresh_championship_standings()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_championship_standings;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_champ_standings ON championship_matches;
CREATE TRIGGER trg_refresh_champ_standings
AFTER INSERT OR UPDATE OR DELETE ON championship_matches
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_championship_standings();
