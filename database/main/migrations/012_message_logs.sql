-- Migration: 012_message_logs
-- Description: Log de mensagens enviadas pelo sistema
-- Related: PLAN message-templates

-- =============================================================================
-- Tabela: message_logs
-- =============================================================================
-- Registra todas as mensagens enviadas para auditoria e debug
-- Permite rastrear problemas de entrega e analisar uso

CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia ao template usado
  template_id VARCHAR(50) REFERENCES message_templates(id) ON DELETE SET NULL,

  -- Canal de envio
  channel VARCHAR(20) NOT NULL,

  -- Destinatario (email, telefone, etc)
  recipient VARCHAR(255) NOT NULL,

  -- Variaveis usadas na renderizacao (para debug)
  -- Dados sensiveis (como OTP) sao mascarados
  variables JSONB NOT NULL DEFAULT '{}',

  -- Status do envio
  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  -- Detalhes de erro (se falhou)
  error_message TEXT,
  error_code VARCHAR(50),

  -- Metadata adicional
  -- Ex: { message_id, smtp_response, provider }
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT chk_channel CHECK (channel IN ('email', 'whatsapp', 'push')),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'delivered'))
);

-- Indices para queries comuns
CREATE INDEX IF NOT EXISTS idx_message_logs_template ON message_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON message_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_channel ON message_logs(channel);

-- Index composto para busca por template + periodo
CREATE INDEX IF NOT EXISTS idx_message_logs_template_date
  ON message_logs(template_id, created_at DESC);

-- Comentarios
COMMENT ON TABLE message_logs IS 'Log de mensagens enviadas pelo sistema';
COMMENT ON COLUMN message_logs.template_id IS 'Template usado (pode ser null se deletado)';
COMMENT ON COLUMN message_logs.variables IS 'Variaveis usadas (dados sensiveis mascarados)';
COMMENT ON COLUMN message_logs.metadata IS 'Dados adicionais do envio (message_id, provider, etc)';
