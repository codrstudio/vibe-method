-- Migration: Remove unique constraint from phone (allow duplicates)
-- Date: 2026-01-17
-- Reason: Uma pessoa pode ter múltiplos logins com o mesmo telefone

DROP INDEX IF EXISTS idx_users_phone_unique;
