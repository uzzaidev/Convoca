-- Migration: Stripe Enforcement Fields
-- Adiciona campos para controle de aviso de pagamento e extensao manual de acesso

-- Campo para registrar quando o admin do grupo dispensou o banner de aviso
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_notice_dismissed_at TIMESTAMP;

-- Campo para extensao manual de acesso pelo super admin (grace period sem Stripe)
ALTER TABLE group_subscriptions ADD COLUMN IF NOT EXISTS grace_until TIMESTAMP;

-- Indice para facilitar consulta de extensoes ativas
CREATE INDEX IF NOT EXISTS idx_group_subs_grace_until ON group_subscriptions(grace_until)
  WHERE grace_until IS NOT NULL;
