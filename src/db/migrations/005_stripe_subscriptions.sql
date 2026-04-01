-- Migration: Stripe Subscriptions
-- Adiciona suporte a assinaturas Stripe por grupo

-- Adicionar stripe_customer_id na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- Adicionar status 'pending_payment' nos grupos
-- (PostgreSQL não suporta ALTER CHECK constraint facilmente,
--  então removemos e recriamos)
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_status_check;
ALTER TABLE groups ADD CONSTRAINT groups_status_check
  CHECK (status IN ('pending', 'pending_payment', 'active', 'inactive', 'rejected'));

-- Tabela de assinaturas de grupo
CREATE TABLE IF NOT EXISTS group_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  trial_end TIMESTAMP,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_subs_group ON group_subscriptions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_subs_user ON group_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_group_subs_stripe_sub ON group_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_group_subs_status ON group_subscriptions(status);
