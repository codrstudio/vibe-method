-- Migration: 016_channel_provider.sql
-- Description: Adicionar coluna provider para escolher entre evolution e simulator
-- Date: 2026-01-19

-- =============================================================================
-- Coluna provider
-- =============================================================================
ALTER TABLE channels ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'evolution';

-- Constraint para valores válidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_channels_provider'
  ) THEN
    ALTER TABLE channels ADD CONSTRAINT chk_channels_provider
      CHECK (provider IN ('evolution', 'simulator'));
  END IF;
END $$;

-- Índice para busca
CREATE INDEX IF NOT EXISTS idx_channels_provider ON channels(provider);

-- Comentário
COMMENT ON COLUMN channels.provider IS 'Provider do canal: evolution (real) ou simulator (fake)';

-- =============================================================================
-- Verificação
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 016_channel_provider.sql completed successfully';
END $$;
