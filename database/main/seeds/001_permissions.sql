-- =============================================================================
-- Seed: 001_permissions.sql
-- Description: Permissoes base do motor (genéricas)
-- Specs: DES-AUTH-007, DES-AUTH-008
-- =============================================================================
-- NOTA: Este seed contém apenas permissões genéricas do motor.
-- Permissões específicas de negócio devem ser definidas em artefatos
-- do projeto e carregadas via seeds específicos.
-- =============================================================================

-- Inserir permissoes base do sistema (motor)
INSERT INTO permissions (name, description, category) VALUES
-- Dashboard (genérico)
('dashboard:read', 'Visualizar dashboards', 'dashboard'),
('dashboard:analytics', 'Acessar analytics avancado', 'dashboard'),
('dashboard:export', 'Exportar dados do dashboard', 'dashboard'),

-- Usuarios (genérico)
('users:read', 'Visualizar usuarios', 'users'),
('users:create', 'Criar novos usuarios', 'users'),
('users:update', 'Atualizar usuarios', 'users'),
('users:delete', 'Remover usuarios', 'users'),
('users:manage_roles', 'Gerenciar roles de usuarios', 'users'),

-- Notificacoes (genérico)
('notifications:read', 'Visualizar notificacoes', 'notifications'),
('notifications:manage', 'Gerenciar configuracoes de notificacao', 'notifications'),

-- Chat (genérico)
('chat:read', 'Acessar chat', 'chat'),
('chat:write', 'Enviar mensagens no chat', 'chat'),
('chat:ai', 'Usar assistente IA no chat', 'chat'),

-- Filas de aprovacao (genérico)
('queue:read', 'Visualizar filas de aprovacao', 'queue'),
('queue:approve', 'Aprovar/rejeitar itens da fila', 'queue'),
('queue:manage', 'Gerenciar configuracoes de fila', 'queue'),

-- Relatorios (genérico)
('reports:read', 'Visualizar relatorios', 'reports'),
('reports:create', 'Criar relatorios customizados', 'reports'),
('reports:schedule', 'Agendar relatorios', 'reports'),

-- Administracao (genérico)
('admin:settings', 'Acessar configuracoes do sistema', 'admin'),
('admin:audit', 'Visualizar logs de auditoria', 'admin'),
('admin:integrations', 'Gerenciar integracoes', 'admin')

ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- Associar permissoes ao role ADMIN (acesso total - unico role genérico)
-- =============================================================================
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Associar permissoes ao role OPERATOR (acesso basico - unico role genérico)
-- =============================================================================
INSERT INTO role_permissions (role, permission_id)
SELECT 'operator', id FROM permissions
WHERE name IN (
    'dashboard:read',
    'notifications:read',
    'chat:read',
    'chat:write',
    'queue:read',
    'reports:read'
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- NOTA: Roles adicionais específicos do negócio (gestor, coordenador, rh, etc.)
-- devem ser definidos em artefatos do projeto e carregados via seeds específicos.
-- Exemplo: database/main/seeds/003_business_roles.sql
-- =============================================================================
