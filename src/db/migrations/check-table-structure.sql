-- Script para verificar a estrutura REAL da tabela users no banco
-- Execute no Neon SQL Editor para ver quais colunas existem

-- Ver todas as colunas da tabela users
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Ver dados de exemplo (primeiros 5 usuários)
SELECT * FROM users LIMIT 5;
