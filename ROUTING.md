# ROUTING.md

Padrao de roteamento URL-first para aplicacoes Next.js.

**Relacionados:**
- [USER.md](./USER.md) - Autenticacao, login multi-etapas, redirect apos login
- [PERMISSIONS.md](./PERMISSIONS.md) - Controle de acesso, protecao de rotas
- [NEXTJS.md](./NEXTJS.md) - Stack e configuracao Next.js

---

## Principio Fundamental

> **URL-First Navigation**: Toda tela visivel ao usuario DEVE ter uma URI unica e compartilhavel.

**Por que?**
- Compartilhar link com colaborador
- Bookmark de paginas especificas
- Deep linking apos login
- Historico de navegacao funcional
- Analytics por pagina

---

## Estrutura de Pastas

```
src/app/
├── layout.tsx              # Root layout
├── page.tsx                # Raiz → redirect inteligente
│
├── (public)/               # Rotas publicas (SEO indexado)
│   ├── layout.tsx
│   ├── landing/page.tsx
│   └── blog/[[...slug]]/page.tsx
│
├── (auth)/                 # Rotas de autenticacao
│   ├── layout.tsx
│   └── login/page.tsx
│
├── (app)/                  # Rotas protegidas (sistema)
│   ├── layout.tsx          # Sidebar, providers, auth check
│   │
│   ├── dashboard/page.tsx
│   │
│   ├── {recurso}/                    # CRUD padrao
│   │   ├── page.tsx                  # Lista
│   │   ├── novo/page.tsx             # Criar
│   │   └── [id]/
│   │       ├── page.tsx              # Detalhe (visualizacao)
│   │       └── edit/page.tsx         # Editar
│   │
│   ├── {recurso}/[id]/               # Recursos aninhados
│   │   ├── page.tsx
│   │   └── {subrecurso}/
│   │       ├── page.tsx
│   │       └── [subId]/
│   │           ├── page.tsx
│   │           └── edit/page.tsx
│   │
│   └── settings/                     # Tabs via URL
│       ├── page.tsx                  # → redirect para default
│       ├── layout.tsx                # Navegacao compartilhada
│       ├── general/page.tsx
│       ├── security/page.tsx
│       └── integrations/page.tsx
│
├── api/                    # API Routes
│   └── {recurso}/
│       ├── route.ts                  # GET (lista), POST (criar)
│       └── [id]/
│           ├── route.ts              # GET, PUT, DELETE
│           └── {acao}/route.ts       # POST (acoes especificas)
│
└── offline/page.tsx        # Fallback PWA
```

---

## Padroes de URL

### Paginas

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Raiz | `/` → redirect | `/` → `/dashboard` ou `/landing` |
| Lista | `/{recurso}` | `/clientes` |
| Criar | `/{recurso}/novo` | `/clientes/novo` |
| Detalhe | `/{recurso}/[id]` | `/clientes/123` |
| Editar | `/{recurso}/[id]/edit` | `/clientes/123/edit` |
| Deletar | `/{recurso}/[id]/delete` | `/clientes/123/delete` |
| Aninhado lista | `/{r}/[id]/{sub}` | `/posts/123/comments` |
| Aninhado detalhe | `/{r}/[id]/{sub}/[subId]` | `/posts/123/comments/456` |
| Aninhado editar | `/{r}/[id]/{sub}/[subId]/edit` | `/posts/123/comments/456/edit` |
| Tabs | `/{area}/{tab}` | `/settings/security` |
| Docs (catch-all) | `/{area}/[[...path]]` | `/docs/api/auth` |
| Offline | `/offline` | `/offline` |

### API Routes

| Tipo | Metodo | Padrao | Exemplo |
|------|--------|--------|---------|
| Listar | GET | `/api/{recurso}` | `GET /api/clientes` |
| Criar | POST | `/api/{recurso}` | `POST /api/clientes` |
| Detalhe | GET | `/api/{recurso}/[id]` | `GET /api/clientes/123` |
| Atualizar | PUT | `/api/{recurso}/[id]` | `PUT /api/clientes/123` |
| Deletar | DELETE | `/api/{recurso}/[id]` | `DELETE /api/clientes/123` |
| Acao | POST | `/api/{r}/[id]/{acao}` | `POST /api/threads/123/close` |

**Acoes como sub-rotas (nao payloads):**
```
POST /api/threads/123/close
POST /api/threads/123/assign
POST /api/threads/123/reopen
```

---

## Query Parameters

### Filtros

Filtros em query params para URLs compartilhaveis:

```
/clientes?status=ativo&cidade=SP&ordenar=nome
```

**Implementacao:**
```typescript
const searchParams = useSearchParams();
const status = searchParams.get('status');
const cidade = searchParams.get('cidade');

function updateFilters(newFilters: Record<string, string>) {
  const params = new URLSearchParams(searchParams);

  Object.entries(newFilters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });

  router.push(`${pathname}?${params.toString()}`);
}
```

### Paginacao

```
/clientes?page=3&limit=20
```

### Busca

```
/clientes?q=Joao+Silva
```

### Contexto de Origem

```
/clientes/123?from=lista
/clientes/123?from=busca
/clientes/123?from=dashboard
```

Permite botao "Voltar" saber para onde ir.

### Modais via URL

**Padrao:** `?modal={nome}`

```
/central?modal=nova           # Modal "Nova Conversa"
/central?modal=filtros        # Modal de filtros avancados
/clientes?modal=criar         # Modal de criacao rapida
/clientes?modal=importar      # Modal de importacao
/clientes/123?modal=excluir   # Modal de confirmacao
```

**Implementacao:**
```typescript
const searchParams = useSearchParams();
const modal = searchParams.get('modal');

// Renderizacao
{modal === 'nova' && <NovaConversaModal onClose={closeModal} />}
{modal === 'filtros' && <FiltrosModal onClose={closeModal} />}

// Fechar modal
function closeModal() {
  const params = new URLSearchParams(searchParams);
  params.delete('modal');
  router.replace(`${pathname}?${params.toString()}`);
}

// Abrir modal
function openModal(name: string) {
  const params = new URLSearchParams(searchParams);
  params.set('modal', name);
  router.push(`${pathname}?${params.toString()}`);
}
```

**Combinacao com filtros:**
```
/clientes?status=ativo&modal=criar
           └─ filtro ─┘  └─ modal ─┘
```

Filtro persiste quando modal fecha.

---

## Encoding de URLs

### Espacos: usar `+` em vez de `%20`

```
/docs/Guia+de+Uso
/clientes?q=Joao+Silva
```

**Implementacao:**
```typescript
function toUrlSlug(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, '+')
    .replace(/[^\w\-+]/g, '');
}

function fromUrlSlug(slug: string): string {
  return slug.replace(/\+/g, ' ');
}
```

---

## Auth com Redirect (Deep Linking)

Ver [USER.md](./USER.md) para implementacao completa de autenticacao.

**Fluxo:**
```
1. Usuario acessa:     /clientes/123/edit
2. Nao autenticado:    → /login?redirect=/clientes/123/edit
3. Apos login:         → /clientes/123/edit
```

**Middleware:**
```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = ["/landing", "/blog", "/login", "/api/auth"];
const PROTECTED_ROUTES = ["/dashboard", "/settings", "/clientes"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Redirect raiz
  if (pathname === "/") {
    const token = await getToken({ req: request });
    const destination = token ? "/dashboard" : "/landing";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Proteger rotas autenticadas
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected) {
    const token = await getToken({ req: request });
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      // Preservar pathname + query params
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
```

**Login page:**
```typescript
// login/page.tsx
export default function LoginPage({ searchParams }) {
  const redirect = searchParams.redirect || '/dashboard';

  async function onLoginSuccess() {
    router.push(redirect);
  }

  // ...
}
```

**Caso de uso:** Enviar URL para colaborador → ele acessa → faz login → continua exatamente onde deveria.

---

## Implementacoes

### Redirect Inteligente na Raiz

```typescript
// src/app/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function RootPage() {
  const session = await getServerSession();
  redirect(session ? "/dashboard" : "/landing");
}
```

### Tabs via URL (Settings Pattern)

```typescript
// settings/page.tsx
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/settings/general');  // Default tab
}
```

```typescript
// settings/layout.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/settings/general', label: 'Geral', icon: Settings },
  { href: '/settings/security', label: 'Seguranca', icon: Shield },
  { href: '/settings/integrations', label: 'Integracoes', icon: Plug },
];

export default function SettingsLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex">
      <nav className="w-48 border-r">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2",
              pathname === tab.href && "bg-muted"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

```typescript
// settings/general/page.tsx
export default function GeneralSettingsPage() {
  return <GeneralSettingsForm />;
}

// settings/security/page.tsx
export default function SecuritySettingsPage() {
  return <SecuritySettingsForm />;
}
```

### Catch-all para Docs

```typescript
// docs/[[...path]]/page.tsx
interface DocsPageProps {
  params: Promise<{ path?: string[] }>;
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { path } = await params;

  // /docs           → path = undefined
  // /docs/api       → path = ['api']
  // /docs/api/auth  → path = ['api', 'auth']

  const slug = path?.join('/') || 'index';
  const doc = await getDoc(slug);

  return <DocRenderer doc={doc} />;
}
```

### Validacao de Role no Layout

Ver [PERMISSIONS.md](./PERMISSIONS.md) para sistema completo de RBAC.

```typescript
// settings/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function SettingsLayout({ children }) {
  const { data: session, status } = useSession();

  if (status === "loading") return <Loading />;

  if (!session?.user?.roles?.includes('admin')) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
```

### Breadcrumbs Automaticos

```typescript
// components/Breadcrumbs.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const labels: Record<string, string> = {
  clientes: "Clientes",
  novo: "Novo",
  edit: "Editar",
  settings: "Configuracoes",
  general: "Geral",
  security: "Seguranca",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const label = labels[segment] || segment;

        return (
          <span key={href} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            {isLast ? (
              <span className="text-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
```

---

## Route Groups

| Grupo | Proposito | Auth | SEO |
|-------|-----------|------|-----|
| `(public)` | Landing, blog, docs publicos | Nao | Indexado |
| `(auth)` | Login, registro, recuperar senha | Nao | noindex |
| `(app)` | Sistema autenticado | Sim | noindex |

**Por persona (sistemas multi-tenant):**
```
app/
├── (hub)/         # Atendentes
├── (portal)/      # Clientes
└── (admin)/       # Administradores
```

---

## Anti-patterns

```typescript
// Tab component gerenciando state
<Tabs value={tab} onChange={setTab}>

// Renderizacao condicional por state
{activeSection === 'security' && <SecurityForm />}

// Query params para navegacao principal
/settings?tab=security

// Hash navigation
/settings#security

// Encoding com %20
/docs/Guia%20de%20Uso
```

---

## Checklist

Para cada pagina, verificar:

- [ ] URL unica (`page.tsx` proprio)
- [ ] Rotas dinamicas usam `[param]`
- [ ] Detalhe e Editar sao rotas separadas (`/[id]` vs `/[id]/edit`)
- [ ] Tabs usam subpastas, nao state
- [ ] Filtros em query params
- [ ] Paginacao em query params
- [ ] Busca em query params (`?q=termo`)
- [ ] Modais via `?modal={nome}`
- [ ] Espacos codificados como `+`
- [ ] Auth preserva redirect com filtros
- [ ] Raiz redireciona baseado em auth
- [ ] Layouts validam permissoes

---

## Anatomia de uma URL

```
/clientes/123/edit?highlight=nome&from=lista&modal=confirmar
 ├──────┘ └┘ └──┘  └──────────────────────────────────────┘
 │        │   │                      │
 │        │   │                      └── Query params (estado da view)
 │        │   └── Acao (edit, novo, delete)
 │        └── ID dinamico
 └── Recurso
```

**Exemplos completos:**

| Cenario | URL |
|---------|-----|
| Lista filtrada | `/clientes?status=ativo&ordenar=nome` |
| Lista paginada | `/clientes?page=3&limit=20` |
| Lista com busca | `/clientes?q=Joao+Silva` |
| Criar via modal | `/clientes?modal=criar` |
| Detalhe com contexto | `/clientes/123?from=lista` |
| Edicao | `/clientes/123/edit` |
| Edicao com highlight | `/clientes/123/edit?field=telefone` |
| Confirmacao de exclusao | `/clientes/123/delete` |
| Login com redirect filtrado | `/login?redirect=/clientes?status=ativo` |
