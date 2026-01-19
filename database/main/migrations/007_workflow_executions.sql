-- =============================================================================
-- Migration: 007_workflow_executions.sql
-- Description: Tabela de execucoes de workflow para observabilidade
-- Specs: DES-AGENT-011
-- =============================================================================

-- Tabela de execucoes de workflow
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identificacao do workflow
    workflow_name VARCHAR(100) NOT NULL,
    workflow_version VARCHAR(20) DEFAULT '1.0',

    -- Trigger
    trigger_type VARCHAR(50) NOT NULL,
    trigger_id VARCHAR(255),
    trigger_data JSONB DEFAULT '{}',

    -- Contexto (referencia generica a entidades definidas via artefato)
    entity_type VARCHAR(50),
    entity_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Input inicial
    initial_input JSONB DEFAULT '{}',

    -- Execucao
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    status VARCHAR(50) DEFAULT 'running',

    -- Nodos executados
    nodes JSONB DEFAULT '[]',

    -- Resultado final
    final_output JSONB DEFAULT '{}',

    -- Erro (se houver)
    error_node VARCHAR(100),
    error_message TEXT,
    error_stack TEXT,

    -- Metricas
    total_tokens_used INTEGER DEFAULT 0,
    llm_calls_count INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0
);

-- Indices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started ON workflow_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_trigger ON workflow_executions(trigger_type, trigger_id);

-- Indice para buscar execucoes com erro
CREATE INDEX IF NOT EXISTS idx_workflow_executions_errors ON workflow_executions(workflow_name, started_at DESC)
    WHERE status = 'error';

-- Funcao para registrar inicio de execucao
CREATE OR REPLACE FUNCTION start_workflow_execution(
    p_workflow_name VARCHAR(100),
    p_trigger_type VARCHAR(50),
    p_trigger_id VARCHAR(255) DEFAULT NULL,
    p_trigger_data JSONB DEFAULT '{}',
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_initial_input JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_executions (
        workflow_name,
        trigger_type,
        trigger_id,
        trigger_data,
        entity_type,
        entity_id,
        initial_input
    ) VALUES (
        p_workflow_name,
        p_trigger_type,
        p_trigger_id,
        p_trigger_data,
        p_entity_type,
        p_entity_id,
        p_initial_input
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para registrar execucao de nodo
CREATE OR REPLACE FUNCTION record_workflow_node(
    p_execution_id UUID,
    p_node_name VARCHAR(100),
    p_node_input JSONB,
    p_node_output JSONB,
    p_duration_ms INTEGER,
    p_tokens_used INTEGER DEFAULT 0
) RETURNS VOID AS $$
DECLARE
    v_nodes JSONB;
    v_new_node JSONB;
BEGIN
    -- Busca nodes atuais
    SELECT nodes INTO v_nodes FROM workflow_executions WHERE id = p_execution_id;

    -- Cria nova entrada
    v_new_node = jsonb_build_object(
        'node', p_node_name,
        'input', p_node_input,
        'output', p_node_output,
        'duration_ms', p_duration_ms,
        'tokens_used', p_tokens_used,
        'timestamp', NOW()
    );

    -- Atualiza execucao
    UPDATE workflow_executions
    SET nodes = v_nodes || v_new_node,
        total_tokens_used = total_tokens_used + COALESCE(p_tokens_used, 0),
        llm_calls_count = llm_calls_count + CASE WHEN p_tokens_used > 0 THEN 1 ELSE 0 END
    WHERE id = p_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para finalizar execucao com sucesso
CREATE OR REPLACE FUNCTION complete_workflow_execution(
    p_execution_id UUID,
    p_final_output JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    UPDATE workflow_executions
    SET status = 'completed',
        finished_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER * 1000,
        final_output = p_final_output
    WHERE id = p_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para finalizar execucao com erro
CREATE OR REPLACE FUNCTION fail_workflow_execution(
    p_execution_id UUID,
    p_error_node VARCHAR(100),
    p_error_message TEXT,
    p_error_stack TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE workflow_executions
    SET status = 'error',
        finished_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER * 1000,
        error_node = p_error_node,
        error_message = p_error_message,
        error_stack = p_error_stack
    WHERE id = p_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para estatisticas de workflow
CREATE OR REPLACE FUNCTION get_workflow_stats(
    p_workflow_name VARCHAR(100) DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    workflow_name VARCHAR(100),
    total_executions BIGINT,
    completed BIGINT,
    errors BIGINT,
    avg_duration_ms DECIMAL(10,2),
    avg_tokens DECIMAL(10,2),
    error_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.workflow_name,
        COUNT(*)::BIGINT as total_executions,
        COUNT(*) FILTER (WHERE w.status = 'completed')::BIGINT as completed,
        COUNT(*) FILTER (WHERE w.status = 'error')::BIGINT as errors,
        ROUND(AVG(w.duration_ms)::DECIMAL, 2) as avg_duration_ms,
        ROUND(AVG(w.total_tokens_used)::DECIMAL, 2) as avg_tokens,
        ROUND(
            COUNT(*) FILTER (WHERE w.status = 'error')::DECIMAL * 100 /
            NULLIF(COUNT(*), 0),
            2
        ) as error_rate
    FROM workflow_executions w
    WHERE (p_workflow_name IS NULL OR w.workflow_name = p_workflow_name)
      AND (p_start_date IS NULL OR w.started_at >= p_start_date)
      AND (p_end_date IS NULL OR w.started_at <= p_end_date)
    GROUP BY w.workflow_name;
END;
$$ LANGUAGE plpgsql;

-- Funcao para listar erros recentes
CREATE OR REPLACE FUNCTION get_recent_workflow_errors(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    workflow_name VARCHAR(100),
    error_node VARCHAR(100),
    error_message TEXT,
    started_at TIMESTAMPTZ,
    entity_type VARCHAR(50),
    entity_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id,
        w.workflow_name,
        w.error_node,
        w.error_message,
        w.started_at,
        w.entity_type,
        w.entity_id
    FROM workflow_executions w
    WHERE w.status = 'error'
    ORDER BY w.started_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Funcao para limpar execucoes antigas
CREATE OR REPLACE FUNCTION cleanup_old_workflow_executions(
    p_days_to_keep INTEGER DEFAULT 30
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM workflow_executions
    WHERE started_at < NOW() - (p_days_to_keep || ' days')::INTERVAL
      AND status IN ('completed', 'error');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
