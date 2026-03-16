-- Migration: Adicionar tabelas e colunas para recorrências, despesas e mensalistas
-- Data: 2026-03-15
-- Executar no Supabase SQL Editor ou via CLI

-- 1. Adicionar colunas de mensalista na tabela group_members
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS is_mensalista BOOLEAN DEFAULT FALSE;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS monthly_amount_cents INTEGER DEFAULT 0;

-- 2. Criar tabela de recorrências de eventos
CREATE TABLE IF NOT EXISTS event_recurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  max_players INTEGER DEFAULT 10,
  max_goalkeepers INTEGER DEFAULT 2,
  waitlist_enabled BOOLEAN DEFAULT TRUE,
  list_opens_hours_before INTEGER DEFAULT 48,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Adicionar colunas na tabela events
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_id UUID REFERENCES event_recurrences(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS list_opens_at TIMESTAMP;

-- 4. Criar tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL CHECK (category IN ('venue_rental', 'equipment', 'referee', 'other')),
  description TEXT,
  amount_cents INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
