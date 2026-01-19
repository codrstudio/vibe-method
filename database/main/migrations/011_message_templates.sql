-- Migration: 011_message_templates
-- Description: Tabela de templates de mensagens do sistema
-- Related: PLAN message-templates

-- =============================================================================
-- Tabela: message_templates
-- =============================================================================
-- Armazena templates de mensagens (email, whatsapp, push)
-- Templates padrao vem de specs/messages/*.yaml via seed
-- Customizacoes ficam com source='custom'

CREATE TABLE IF NOT EXISTS message_templates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,

  -- Configuracao por canal (JSONB)
  -- Estrutura: { email: { enabled, subject, body_html, body_text }, whatsapp: { enabled, body } }
  channels JSONB NOT NULL DEFAULT '{}',

  -- Variaveis disponiveis para o template
  -- Estrutura: [{ key, label, example, required }]
  variables JSONB NOT NULL DEFAULT '[]',

  -- Configuracoes especificas do template
  -- Ex: { otp_length: 6, ttl_minutes: 5 }
  settings JSONB NOT NULL DEFAULT '{}',

  -- Origem do template
  -- 'default': veio do seed (specs/messages/*.yaml)
  -- 'custom': foi editado pelo usuario
  source VARCHAR(20) NOT NULL DEFAULT 'default',

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT chk_category CHECK (category IN ('auth', 'notification', 'alert', 'transactional')),
  CONSTRAINT chk_source CHECK (source IN ('default', 'custom'))
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_source ON message_templates(source);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_message_templates_updated_at ON message_templates;
CREATE TRIGGER trg_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Comentarios
COMMENT ON TABLE message_templates IS 'Templates de mensagens do sistema (email, whatsapp, push)';
COMMENT ON COLUMN message_templates.id IS 'ID unico do template (ex: otp-login, welcome)';
COMMENT ON COLUMN message_templates.channels IS 'Configuracao por canal em JSONB';
COMMENT ON COLUMN message_templates.variables IS 'Variaveis disponiveis para interpolacao';
COMMENT ON COLUMN message_templates.source IS 'Origem: default (seed) ou custom (editado)';
