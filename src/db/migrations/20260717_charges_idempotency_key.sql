-- Adiciona coluna de idempotency key para cobranças criadas pelo agente.
-- NULL permitido (cobranças via REST não enviam key).
-- UNIQUE constraint no Postgres ignora múltiplos NULLs corretamente.
ALTER TABLE charges ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS charges_idempotency_key_idx ON charges (idempotency_key) WHERE idempotency_key IS NOT NULL;
