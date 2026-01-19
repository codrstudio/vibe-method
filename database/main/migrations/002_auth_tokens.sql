-- =============================================================================
-- Migration: 002_auth_tokens.sql
-- Description: Tabelas para refresh tokens e controle de sessoes
-- Specs: DES-AUTH-001, DES-AUTH-005
-- =============================================================================

-- Refresh tokens para renovacao de sessao
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- Historico de login para auditoria
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    login_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    auth_method VARCHAR(20) DEFAULT 'password'
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_date ON login_history(login_at);
CREATE INDEX IF NOT EXISTS idx_login_history_ip ON login_history(ip_address);

-- Funcao para revogar todos os tokens de um usuario
CREATE OR REPLACE FUNCTION revoke_user_tokens(
    p_user_id UUID,
    p_reason VARCHAR(100) DEFAULT 'manual_revoke'
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE refresh_tokens
    SET revoked_at = NOW(), revoked_reason = p_reason
    WHERE user_id = p_user_id AND revoked_at IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Funcao para limpar tokens expirados (para job de manutencao)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days'
       OR revoked_at < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Funcao para contar sessoes ativas de um usuario
CREATE OR REPLACE FUNCTION count_active_sessions(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM refresh_tokens
        WHERE user_id = p_user_id
          AND revoked_at IS NULL
          AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql;
