-- ==================================================
-- Migration: Create draw_configs table for team draw settings
-- Author: GitHub Copilot
-- Date: 2025-11-01
-- Description: Adiciona tabela para configurações de sorteio de times por grupo
-- ==================================================

BEGIN;

-- Criar tabela de configurações de sorteio
CREATE TABLE IF NOT EXISTS public.draw_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  players_per_team INTEGER DEFAULT 7 CHECK (players_per_team >= 1 AND players_per_team <= 22),
  reserves_per_team INTEGER DEFAULT 2 CHECK (reserves_per_team >= 0 AND reserves_per_team <= 11),
  gk_count INTEGER DEFAULT 1 CHECK (gk_count >= 0 AND gk_count <= 5),
  defender_count INTEGER DEFAULT 2 CHECK (defender_count >= 0 AND defender_count <= 11),
  midfielder_count INTEGER DEFAULT 2 CHECK (midfielder_count >= 0 AND midfielder_count <= 11),
  forward_count INTEGER DEFAULT 2 CHECK (forward_count >= 0 AND forward_count <= 11),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_draw_configs_group_id ON public.draw_configs(group_id);
CREATE INDEX IF NOT EXISTS idx_draw_configs_created_at ON public.draw_configs(created_at);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_draw_configs_updated_at ON public.draw_configs;
CREATE TRIGGER update_draw_configs_updated_at
    BEFORE UPDATE ON public.draw_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.draw_configs IS 'Configurações de sorteio de times por grupo';
COMMENT ON COLUMN public.draw_configs.players_per_team IS 'Número de jogadores titulares por time';
COMMENT ON COLUMN public.draw_configs.reserves_per_team IS 'Número de reservas por time';
COMMENT ON COLUMN public.draw_configs.gk_count IS 'Número de goleiros necessários por time';
COMMENT ON COLUMN public.draw_configs.defender_count IS 'Número de zagueiros necessários por time';
COMMENT ON COLUMN public.draw_configs.midfielder_count IS 'Número de meio-campistas necessários por time';
COMMENT ON COLUMN public.draw_configs.forward_count IS 'Número de atacantes necessários por time';

COMMIT;

-- ==================================================
-- Rollback (se necessário, executar manualmente):
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS update_draw_configs_updated_at ON public.draw_configs;
-- DROP TABLE IF EXISTS public.draw_configs CASCADE;
-- COMMIT;
-- ==================================================