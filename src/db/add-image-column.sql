-- Script para adicionar a coluna 'image' na tabela users
-- Execute este script no Neon SQL Editor se quiser suportar fotos de perfil no futuro

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'image'
    ) THEN
        ALTER TABLE users ADD COLUMN image TEXT;
        RAISE NOTICE 'Coluna "image" adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna "image" já existe!';
    END IF;
END $$;

-- Verificar a estrutura da tabela após a alteração
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
