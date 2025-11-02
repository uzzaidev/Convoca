-- ==================================================
-- Migration: Create update_updated_at_column function
-- Author: GitHub Copilot
-- Date: 2025-11-01
-- Description: Cria função genérica para atualizar coluna updated_at
-- ==================================================

BEGIN;

-- Criar função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário
COMMENT ON FUNCTION update_updated_at_column() IS 'Função trigger para atualizar automaticamente a coluna updated_at';

COMMIT;

-- ==================================================
-- Rollback (se necessário, executar manualmente):
--
-- BEGIN;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- COMMIT;
-- ==================================================