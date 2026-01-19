-- =============================================================================
-- Migration: 001_permissions.sql
-- Description: Sistema de permissoes granulares (RBAC)
-- Specs: DES-AUTH-007, DES-AUTH-008
-- =============================================================================

-- Tabela de permissoes disponiveis no sistema
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Permissoes associadas a roles (definidos via artefato)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    scope VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission_id, scope)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Permissoes especificas de usuarios (override de role)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    scope VARCHAR(50) DEFAULT NULL,
    granted BOOLEAN DEFAULT TRUE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, permission_id, scope)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);

-- Funcao para verificar se usuario tem permissao
-- Verifica: 1) user_permissions (override), 2) role_permissions via user_roles
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_name VARCHAR(100),
    p_scope VARCHAR(50) DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_permission_id UUID;
    v_user_override BOOLEAN;
    v_role_grant BOOLEAN;
BEGIN
    -- Buscar ID da permissao
    SELECT id INTO v_permission_id FROM permissions WHERE name = p_permission_name;
    IF v_permission_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verificar override de usuario (granted = false nega, granted = true concede)
    SELECT granted INTO v_user_override
    FROM user_permissions
    WHERE user_id = p_user_id
      AND permission_id = v_permission_id
      AND (scope IS NULL OR scope = p_scope)
      AND (expires_at IS NULL OR expires_at > NOW());

    -- Se existe override explicito, usar esse valor
    IF v_user_override IS NOT NULL THEN
        RETURN v_user_override;
    END IF;

    -- Verificar permissao via role
    SELECT TRUE INTO v_role_grant
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = p_user_id
      AND rp.permission_id = v_permission_id
      AND (rp.scope IS NULL OR rp.scope = p_scope)
    LIMIT 1;

    RETURN COALESCE(v_role_grant, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Funcao para listar todas permissoes de um usuario
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(
    permission_name VARCHAR(100),
    source VARCHAR(20),
    scope VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    -- Permissoes via role
    SELECT DISTINCT
        p.name as permission_name,
        'role'::VARCHAR(20) as source,
        rp.scope
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role = rp.role
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id

    UNION

    -- Permissoes diretas (granted = true)
    SELECT DISTINCT
        p.name as permission_name,
        'direct'::VARCHAR(20) as source,
        up.scope
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND up.granted = TRUE
      AND (up.expires_at IS NULL OR up.expires_at > NOW());
END;
$$ LANGUAGE plpgsql;
