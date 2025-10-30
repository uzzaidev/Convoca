-- Script para criar tabela de usuários do app Peladeiros
-- Este script é independente e pode ser executado separadamente
-- 
-- IMPORTANTE: Este é apenas para o sistema de login/senha do nosso app.
-- Não tem nada a ver com a autenticação do Neon (que é só para acessar o banco).
--
-- Execute este script no Neon SQL Editor ou via CLI para criar a tabela se ela não existir.

-- Habilitar extensão UUID (necessário para gerar IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  password_hash TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice no email para busca rápida durante login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Comentários explicativos
COMMENT ON TABLE users IS 'Tabela de usuários do app Peladeiros (login/senha)';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt da senha do usuário (nunca armazene senha em texto)';
COMMENT ON COLUMN users.email IS 'Email único do usuário, usado para login';
COMMENT ON COLUMN users.email_verified IS 'Data de verificação do email (null = não verificado)';
