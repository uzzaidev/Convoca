-- Migration: 2026-05-add-agent.sql
-- Adiciona tabelas para o agente conversacional por grupo

-- 1. Conversas do agente (escopadas por user + grupo)
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_conv_user_group ON agent_conversations(user_id, group_id);

-- 2. Mensagens de cada conversa
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content TEXT,
  metadata JSONB,      -- usage, reasoning, tool_calls, approvals
  response_id TEXT,    -- previous_response_id para Responses API
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_msg_conv ON agent_messages(conversation_id, created_at);

-- 3. Quotas por usuário (ajustáveis pelo system_admin)
CREATE TABLE IF NOT EXISTS agent_quotas (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_token_limit INT NOT NULL DEFAULT 200000,
  monthly_request_limit INT NOT NULL DEFAULT 200,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Uso mensal por usuário (rolling, agregado por ano-mês)
CREATE TABLE IF NOT EXISTS agent_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year_month CHAR(7) NOT NULL,          -- "2026-05"
  requests INT NOT NULL DEFAULT 0,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  reasoning_tokens BIGINT NOT NULL DEFAULT 0,
  cost_usd_cents INT NOT NULL DEFAULT 0, -- snapshot do custo estimado
  PRIMARY KEY (user_id, year_month)
);

-- 5. Configurações globais do agente (ajustáveis pelo system_admin sem migration)
CREATE TABLE IF NOT EXISTS agent_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO agent_settings (key, value) VALUES
  ('default_monthly_token_limit', '200000'),
  ('default_monthly_request_limit', '200'),
  ('model', '"gpt-4o-mini"'),
  ('reasoning_effort', '"low"'),
  ('verbosity', '"low"')
ON CONFLICT (key) DO NOTHING;
