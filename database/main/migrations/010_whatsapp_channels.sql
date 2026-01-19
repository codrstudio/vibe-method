-- Migration: 010_whatsapp_channels.sql
-- Description: Canais WhatsApp (Evolution API) e sistema de operações
-- Date: 2026-01-18

-- =============================================================================
-- Canais WhatsApp (instâncias Evolution)
-- =============================================================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Evolution API
  instance_name VARCHAR(100) NOT NULL UNIQUE,
  instance_id VARCHAR(100),

  -- Conexão
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'disconnected',
  status_reason TEXT,
  last_health_check TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

COMMENT ON TABLE channels IS 'Instâncias WhatsApp conectadas via Evolution API';
COMMENT ON COLUMN channels.instance_name IS 'Nome único da instância na Evolution API';
COMMENT ON COLUMN channels.status IS 'Status: disconnected, qr_pending, connecting, connected, degraded';

-- =============================================================================
-- Operações (declaradas pelo sistema)
-- =============================================================================
CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Natureza
  nature VARCHAR(20) NOT NULL CHECK (nature IN ('system', 'user')),

  -- Origem
  declared_by VARCHAR(100),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE operations IS 'Operações do sistema que precisam de WhatsApp';
COMMENT ON COLUMN operations.slug IS 'Identificador único: recruitment-gatekeeper, recruitment-worker, etc.';
COMMENT ON COLUMN operations.nature IS 'system = compartilhado, user = per-user assignment';

-- =============================================================================
-- Associação Canal <-> Operação
-- =============================================================================
CREATE TABLE IF NOT EXISTS channel_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  operation_id UUID NOT NULL REFERENCES operations(id) ON DELETE CASCADE,

  -- Para operações nature='user'
  user_id UUID REFERENCES users(id),

  -- Config
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(channel_id, operation_id)
);

COMMENT ON TABLE channel_operations IS 'Liga canais a operações com prioridade';
COMMENT ON COLUMN channel_operations.priority IS 'Maior = mais prioritário para fallback';

-- =============================================================================
-- Índices
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);
CREATE INDEX IF NOT EXISTS idx_channels_instance ON channels(instance_name);
CREATE INDEX IF NOT EXISTS idx_channel_ops_operation ON channel_operations(operation_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_channel_ops_user ON channel_operations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_channel_ops_channel ON channel_operations(channel_id);
CREATE INDEX IF NOT EXISTS idx_operations_slug ON operations(slug);

-- =============================================================================
-- Trigger para updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_operations_updated_at ON operations;
CREATE TRIGGER update_operations_updated_at
  BEFORE UPDATE ON operations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Operações (definidas via artefato do projeto)
-- =============================================================================
-- NOTA: Operações específicas devem ser inseridas via seed do projeto,
-- não nesta migration genérica. Use database/main/seeds/ para definir operações.

-- =============================================================================
-- Verificação
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 010_whatsapp_channels.sql completed successfully';
END $$;
