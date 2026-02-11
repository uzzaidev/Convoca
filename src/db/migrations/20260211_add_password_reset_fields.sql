-- Migration: Add password reset fields to users table
-- Run this migration in Neon Console or via CLI
-- Date: 2026-02-11

-- Add reset_token and reset_token_expiry columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Add index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Comment on columns
COMMENT ON COLUMN users.reset_token IS 'Token for password reset (valid for 1 hour)';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiry timestamp for reset token';
