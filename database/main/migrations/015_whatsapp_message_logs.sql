-- Migration: 015_whatsapp_message_logs.sql
-- Description: Log de mensagens WhatsApp (inbound e outbound)
-- Date: 2026-01-19

-- =============================================================================
-- Configuracao de logging em channels
-- =============================================================================
ALTER TABLE channels ADD COLUMN IF NOT EXISTS logging_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN channels.logging_enabled IS 'Se true, todas as mensagens sao logadas';

-- =============================================================================
-- Tabela: whatsapp_message_logs
-- =============================================================================
-- Registra mensagens WhatsApp para auditoria e debug
-- Separado do message_logs generico que e para templates

CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia ao canal WhatsApp
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,

  -- Referencia a operacao (pode ser null se mensagem sem operacao)
  operation_id UUID REFERENCES operations(id) ON DELETE SET NULL,

  -- Direcao: inbound (recebida) ou outbound (enviada)
  direction VARCHAR(10) NOT NULL,

  -- Numero WhatsApp do destinatario/remetente (JID)
  remote_jid VARCHAR(50) NOT NULL,

  -- ID da mensagem no WhatsApp
  message_id VARCHAR(100),

  -- Tipo de mensagem
  message_type VARCHAR(20) NOT NULL,

  -- Conteudo textual (null se anexo sem texto)
  content TEXT,

  -- Info de anexo: { type, mimetype, size, filename }
  attachment_info JSONB,

  -- Status: sent, delivered, read, failed
  status VARCHAR(20),

  -- Mensagem de erro (se status=failed)
  error_message TEXT,

  -- Metadata adicional
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_direction CHECK (direction IN ('inbound', 'outbound')),
  CONSTRAINT chk_message_type CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'sticker', 'contact', 'location', 'poll', 'reaction', 'unknown')),
  CONSTRAINT chk_status CHECK (status IS NULL OR status IN ('pending', 'sent', 'delivered', 'read', 'failed'))
);

-- =============================================================================
-- Indices
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_wa_msg_logs_channel ON whatsapp_message_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_wa_msg_logs_operation ON whatsapp_message_logs(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wa_msg_logs_remote ON whatsapp_message_logs(remote_jid);
CREATE INDEX IF NOT EXISTS idx_wa_msg_logs_created ON whatsapp_message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_msg_logs_direction ON whatsapp_message_logs(direction);
CREATE INDEX IF NOT EXISTS idx_wa_msg_logs_message_id ON whatsapp_message_logs(message_id) WHERE message_id IS NOT NULL;

-- Index composto para busca de conversa
CREATE INDEX IF NOT EXISTS idx_wa_msg_logs_conversation
  ON whatsapp_message_logs(channel_id, remote_jid, created_at DESC);

-- =============================================================================
-- Funcao de limpeza (mensagens > 90 dias)
-- =============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM whatsapp_message_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_whatsapp_logs() IS 'Remove logs de mensagens mais antigos que 90 dias';

-- =============================================================================
-- Comentarios
-- =============================================================================
COMMENT ON TABLE whatsapp_message_logs IS 'Log de mensagens WhatsApp (inbound e outbound)';
COMMENT ON COLUMN whatsapp_message_logs.remote_jid IS 'Numero WhatsApp no formato JID (ex: 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN whatsapp_message_logs.message_type IS 'Tipo: text, image, audio, video, document, sticker, contact, location, poll, reaction, unknown';
COMMENT ON COLUMN whatsapp_message_logs.attachment_info IS 'Para anexos: { type, mimetype, size, filename }. Nao armazena o binario.';

-- =============================================================================
-- Verificacao
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 015_whatsapp_message_logs.sql completed successfully';
END $$;
