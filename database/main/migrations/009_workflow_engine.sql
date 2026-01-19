-- =============================================================================
-- Migration: 009_workflow_engine.sql
-- Description: Motor de workflows com observabilidade configurável
-- Specs: Gestão de processos autônomos
-- =============================================================================

-- ============================================================================
-- REGISTRO DE PROCESSOS
-- ============================================================================

-- Processos registrados no sistema
CREATE TABLE IF NOT EXISTS processes (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Configuração (carregada do artefato)
    config JSONB NOT NULL DEFAULT '{}',

    -- Schedule
    schedule_type VARCHAR(20) NOT NULL DEFAULT 'interval', -- 'interval', 'cron', 'manual'
    schedule_value VARCHAR(100), -- '5m', '*/5 * * * *', null para manual

    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'disabled', 'error'

    -- Health
    consecutive_failures INTEGER DEFAULT 0,
    max_consecutive_failures INTEGER DEFAULT 3,

    -- Última execução
    last_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(20),
    last_run_duration_ms INTEGER,

    -- Próxima execução
    next_run_at TIMESTAMPTZ,

    -- Observabilidade
    tracing_enabled BOOLEAN DEFAULT false,
    tracing_retention_hours INTEGER DEFAULT 24,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXECUÇÕES DE PROCESSOS
-- ============================================================================

-- Histórico de execuções (sempre registrado, minimal)
CREATE TABLE IF NOT EXISTS process_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id VARCHAR(100) NOT NULL REFERENCES processes(id) ON DELETE CASCADE,

    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Resultado
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'success', 'failed', 'timeout', 'cancelled'

    -- Sumário (sempre preenchido, leve)
    summary JSONB DEFAULT '{}', -- { sent: 5, failed: 1, processed: 10 }

    -- Erro (se houver)
    error_code VARCHAR(100),
    error_message TEXT,

    -- Trigger
    triggered_by VARCHAR(50) DEFAULT 'scheduler', -- 'scheduler', 'manual', 'webhook', 'retry'
    triggered_by_user UUID REFERENCES users(id)
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_process_executions_process ON process_executions(process_id);
CREATE INDEX IF NOT EXISTS idx_process_executions_started ON process_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_process_executions_status ON process_executions(status);

-- ============================================================================
-- TRACES DE NODOS (só quando tracing habilitado)
-- ============================================================================

-- Traces detalhados por nodo (opcional, configurável)
CREATE TABLE IF NOT EXISTS workflow_traces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES process_executions(id) ON DELETE CASCADE,

    -- Identificação do nodo
    node_id VARCHAR(100) NOT NULL,
    node_name VARCHAR(255),
    node_index INTEGER, -- ordem no workflow

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Resultado
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'skipped'

    -- Dados (pode ser pesado, só com tracing)
    input JSONB,
    output JSONB,
    error JSONB,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Índice para buscar traces de uma execução
CREATE INDEX IF NOT EXISTS idx_workflow_traces_execution ON workflow_traces(execution_id);

-- ============================================================================
-- MENSAGENS WHATSAPP (observabilidade de integração)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Direção
    direction VARCHAR(10) NOT NULL, -- 'outbound', 'inbound'

    -- Contato
    phone VARCHAR(20) NOT NULL,

    -- Conteúdo
    content TEXT,
    template_id VARCHAR(100),
    template_vars JSONB,

    -- Status de entrega
    status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'read', 'failed'

    -- IDs externos
    evolution_message_id VARCHAR(100),
    evolution_instance VARCHAR(100),

    -- Erro
    error_code VARCHAR(100),
    error_message TEXT,

    -- Contexto (referencia generica a entidades definidas via artefato)
    process_id VARCHAR(100),
    execution_id UUID REFERENCES process_executions(id),
    entity_type VARCHAR(50),
    entity_id UUID,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_process ON whatsapp_messages(process_id) WHERE process_id IS NOT NULL;

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Inicia uma execução
CREATE OR REPLACE FUNCTION start_process_execution(
    p_process_id VARCHAR(100),
    p_triggered_by VARCHAR(50) DEFAULT 'scheduler',
    p_triggered_by_user UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_execution_id UUID;
BEGIN
    INSERT INTO process_executions (process_id, triggered_by, triggered_by_user)
    VALUES (p_process_id, p_triggered_by, p_triggered_by_user)
    RETURNING id INTO v_execution_id;

    -- Atualiza processo
    UPDATE processes
    SET last_run_at = NOW(),
        last_run_status = 'running'
    WHERE id = p_process_id;

    RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Finaliza uma execução com sucesso
CREATE OR REPLACE FUNCTION finish_process_execution_success(
    p_execution_id UUID,
    p_summary JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
    v_process_id VARCHAR(100);
    v_duration_ms INTEGER;
BEGIN
    -- Calcula duração e atualiza execução
    UPDATE process_executions
    SET
        finished_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000,
        status = 'success',
        summary = p_summary
    WHERE id = p_execution_id
    RETURNING process_id, duration_ms INTO v_process_id, v_duration_ms;

    -- Atualiza processo
    UPDATE processes
    SET
        last_run_status = 'success',
        last_run_duration_ms = v_duration_ms,
        consecutive_failures = 0,
        status = CASE WHEN status = 'error' THEN 'active' ELSE status END
    WHERE id = v_process_id;
END;
$$ LANGUAGE plpgsql;

-- Finaliza uma execução com falha
CREATE OR REPLACE FUNCTION finish_process_execution_failure(
    p_execution_id UUID,
    p_error_code VARCHAR(100),
    p_error_message TEXT,
    p_summary JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
    v_process_id VARCHAR(100);
    v_consecutive INTEGER;
    v_max_failures INTEGER;
BEGIN
    -- Atualiza execução
    UPDATE process_executions
    SET
        finished_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000,
        status = 'failed',
        summary = p_summary,
        error_code = p_error_code,
        error_message = p_error_message
    WHERE id = p_execution_id
    RETURNING process_id INTO v_process_id;

    -- Atualiza processo e verifica health
    UPDATE processes
    SET
        last_run_status = 'failed',
        consecutive_failures = consecutive_failures + 1
    WHERE id = v_process_id
    RETURNING consecutive_failures, max_consecutive_failures
    INTO v_consecutive, v_max_failures;

    -- Se excedeu limite, marca como erro
    IF v_consecutive >= v_max_failures THEN
        UPDATE processes
        SET status = 'error'
        WHERE id = v_process_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Adiciona trace de nodo (só se tracing habilitado)
CREATE OR REPLACE FUNCTION add_workflow_trace(
    p_execution_id UUID,
    p_node_id VARCHAR(100),
    p_node_name VARCHAR(255),
    p_node_index INTEGER,
    p_started_at TIMESTAMPTZ,
    p_finished_at TIMESTAMPTZ,
    p_status VARCHAR(20),
    p_input JSONB DEFAULT NULL,
    p_output JSONB DEFAULT NULL,
    p_error JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_trace_id UUID;
    v_tracing_enabled BOOLEAN;
BEGIN
    -- Verifica se tracing está habilitado para o processo
    SELECT p.tracing_enabled INTO v_tracing_enabled
    FROM processes p
    JOIN process_executions pe ON pe.process_id = p.id
    WHERE pe.id = p_execution_id;

    IF NOT v_tracing_enabled THEN
        RETURN NULL;
    END IF;

    INSERT INTO workflow_traces (
        execution_id, node_id, node_name, node_index,
        started_at, finished_at, duration_ms, status,
        input, output, error
    ) VALUES (
        p_execution_id, p_node_id, p_node_name, p_node_index,
        p_started_at, p_finished_at,
        EXTRACT(EPOCH FROM (p_finished_at - p_started_at)) * 1000,
        p_status, p_input, p_output, p_error
    )
    RETURNING id INTO v_trace_id;

    RETURN v_trace_id;
END;
$$ LANGUAGE plpgsql;

-- Limpa traces antigos (para job de manutenção)
CREATE OR REPLACE FUNCTION cleanup_old_traces()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER := 0;
BEGIN
    -- Remove traces além do retention de cada processo
    WITH to_delete AS (
        SELECT wt.id
        FROM workflow_traces wt
        JOIN process_executions pe ON pe.id = wt.execution_id
        JOIN processes p ON p.id = pe.process_id
        WHERE wt.started_at < NOW() - (p.tracing_retention_hours || ' hours')::INTERVAL
    )
    DELETE FROM workflow_traces
    WHERE id IN (SELECT id FROM to_delete);

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Estatísticas de um processo
CREATE OR REPLACE FUNCTION get_process_stats(
    p_process_id VARCHAR(100),
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_executions BIGINT,
    successful BIGINT,
    failed BIGINT,
    success_rate NUMERIC,
    avg_duration_ms NUMERIC,
    min_duration_ms INTEGER,
    max_duration_ms INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_executions,
        COUNT(*) FILTER (WHERE status = 'success')::BIGINT as successful,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed,
        ROUND(
            COUNT(*) FILTER (WHERE status = 'success')::NUMERIC * 100 /
            NULLIF(COUNT(*), 0),
            1
        ) as success_rate,
        ROUND(AVG(duration_ms)::NUMERIC, 0) as avg_duration_ms,
        MIN(duration_ms) as min_duration_ms,
        MAX(duration_ms) as max_duration_ms
    FROM process_executions
    WHERE process_id = p_process_id
      AND started_at >= NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para updated_at em processes
CREATE OR REPLACE FUNCTION update_processes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_processes_updated_at ON processes;
CREATE TRIGGER trigger_processes_updated_at
    BEFORE UPDATE ON processes
    FOR EACH ROW
    EXECUTE FUNCTION update_processes_updated_at();
