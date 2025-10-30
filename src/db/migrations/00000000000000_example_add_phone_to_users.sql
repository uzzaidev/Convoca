-- ==================================================
-- Migration: Example - Add phone to users
-- Date: 2025-10-30
-- Description: Exemplo de migration - adiciona campo de telefone na tabela users
-- ==================================================

-- NOTA: Este é um arquivo de EXEMPLO. Não execute em produção.
-- Para criar suas próprias migrations, use:
-- .\src\db\create-migration.ps1 "nome_da_sua_migration"

BEGIN;

-- Adicionar coluna phone (opcional)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Criar índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_users_phone 
ON public.users(phone) 
WHERE phone IS NOT NULL;

-- Adicionar comentário
COMMENT ON COLUMN public.users.phone IS 'Telefone do usuário (opcional)';

COMMIT;

-- ==================================================
-- Rollback (executar manualmente se necessário):
-- 
-- BEGIN;
-- DROP INDEX IF EXISTS idx_users_phone;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
-- COMMIT;
-- ==================================================
