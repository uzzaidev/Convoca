-- notification_log: rastreia notificações push enviadas para evitar duplicatas.
-- ref_id é o ID da entidade de referência (event_id, charge_id, ou chave composta).
-- A constraint UNIQUE (type, ref_id, user_id) garante no máximo uma notificação
-- de cada tipo por entidade por usuário.

CREATE TABLE IF NOT EXISTS notification_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       VARCHAR(60)  NOT NULL,
  ref_id     VARCHAR(150) NOT NULL,
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (type, ref_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_log_type_ref ON notification_log(type, ref_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_user    ON notification_log(user_id);
