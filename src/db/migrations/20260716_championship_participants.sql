-- Lista de inscritos no campeonato (sem time ainda)
-- Permite adicionar guests por apelido antes de sortear ou montar times manualmente

CREATE TABLE IF NOT EXISTS championship_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id  UUID NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_name       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cp_identity CHECK (
    user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_name <> '')
  )
);

CREATE INDEX IF NOT EXISTS idx_cp_championship ON championship_participants (championship_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_unique_user ON championship_participants (championship_id, user_id)
  WHERE user_id IS NOT NULL;
