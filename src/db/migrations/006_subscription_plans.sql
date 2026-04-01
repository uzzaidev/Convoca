-- Migration: Subscription Plans
-- Tabela de planos de assinatura vinculados ao Stripe

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  stripe_price_id VARCHAR(255) NOT NULL,
  stripe_product_id VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'brl',
  interval VARCHAR(20) NOT NULL,           -- 'month' ou 'year'
  interval_count INTEGER NOT NULL DEFAULT 1, -- 1 = mensal/anual, 6 = semestral
  max_installments INTEGER,                -- parcelas permitidas (null = sem parcelamento)
  trial_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- Adicionar referência ao plano na assinatura do grupo
ALTER TABLE group_subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);
ALTER TABLE group_subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255);
