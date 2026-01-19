# Permissions and Access Control

Sistema de controle de acesso e protecao de rotas com RBAC.

**Relacionados:**
- [AUTH.md](./AUTH.md) - Autenticacao, login multi-etapas

---

## Indice

1. [Principio Fundamental](#principio-fundamental) - Camadas de protecao
2. [Modelo RBAC](#modelo-rbac) - Role-Based Access Control
3. [Convencao de Nomenclatura](#convencao-de-nomenclatura) - Formato e wildcards
4. [Recursos e Acoes Padrao](#recursos-e-acoes-padrao) - Catalogo
5. [Papeis (Roles)](#papeis-roles) - Tipos e adaptacoes
6. [Escopo de Permissoes](#escopo-de-permissoes) - Filtros own/null
7. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados) - Tabelas e seeds
8. [Backend: Verificacao de Permissoes](#backend-verificacao-de-permissoes) - Service e middleware
9. [Frontend: Componentes de Protecao](#frontend-componentes-de-protecao) - Context e hooks
10. [Protecao de Rotas](#protecao-de-rotas-middleware) - Middleware
11. [Navegacao Baseada em Permissoes](#navegacao-baseada-em-permissoes) - Sidebar
12. [Matriz de Permissoes](#matriz-de-permissoes-admin) - Interface admin
13. [Boas Praticas](#boas-praticas) - DO e DON'T
14. [Checklist](#checklist-de-implementacao) - Fases

---

## Principio Fundamental

**Usuario NAO acessa rota que nao tem permissao e NAO ve menus/elementos de UI que nao tem permissao.**

Protecao em camadas:
1. **Middleware** - bloqueia rotas nao autorizadas (server-side)
2. **API** - valida permissoes em cada endpoint
3. **UI** - esconde elementos que usuario nao pode usar

---

## Modelo RBAC

### Role-Based Access Control com Permissoes Granulares

```
PAPEL (Role)
    ↓
PERMISSOES (Permissions)
    ↓
RECURSOS (Resources) + ACOES (Actions)
    ↓
ESCOPO (Scope - opcional)
```

**Exemplo:**
```
Papel: gestor
  ├─ Permissoes: entregas.*, clientes.read, clientes.create
  │    ↓
  │    entregas.* → entregas:read, entregas:create, entregas:update, entregas:delete
  │    clientes.read → clientes:read
  │
  └─ Escopo: null (sem restricao) ou 'own' (apenas proprios recursos)
```

---

## Convencao de Nomenclatura

### Formato: `recurso:acao`

```typescript
// Exemplos
'entregas:read'
'entregas:create'
'usuarios:delete'
'relatorios:export'
'empresa:update'
```

### Wildcards

```typescript
'*'              // Admin - todas as permissoes
'entregas.*'     // Todas as acoes em entregas
'admin.*'        // Todas as acoes de administracao
```

---

## Recursos e Acoes Padrao

### Recursos Comuns

```typescript
type PermissionResource =
  // Operacao
  | 'entregas'     // ou 'deliveries', 'appointments', 'orders'
  | 'clientes'     // ou 'customers', 'patients'
  | 'usuarios'     // ou 'users'

  // Gestao
  | 'relatorios'   // ou 'reports'
  | 'metricas'     // ou 'metrics', 'analytics'
  | 'fechamentos'  // ou 'settlements'

  // Administracao
  | 'empresa'      // ou 'company', 'organization'
  | 'permissoes'   // ou 'permissions'
  | 'integracoes'  // ou 'integrations'

  // Especifico do dominio
  | 'central'      // Central de atendimento
  | 'automacoes'   // Automacoes/workflows
  // ... outros recursos do projeto
```

### Acoes Comuns

```typescript
type PermissionAction =
  // CRUD basico
  | 'read'         // Visualizar
  | 'create'       // Criar
  | 'update'       // Editar
  | 'delete'       // Excluir

  // Acoes especificas
  | 'assign'       // Atribuir
  | 'complete'     // Finalizar/completar
  | 'cancel'       // Cancelar
  | 'pay'          // Pagar
  | 'export'       // Exportar
  | 'respond'      // Responder
  | 'commit'       // Confirmar
  | 'manage'       // Gerenciar (configuracao)
```

**Regra**: Use verbos de acao no infinitivo em ingles.

---

## Papeis (Roles)

### Papeis Padrao

```typescript
type UserRole =
  | 'admin'        // Acesso total
  | 'gestor'       // Gestao operacional + metricas
  | 'atendente'    // Operacao do dia-a-dia
  | 'visualizador' // Apenas leitura
```

**Adapte ao dominio:** Use nomes que o cliente entende.

```
Clinica:
  - admin, gestor, recepcionista, medico

Delivery:
  - admin, gestor, atendente, motoboy

Escola:
  - admin, diretor, coordenador, professor, secretaria
```

---

## Escopo de Permissoes

Escopo limita permissoes a subconjunto de recursos.

```typescript
type PermissionScope =
  | null      // Sem restricao (todos os recursos)
  | 'own'     // Apenas recursos proprios
```

**Exemplo:**
```typescript
// Motoboy pode ver APENAS suas entregas
{
  role: 'motoboy',
  permission: 'entregas:read',
  scope: 'own'  // ← Filtra por motoboy_id
}

// Gestor pode ver TODAS as entregas
{
  role: 'gestor',
  permission: 'entregas:read',
  scope: null   // ← Sem filtro
}
```

---

## Estrutura de Banco de Dados

### Tabelas

```sql
-- Permissoes disponiveis
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Permissoes por papel
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  scope VARCHAR(20) DEFAULT NULL,  -- null | 'own'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- (Opcional) Permissoes extras por usuario
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT '{}',  -- ['entregas:export', 'relatorios:read']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indices
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_permissions_resource ON permissions(resource);
```

### Seed de Permissoes

```sql
-- Inserir permissoes base
INSERT INTO permissions (resource, action, description) VALUES
  ('entregas', 'read', 'Visualizar entregas'),
  ('entregas', 'create', 'Criar entregas'),
  ('entregas', 'update', 'Editar entregas'),
  ('entregas', 'delete', 'Excluir entregas'),
  ('entregas', 'assign', 'Atribuir entregas'),
  ('clientes', 'read', 'Visualizar clientes'),
  ('clientes', 'create', 'Criar clientes'),
  ('relatorios', 'read', 'Visualizar relatorios'),
  ('relatorios', 'export', 'Exportar relatorios')
ON CONFLICT (resource, action) DO NOTHING;

-- Admin: todas as permissoes
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'admin', id, true FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Gestor: operacional + metricas
-- (usar helper function ou script)
```

---

## Backend: Verificacao de Permissoes

### Service Layer

```typescript
// lib/permissions/service.ts

import pool from '@/lib/db/postgres';

export interface PermissionCheckResult {
  allowed: boolean;
  scope: PermissionScope;
  reason?: string;
}

/**
 * Cache em memoria (TTL 5 min)
 */
const permissionCache = new Map<string, { data: RolePermission[]; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function clearPermissionCache(role?: UserRole): void {
  if (role) permissionCache.delete(role);
  else permissionCache.clear();
}

/**
 * Busca permissoes de um papel (com cache)
 */
export async function getRolePermissions(role: UserRole): Promise<RolePermission[]> {
  const cached = permissionCache.get(role);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const result = await pool.query(
    `SELECT rp.*, p.resource, p.action, p.description
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role = $1 AND rp.granted = true`,
    [role]
  );

  const permissions = result.rows.map(row => ({
    id: row.id,
    role: row.role,
    permissionId: row.permission_id,
    granted: row.granted,
    scope: row.scope,
    resource: row.resource,
    action: row.action,
  }));

  permissionCache.set(role, {
    data: permissions,
    expires: Date.now() + CACHE_TTL,
  });

  return permissions;
}

/**
 * Verifica se papeis tem permissao
 */
export async function checkPermission(
  roles: UserRole[],
  resource: PermissionResource,
  action: PermissionAction
): Promise<PermissionCheckResult> {
  // Admin sempre tem tudo
  if (roles.includes('admin')) {
    return { allowed: true, scope: null };
  }

  // Verificar cada papel
  for (const role of roles) {
    const permissions = await getRolePermissions(role);

    // Permissao exata
    const exact = permissions.find(
      p => p.resource === resource && p.action === action
    );
    if (exact?.granted) {
      return { allowed: true, scope: exact.scope };
    }

    // Wildcard do recurso (ex: entregas.*)
    const wildcard = permissions.find(
      p => p.resource === resource && p.action === '*'
    );
    if (wildcard?.granted) {
      return { allowed: true, scope: wildcard.scope };
    }
  }

  return {
    allowed: false,
    scope: null,
    reason: `Sem permissao para ${action} em ${resource}`,
  };
}

/**
 * Verifica permissao usando string "resource:action"
 */
export async function checkPermissionString(
  roles: UserRole[],
  permission: string  // "entregas:read"
): Promise<PermissionCheckResult> {
  const [resource, action] = permission.split(':') as [PermissionResource, PermissionAction];
  return checkPermission(roles, resource, action);
}

/**
 * Aplica filtro de escopo em query SQL
 */
export function applyScopeFilter(
  scope: PermissionScope,
  resource: PermissionResource,
  userId: string,
  additionalContext?: Record<string, unknown>
): { where: string; params: unknown[] } {
  if (!scope || scope !== 'own') {
    return { where: '', params: [] };
  }

  // Aplicar escopo baseado no recurso
  switch (resource) {
    case 'entregas':
      if (additionalContext?.motoboyId) {
        return {
          where: 'AND d.motoboy_id = $SCOPE',
          params: [additionalContext.motoboyId],
        };
      }
      return { where: '', params: [] };

    default:
      return { where: '', params: [] };
  }
}
```

### Middleware de API

```typescript
// lib/permissions/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { checkPermission } from './service';

export interface PermissionMiddlewareResult {
  allowed: boolean;
  scope: PermissionScope;
  user: SessionUser | null;
  error?: NextResponse;
}

/**
 * Verifica permissao antes de executar acao
 */
export async function requirePermission(
  request: NextRequest,
  resource: PermissionResource,
  action: PermissionAction
): Promise<PermissionMiddlewareResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      allowed: false,
      scope: null,
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = session.user as SessionUser;
  const roles = user.roles || [user.role || 'atendente'];

  const result = await checkPermission(roles, resource, action);

  if (!result.allowed) {
    return {
      allowed: false,
      scope: null,
      user,
      error: NextResponse.json(
        { error: 'Forbidden', message: result.reason },
        { status: 403 }
      ),
    };
  }

  return { allowed: true, scope: result.scope, user };
}

/**
 * Decorator para proteger rotas de API
 *
 * Exemplo:
 * export const GET = withPermission('entregas', 'read', async (request, { user, scope }) => {
 *   // Implementacao
 * });
 */
export function withPermission<T>(
  resource: PermissionResource,
  action: PermissionAction,
  handler: (
    request: NextRequest,
    context: { user: SessionUser; scope: PermissionScope }
  ) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await requirePermission(request, resource, action);

    if (!result.allowed || !result.user) {
      return result.error!;
    }

    return handler(request, {
      user: result.user,
      scope: result.scope,
    });
  };
}

/**
 * Verifica multiplas permissoes (OR)
 */
export async function requireAnyPermission(
  request: NextRequest,
  checks: Array<{ resource: PermissionResource; action: PermissionAction }>
): Promise<PermissionMiddlewareResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      allowed: false,
      scope: null,
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = session.user as SessionUser;
  const roles = user.roles || [user.role || 'atendente'];

  for (const check of checks) {
    const result = await checkPermission(roles, check.resource, check.action);
    if (result.allowed) {
      return { allowed: true, scope: result.scope, user };
    }
  }

  return {
    allowed: false,
    scope: null,
    user,
    error: NextResponse.json(
      { error: 'Forbidden', message: 'Sem permissao para nenhuma das acoes' },
      { status: 403 }
    ),
  };
}
```

### Uso em Route Handlers

```typescript
// app/api/deliveries/route.ts

import { withPermission } from '@/lib/permissions/middleware';

export const GET = withPermission('entregas', 'read', async (request, { user, scope }) => {
  // user: usuario autenticado
  // scope: 'own' | null

  const deliveries = await getDeliveries({
    userId: user.id,
    scope,  // Aplicar filtro se scope === 'own'
  });

  return NextResponse.json(deliveries);
});

export const POST = withPermission('entregas', 'create', async (request, { user }) => {
  const body = await request.json();
  const delivery = await createDelivery(body, user.id);
  return NextResponse.json(delivery);
});
```

---

## Frontend: Componentes de Protecao

### Context Provider

```typescript
// contexts/PermissionContext.tsx

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { PermissionResource, PermissionAction } from '@/lib/permissions/types';

interface PermissionContextValue {
  hasPermission: (resource: PermissionResource, action: PermissionAction) => boolean;
  getPermissionScope: (resource: PermissionResource, action: PermissionAction) => PermissionScope;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  // Cache de permissoes carregado do servidor
  const permissionsCache = session?.user?.permissionsCache || new Map();

  const hasPermission = (resource: PermissionResource, action: PermissionAction): boolean => {
    if (status !== 'authenticated') return false;

    const roles = session.user.roles || [session.user.role];
    if (roles.includes('admin')) return true;

    // Verificar cache
    for (const role of roles) {
      const perms = permissionsCache.get(role) || [];

      // Exata
      if (perms.some(p => p.resource === resource && p.action === action)) {
        return true;
      }

      // Wildcard
      if (perms.some(p => p.resource === resource && p.action === '*')) {
        return true;
      }
    }

    return false;
  };

  const getPermissionScope = (resource: PermissionResource, action: PermissionAction): PermissionScope => {
    if (status !== 'authenticated') return null;

    const roles = session.user.roles || [session.user.role];

    for (const role of roles) {
      const perms = permissionsCache.get(role) || [];
      const perm = perms.find(p => p.resource === resource && (p.action === action || p.action === '*'));
      if (perm) return perm.scope;
    }

    return null;
  };

  return (
    <PermissionContext.Provider value={{
      hasPermission,
      getPermissionScope,
      isLoading: status === 'loading',
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions deve ser usado dentro de PermissionProvider');
  }
  return context;
}
```

### Hooks

```typescript
// hooks/usePermission.ts

'use client';

import { useMemo } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';

/**
 * Verifica se tem permissao
 */
export function usePermission(
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const { hasPermission, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) return false;
    return hasPermission(resource, action);
  }, [hasPermission, isLoading, resource, action]);
}

/**
 * Verifica permissao e retorna escopo
 */
export function usePermissionWithScope(
  resource: PermissionResource,
  action: PermissionAction
): { allowed: boolean; scope: PermissionScope; isLoading: boolean } {
  const { hasPermission, getPermissionScope, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) {
      return { allowed: false, scope: null, isLoading: true };
    }

    const allowed = hasPermission(resource, action);
    const scope = allowed ? getPermissionScope(resource, action) : null;

    return { allowed, scope, isLoading: false };
  }, [hasPermission, getPermissionScope, isLoading, resource, action]);
}

/**
 * Verifica multiplas permissoes (OR)
 */
export function useAnyPermission(
  checks: Array<{ resource: PermissionResource; action: PermissionAction }>
): boolean {
  const { hasPermission, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) return false;
    return checks.some(({ resource, action }) => hasPermission(resource, action));
  }, [hasPermission, isLoading, checks]);
}
```

### Componentes de Protecao

```typescript
// components/auth/CanAccess.tsx

'use client';

import { ReactNode } from 'react';
import { usePermission, useAnyPermission } from '@/hooks/usePermission';

interface CanAccessProps {
  resource: PermissionResource;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renderiza children apenas se usuario tem permissao
 *
 * Uso:
 * <CanAccess resource="entregas" action="create">
 *   <Button>Nova Entrega</Button>
 * </CanAccess>
 */
export function CanAccess({
  resource,
  action,
  children,
  fallback = null,
}: CanAccessProps) {
  const hasPermission = usePermission(resource, action);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Renderiza children se tem QUALQUER uma das permissoes
 */
export function CanAccessAny({
  checks,
  children,
  fallback = null,
}: {
  checks: Array<{ resource: PermissionResource; action: PermissionAction }>;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hasAnyPermission = useAnyPermission(checks);

  if (!hasAnyPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

---

## Protecao de Rotas (Middleware)

### Middleware Global

```typescript
// middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // Rotas publicas
  const publicRoutes = ['/login', '/api/auth', '/api/health'];
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Nao autenticado em rota protegida → login
  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Autenticado na pagina de login → home
  if (isAuthenticated && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/).*)',
  ],
};
```

### Protecao por Layout

```typescript
// app/(app)/layout.tsx

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirectUrl}`);
    }
  }, [status, pathname, router]);

  if (status === 'loading') {
    return <div>Carregando...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
```

---

## Navegacao Baseada em Permissoes

### Sidebar com Permissoes

```typescript
// components/app-sidebar.tsx

'use client';

import { CanAccess } from '@/components/auth/CanAccess';

const NAV_ITEMS = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    permission: { resource: 'relatorios', action: 'read' },
  },
  {
    title: 'Entregas',
    icon: Truck,
    href: '/entregas',
    permission: { resource: 'entregas', action: 'read' },
  },
  {
    title: 'Clientes',
    icon: Users,
    href: '/clientes',
    permission: { resource: 'clientes', action: 'read' },
  },
  {
    title: 'Configuracoes',
    icon: Settings,
    href: '/settings',
    permission: { resource: 'empresa', action: 'read' },
  },
];

export function AppSidebar() {
  return (
    <aside>
      <nav>
        {NAV_ITEMS.map(item => (
          <CanAccess
            key={item.href}
            resource={item.permission.resource}
            action={item.permission.action}
          >
            <SidebarItem {...item} />
          </CanAccess>
        ))}
      </nav>
    </aside>
  );
}
```

---

## Matriz de Permissoes (Admin)

### Interface de Configuracao

```typescript
// app/(app)/settings/permissions/page.tsx

'use client';

import { useState, useEffect } from 'react';

export default function PermissionsPage() {
  const [matrix, setMatrix] = useState<PermissionMatrix[]>([]);

  useEffect(() => {
    fetch('/api/permissions/matrix')
      .then(res => res.json())
      .then(setMatrix);
  }, []);

  const updatePermission = async (role: string, item: PermissionMatrix, granted: boolean) => {
    await fetch('/api/permissions/matrix', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        resource: item.resource,
        action: item.action,
        granted,
      }),
    });

    // Atualizar estado local
    setMatrix(prev => prev.map(p =>
      p.resource === item.resource && p.action === item.action
        ? { ...p, roles: { ...p.roles, [role]: { granted } } }
        : p
    ));
  };

  return (
    <div>
      <h1>Matriz de Permissoes</h1>

      <table>
        <thead>
          <tr>
            <th>Recurso</th>
            <th>Acao</th>
            <th>Admin</th>
            <th>Gestor</th>
            <th>Atendente</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map(item => (
            <tr key={`${item.resource}:${item.action}`}>
              <td>{item.resource}</td>
              <td>{item.action}</td>
              <td>
                <Checkbox
                  checked={item.roles.admin?.granted}
                  disabled={true}  // Admin sempre tem tudo
                />
              </td>
              <td>
                <Checkbox
                  checked={item.roles.gestor?.granted}
                  onChange={(checked) => updatePermission('gestor', item, checked)}
                />
              </td>
              <td>
                <Checkbox
                  checked={item.roles.atendente?.granted}
                  onChange={(checked) => updatePermission('atendente', item, checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Boas Praticas

### DO

- **Sempre verificar no backend** - Frontend pode ser burlado
- **Usar cache** - Permissoes mudam pouco, cachear 5 min
- **Deny by default** - Sem permissao explicita = negado
- **Nomes do dominio** - Usar termos que o cliente entende
- **Auditar acoes sensiveis** - Log de mudancas em permissoes
- **Admin sempre pode tudo** - Simplifica logica

### DON'T

- **Hardcodar roles** - Evitar `if (user.role === 'admin')`
- **So no frontend** - API deve validar independente
- **Permissoes muito granulares** - Balance entre controle e usabilidade
- **Ignorar escopo** - Medico ver paciente de outro é vazamento
- **Cache infinito** - Permissoes podem mudar, TTL é essencial

---

## Checklist de Implementacao

### Setup Inicial
- [ ] Criar tabelas `permissions` e `role_permissions`
- [ ] Definir recursos e acoes do dominio
- [ ] Criar seed com permissoes base
- [ ] Criar seed com matriz padrao de papeis

### Backend
- [ ] Implementar service layer (`lib/permissions/service.ts`)
- [ ] Implementar middleware (`lib/permissions/middleware.ts`)
- [ ] Adicionar cache de permissoes (5 min TTL)
- [ ] Proteger todos os endpoints de API com `withPermission()`
- [ ] Implementar aplicacao de escopo em queries

### Frontend
- [ ] Criar `PermissionContext` e `PermissionProvider`
- [ ] Criar hooks: `usePermission()`, `useAnyPermission()`
- [ ] Criar componentes: `<CanAccess>`, `<CanAccessAny>`
- [ ] Proteger items de navegacao
- [ ] Proteger botoes/acoes com permissoes
- [ ] Implementar pagina de configuracao de permissoes (admin)

### Middleware de Rotas
- [ ] Implementar middleware global de autenticacao
- [ ] Configurar rotas publicas
- [ ] Implementar redirect apos login

### Testes
- [ ] Testar que admin tem todas as permissoes
- [ ] Testar que usuario sem permissao recebe 403
- [ ] Testar escopo 'own' filtra corretamente
- [ ] Testar que UI esconde elementos sem permissao
- [ ] Testar wildcards funcionam corretamente
