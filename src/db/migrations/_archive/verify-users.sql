-- Script para verificar os usuários cadastrados
-- Execute no Neon SQL Editor para ver o que está salvo

-- Ver todos os usuários (sem mostrar o hash completo por segurança)
SELECT
  id,
  name,
  email,
  CASE
    WHEN password_hash IS NULL THEN 'NULL'
    WHEN password_hash = '' THEN 'VAZIO'
    ELSE 'HASH PRESENTE (' || LENGTH(password_hash) || ' caracteres)'
  END as password_status,
  LEFT(password_hash, 10) || '...' as hash_preview,
  email_verified,
  created_at,
  updated_at
FROM users
ORDER BY created_at DESC;

-- Contar usuários
SELECT COUNT(*) as total_usuarios FROM users;

-- Ver usuários sem senha
SELECT
  id,
  name,
  email,
  'SEM SENHA!' as problema
FROM users
WHERE password_hash IS NULL OR password_hash = '';
