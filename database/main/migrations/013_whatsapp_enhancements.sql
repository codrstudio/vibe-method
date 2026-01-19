-- Migration: 013_whatsapp_enhancements.sql
-- Description: Campos adicionais para QR code real-time, eventos e notificacoes
-- Date: 2026-01-18

-- =============================================================================
-- Campos adicionais em channels (para QR code real-time)
-- =============================================================================
ALTER TABLE channels ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS qr_code_expires_at TIMESTAMPTZ;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS connection_data JSONB DEFAULT '{}';

COMMENT ON COLUMN channels.qr_code IS 'QR code base64 atual para conexao';
COMMENT ON COLUMN channels.qr_code_expires_at IS 'Expiracao do QR code atual';
COMMENT ON COLUMN channels.connection_data IS 'Dados adicionais de conexao (profile, etc)';

-- =============================================================================
-- Campos para tracking de reconexao
-- =============================================================================
ALTER TABLE channels ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS last_disconnect_reason INT;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS last_disconnect_at TIMESTAMPTZ;

COMMENT ON COLUMN channels.retry_count IS 'Tentativas de reconexao (0-5)';
COMMENT ON COLUMN channels.last_disconnect_reason IS 'Codigo DisconnectReason do Baileys: 401=loggedOut, 440=connectionReplaced, 500=badSession, 408=timedOut, 428=connectionClosed, 503=unavailableService, 515=restartRequired';
COMMENT ON COLUMN channels.last_disconnect_at IS 'Timestamp da ultima desconexao';

-- =============================================================================
-- Campo event_interests em operations
-- =============================================================================
ALTER TABLE operations ADD COLUMN IF NOT EXISTS event_interests TEXT[] DEFAULT '{}';

COMMENT ON COLUMN operations.event_interests IS 'Eventos do WhatsApp de interesse: MESSAGES_UPSERT, CONNECTION_UPDATE, QRCODE_UPDATED, etc.';

-- =============================================================================
-- Campos de notificacao em channel_operations
-- =============================================================================
ALTER TABLE channel_operations ADD COLUMN IF NOT EXISTS notification_email VARCHAR(255);
ALTER TABLE channel_operations ADD COLUMN IF NOT EXISTS notification_phone VARCHAR(20);

COMMENT ON COLUMN channel_operations.notification_email IS 'Email para alertas de status do canal';
COMMENT ON COLUMN channel_operations.notification_phone IS 'Telefone para SMS de alertas criticos';

-- =============================================================================
-- Tabela de eventos (historico para auditoria)
-- =============================================================================
CREATE TABLE IF NOT EXISTS channel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_events_channel ON channel_events(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_events_created ON channel_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_events_type ON channel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_channel_events_unprocessed ON channel_events(channel_id) WHERE processed = false;

COMMENT ON TABLE channel_events IS 'Historico de eventos recebidos do WhatsApp para auditoria';
COMMENT ON COLUMN channel_events.event_type IS 'Tipo: QRCODE_UPDATED, CONNECTION_UPDATE, MESSAGES_UPSERT, etc.';
COMMENT ON COLUMN channel_events.processed IS 'Se o evento ja foi processado pelos handlers';

-- =============================================================================
-- Funcao de limpeza automatica de eventos antigos (> 30 dias)
-- =============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_channel_events()
RETURNS void AS $$
BEGIN
  DELETE FROM channel_events WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_channel_events() IS 'Remove eventos mais antigos que 30 dias';

-- =============================================================================
-- Indices adicionais para performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_channels_qr_expires ON channels(qr_code_expires_at) WHERE qr_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_channels_retry ON channels(retry_count) WHERE status = 'degraded';

-- =============================================================================
-- Verificacao
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 013_whatsapp_enhancements.sql completed successfully';
END $$;
