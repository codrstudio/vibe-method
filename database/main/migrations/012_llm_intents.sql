-- Migration: 012_llm_intents.sql
-- Description: Sistema de intencoes para uso de LLM com bindings configuraveis
-- Date: 2026-01-19

-- =============================================================================
-- LLM Intents (declarados pelo sistema)
-- =============================================================================
CREATE TABLE IF NOT EXISTS llm_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao (interno)
  slug VARCHAR(100) NOT NULL UNIQUE,

  -- UI (pt-BR)
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(200),
  description TEXT,
  icon VARCHAR(50) DEFAULT 'brain',

  -- Profile (requisitos para filtrar modelos)
  profile JSONB DEFAULT '{}',

  -- Origem
  declared_by VARCHAR(100),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE llm_intents IS 'Intencoes de uso de LLM declaradas pelo sistema';
COMMENT ON COLUMN llm_intents.slug IS 'ID interno: classify, generate, extract, plan, decide';
COMMENT ON COLUMN llm_intents.title IS 'Titulo exibido na UI (pt-BR)';
COMMENT ON COLUMN llm_intents.subtitle IS 'Subtitulo/linha secundaria na UI';
COMMENT ON COLUMN llm_intents.icon IS 'Nome do icone Lucide (ex: tag, brain, message-square)';
COMMENT ON COLUMN llm_intents.profile IS 'JSON com requisitos: {"minParams":"7b","maxParams":"70b","requiresJSON":true,"priority":"speed"}';

-- =============================================================================
-- LLM Bindings (configurados via UI)
-- =============================================================================
CREATE TABLE IF NOT EXISTS llm_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  intent_id UUID NOT NULL REFERENCES llm_intents(id) ON DELETE CASCADE,

  -- Provider + Model
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,

  -- Overrides (opcional)
  temperature DECIMAL(3,2),
  max_tokens INT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

COMMENT ON TABLE llm_bindings IS 'Bindings que ligam intents a providers/modelos especificos';
COMMENT ON COLUMN llm_bindings.provider IS 'Provider: openrouter, ollama';
COMMENT ON COLUMN llm_bindings.model IS 'ID do modelo no provider (ex: anthropic/claude-3.5-sonnet, llama3:8b)';
COMMENT ON COLUMN llm_bindings.temperature IS 'Override de temperature (0.0 a 2.0)';
COMMENT ON COLUMN llm_bindings.max_tokens IS 'Override de max_tokens';
COMMENT ON COLUMN llm_bindings.priority IS 'Prioridade para fallback (maior = mais prioritario)';

-- =============================================================================
-- Indices
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_llm_intents_slug ON llm_intents(slug);
CREATE INDEX IF NOT EXISTS idx_llm_bindings_intent ON llm_bindings(intent_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_llm_bindings_provider ON llm_bindings(provider);

-- =============================================================================
-- Constraint: apenas um binding ativo por intent
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_llm_bindings_unique_active
  ON llm_bindings(intent_id)
  WHERE is_active = true;

-- =============================================================================
-- Triggers para updated_at
-- =============================================================================
DROP TRIGGER IF EXISTS update_llm_intents_updated_at ON llm_intents;
CREATE TRIGGER update_llm_intents_updated_at
  BEFORE UPDATE ON llm_intents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_llm_bindings_updated_at ON llm_bindings;
CREATE TRIGGER update_llm_bindings_updated_at
  BEFORE UPDATE ON llm_bindings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Verificacao
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 012_llm_intents.sql completed successfully';
END $$;
