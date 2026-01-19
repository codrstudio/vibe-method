-- Migration: Add phone field to users table with unique constraint
-- Date: 2026-01-17

-- Add phone column
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add unique constraint (allows NULL, but non-null values must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
ON users(phone)
WHERE phone IS NOT NULL;

-- Comment
COMMENT ON COLUMN users.phone IS 'Telefone do usuário (formato: +55119XXXXXXXX)';
