-- Atualiza limites padrão do agente para orçamento de $4/mês por conta
-- Modelo: gpt-5.4-nano ($0.20/1M input · $1.25/1M output)
-- 10M tokens + 2.000 requests ≈ $3.57 máximo por usuário/mês

UPDATE agent_settings
SET value = '10000000', updated_at = NOW()
WHERE key = 'default_monthly_token_limit';

UPDATE agent_settings
SET value = '2000', updated_at = NOW()
WHERE key = 'default_monthly_request_limit';

-- Redefine usuários que tiverem o limite padrão antigo (200k tokens / 200 req)
-- para herdar os novos defaults da tabela agent_settings (sem linha em agent_quotas)
DELETE FROM agent_quotas
WHERE monthly_token_limit = 200000
  AND monthly_request_limit = 200;
