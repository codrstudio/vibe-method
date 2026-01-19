-- =============================================================================
-- Migration: 008_approval_queue.sql
-- Description: Tabela de fila de aprovacao para revisao humana
-- Specs: REQ-RECRUIT-005
-- =============================================================================

-- Tabela de itens pendentes de aprovacao
CREATE TABLE IF NOT EXISTS approval_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tipo e referencia do item
    item_type VARCHAR(50) NOT NULL, -- 'candidate', 'report', 'interview_result', etc.
    item_id UUID NOT NULL,

    -- Status do item
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending: aguardando revisao
    -- approved: aprovado
    -- rejected: rejeitado
    -- needs_info: precisa de mais informacoes

    -- Prioridade (1 = mais alta)
    priority INTEGER NOT NULL DEFAULT 5,

    -- Atribuicao
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,

    -- Contexto
    title VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',

    -- Decisao
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    review_decision VARCHAR(50),
    review_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint para evitar duplicatas
    UNIQUE (item_type, item_id, status)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_approval_items_status ON approval_items(status);
CREATE INDEX IF NOT EXISTS idx_approval_items_type ON approval_items(item_type);
CREATE INDEX IF NOT EXISTS idx_approval_items_assigned ON approval_items(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_approval_items_priority ON approval_items(priority, created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_approval_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_approval_items_updated_at ON approval_items;
CREATE TRIGGER trigger_approval_items_updated_at
    BEFORE UPDATE ON approval_items
    FOR EACH ROW
    EXECUTE FUNCTION update_approval_items_updated_at();

-- Funcao para adicionar item a fila
CREATE OR REPLACE FUNCTION add_to_approval_queue(
    p_item_type VARCHAR(50),
    p_item_id UUID,
    p_title VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_priority INTEGER DEFAULT 5,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_item_id UUID;
BEGIN
    INSERT INTO approval_items (
        item_type, item_id, title, description, priority, metadata
    ) VALUES (
        p_item_type, p_item_id, p_title, p_description, p_priority, p_metadata
    )
    ON CONFLICT (item_type, item_id, status) DO UPDATE
        SET priority = LEAST(approval_items.priority, p_priority),
            updated_at = NOW()
    RETURNING id INTO v_item_id;

    RETURN v_item_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para listar itens pendentes
CREATE OR REPLACE FUNCTION get_pending_approval_items(
    p_item_type VARCHAR(50) DEFAULT NULL,
    p_assigned_to UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    item_type VARCHAR(50),
    item_id UUID,
    status VARCHAR(20),
    priority INTEGER,
    title VARCHAR(255),
    description TEXT,
    metadata JSONB,
    assigned_to UUID,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ai.id,
        ai.item_type,
        ai.item_id,
        ai.status,
        ai.priority,
        ai.title,
        ai.description,
        ai.metadata,
        ai.assigned_to,
        ai.created_at
    FROM approval_items ai
    WHERE ai.status = 'pending'
      AND (p_item_type IS NULL OR ai.item_type = p_item_type)
      AND (p_assigned_to IS NULL OR ai.assigned_to = p_assigned_to OR ai.assigned_to IS NULL)
    ORDER BY ai.priority ASC, ai.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Funcao para aprovar item
CREATE OR REPLACE FUNCTION approve_item(
    p_item_id UUID,
    p_reviewer_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE approval_items
    SET status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = p_reviewer_id,
        review_decision = 'approved',
        review_notes = p_notes
    WHERE id = p_item_id
      AND status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Funcao para rejeitar item
CREATE OR REPLACE FUNCTION reject_item(
    p_item_id UUID,
    p_reviewer_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE approval_items
    SET status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = p_reviewer_id,
        review_decision = 'rejected',
        review_notes = p_notes
    WHERE id = p_item_id
      AND status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Funcao para contar itens por status
CREATE OR REPLACE FUNCTION count_approval_items_by_status()
RETURNS TABLE (
    status VARCHAR(20),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT ai.status, COUNT(*)
    FROM approval_items ai
    GROUP BY ai.status;
END;
$$ LANGUAGE plpgsql;
