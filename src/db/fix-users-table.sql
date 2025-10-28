-- Script para adicionar as colunas faltantes na tabela users
-- Execute no Neon SQL Editor para corrigir a estrutura da tabela

-- Adicionar coluna image (para foto de perfil)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'image'
    ) THEN
        ALTER TABLE users ADD COLUMN image TEXT;
        RAISE NOTICE 'Coluna "image" adicionada!';
    END IF;
END $$;

-- Adicionar coluna email_verified (para verificação de email)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified TIMESTAMP;
        RAISE NOTICE 'Coluna "email_verified" adicionada!';
    END IF;
END $$;

-- Adicionar coluna created_at (data de criação)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna "created_at" adicionada!';
    END IF;
END $$;

-- Adicionar coluna updated_at (última atualização)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna "updated_at" adicionada!';
    END IF;
END $$;

-- Verificar estrutura final
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
