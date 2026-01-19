# Plano: Sistema de Login com Multi-Contexto JWT + HTTP-Only Cookies

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MULTI-CONTEXTO JWT                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CONTEXTO TEAM (Equipe)              CONTEXTO CUSTOMER (Cliente)       │
│  ├─ Cookie access: access-team       ├─ Cookie access: access-customer │
│  ├─ Cookie refresh: refresh-team     ├─ Cookie refresh: refresh-cust   │
│  ├─ Secret: JWT_SECRET_TEAM          ├─ Secret: JWT_SECRET_CUSTOMER    │
│  ├─ Access TTL: 15min                ├─ Access TTL: 15min              │
│  ├─ Refresh TTL: 24h                 ├─ Refresh TTL: 7 dias            │
│  └─ Rotas: /dashboard, /hub          └─ Rotas: /portal/*               │
│                                                                         │
│  AMBOS OS COOKIES SAO httpOnly - JavaScript NAO acessa!                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Principio Fundamental

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Cookie httpOnly = Browser envia AUTOMATICAMENTE                        │
│  Servidor le cookie = Valida token                                      │
│  JavaScript NUNCA toca nos tokens = Seguranca maxima (anti-XSS)        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo Detalhado

### Login

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────>│  POST    │────>│  Valida  │────>│  Gera    │
│  Form    │     │  /login  │     │  Banco   │     │  Tokens  │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
                      ┌─────────────────────────────────┴───────┐
                      │                                         │
                ┌─────▼─────┐                           ┌───────▼───────┐
                │  Access   │                           │    Refresh    │
                │  Token    │                           │    Token      │
                │  (15min)  │                           │  (24h / 7d)   │
                └─────┬─────┘                           └───────┬───────┘
                      │                                         │
                ┌─────▼─────┐                           ┌───────▼───────┐
                │  Cookie   │                           │  Cookie       │
                │  httpOnly │                           │  httpOnly     │
                │access-team│                           │ refresh-team  │
                └───────────┘                           └───────┬───────┘
                                                                │
                                                        ┌───────▼───────┐
                                                        │  Hash salvo   │
                                                        │  no banco     │
                                                        │refresh_tokens │
                                                        └───────────────┘
```

### Request Autenticado

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  fetch() │────>│  Browser │────>│Middleware│────>│  API     │
│          │     │  anexa   │     │  valida  │     │  Route   │
│          │     │  cookies │     │  JWT     │     │          │
│          │     │  AUTO    │     │          │     │          │
└──────────┘     └──────────┘     └────┬─────┘     └──────────┘
                                       │
                                       │ Access expirado?
                                       ▼
                                 ┌───────────┐
                                 │  Refresh  │
                                 │  Flow     │
                                 └─────┬─────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │                                 │
                ┌─────▼─────┐                    ┌──────▼──────┐
                │  Refresh  │                    │  Refresh    │
                │  valido   │                    │  invalido   │
                └─────┬─────┘                    └──────┬──────┘
                      │                                 │
                ┌─────▼─────┐                    ┌──────▼──────┐
                │  Novo     │                    │  Redirect   │
                │  Access   │                    │  /login     │
                │  Cookie   │                    │             │
                └───────────┘                    └─────────────┘
```

---

## Estrutura de Arquivos

```
apps/app/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts        # POST - valida creds, gera tokens
│   │       ├── logout/route.ts       # POST - revoga refresh, limpa cookies
│   │       ├── refresh/route.ts      # POST - renova access via refresh
│   │       └── me/route.ts           # GET - retorna user logado
│   │
│   ├── login/page.tsx                # UI multi-step (atualizar)
│   └── dashboard/page.tsx            # Protegida
│
├── lib/
│   ├── auth/
│   │   ├── jwt.ts                    # sign/verify JWT (jose)
│   │   ├── password.ts               # hash/verify (bcrypt)
│   │   ├── cookies.ts                # get/set/clear cookies httpOnly
│   │   ├── tokens.ts                 # gerar access + refresh
│   │   └── config.ts                 # TTLs, secrets por contexto
│   │
│   ├── db.ts                         # Pool PostgreSQL
│   └── hooks/
│       └── use-session.ts            # Hook cliente (chama /api/auth/me)
│
└── middleware.ts                     # Protecao de rotas + refresh automatico
```

---

## Tarefas

### Fase 1: Infraestrutura Base

- [ ] **1.1** Instalar dependencias
  ```bash
  cd apps/app
  npm install bcryptjs jose pg
  npm install -D @types/bcryptjs @types/pg
  ```

- [ ] **1.2** Criar `lib/db.ts` - Pool PostgreSQL
- [ ] **1.3** Criar `lib/auth/config.ts` - Configuracao por contexto
- [ ] **1.4** Criar `lib/auth/password.ts` - bcrypt hash/verify
- [ ] **1.5** Criar `lib/auth/jwt.ts` - jose sign/verify
- [ ] **1.6** Criar `lib/auth/cookies.ts` - Manipulacao de cookies httpOnly
- [ ] **1.7** Criar `lib/auth/tokens.ts` - Gerar access + refresh

### Fase 2: API Routes

- [ ] **2.1** Criar `api/auth/login/route.ts`
  - Valida email + senha no banco
  - Gera access token (JWT, 15min)
  - Gera refresh token (UUID)
  - Salva hash do refresh no banco (refresh_tokens)
  - Seta cookies httpOnly (access + refresh)
  - Registra em login_history
  - Retorna { success: true, user: {...} }

- [ ] **2.2** Criar `api/auth/refresh/route.ts`
  - Le refresh token do cookie
  - Valida no banco (nao revogado, nao expirado)
  - Gera novo access token
  - Seta novo cookie access
  - Retorna { success: true }

- [ ] **2.3** Criar `api/auth/logout/route.ts`
  - Revoga refresh token no banco (revoked_at = NOW())
  - Limpa cookies (access + refresh)
  - Retorna { success: true }

- [ ] **2.4** Criar `api/auth/me/route.ts`
  - Le access token do cookie
  - Valida JWT
  - Busca dados atualizados do usuario no banco
  - Retorna { user: {...} }

### Fase 3: Middleware

- [ ] **3.1** Criar `middleware.ts`
  ```typescript
  // Rotas publicas: /login, /api/auth/login, /api/auth/refresh, /_next/*
  // Rotas protegidas: todas as outras
  //
  // Fluxo:
  // 1. Le cookie access-{context}
  // 2. Se existe e valido: permite
  // 3. Se expirado: tenta refresh automatico
  // 4. Se sem token ou refresh falha: redirect /login?callbackUrl=...
  ```

### Fase 4: Frontend

- [ ] **4.1** Atualizar `login/page.tsx`
  - Adicionar estado para password (valor do input)
  - Adicionar estado para error (mensagem)
  - Chamar `POST /api/auth/login`
  - `window.location.href` para /dashboard (full page refresh)

- [ ] **4.2** Criar `lib/hooks/use-session.ts`
  - Chama `GET /api/auth/me`
  - Retorna `{ user, isLoading, isAuthenticated, mutate }`

- [ ] **4.3** Adicionar logout
  - Chamar `POST /api/auth/logout`
  - `window.location.href` para /login

### Fase 5: Variaveis de Ambiente

- [ ] **5.1** Adicionar ao `.env`:
  ```bash
  # JWT - Contexto Team
  JWT_SECRET_TEAM=your-team-secret-minimum-32-characters
  JWT_ACCESS_TTL_TEAM=900        # 15 minutos em segundos
  JWT_REFRESH_TTL_TEAM=86400     # 24 horas em segundos

  # JWT - Contexto Customer (futuro)
  JWT_SECRET_CUSTOMER=your-customer-secret-minimum-32-chars
  JWT_ACCESS_TTL_CUSTOMER=900    # 15 minutos em segundos
  JWT_REFRESH_TTL_CUSTOMER=604800 # 7 dias em segundos

  # Cookie names
  AUTH_COOKIE_ACCESS_TEAM=access-team
  AUTH_COOKIE_REFRESH_TEAM=refresh-team
  AUTH_COOKIE_ACCESS_CUSTOMER=access-customer
  AUTH_COOKIE_REFRESH_CUSTOMER=refresh-customer
  ```

---

## Detalhes de Implementacao

### Cookie Config

```typescript
// lib/auth/cookies.ts
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

// Access token - vida curta
export function setAccessCookie(response: NextResponse, token: string, context: 'team' | 'customer') {
  const ttl = context === 'team' ? 900 : 900 // 15min
  response.cookies.set(`access-${context}`, token, {
    ...COOKIE_OPTIONS,
    maxAge: ttl,
  })
}

// Refresh token - vida longa
export function setRefreshCookie(response: NextResponse, token: string, context: 'team' | 'customer') {
  const ttl = context === 'team' ? 86400 : 604800 // 24h ou 7d
  response.cookies.set(`refresh-${context}`, token, {
    ...COOKIE_OPTIONS,
    maxAge: ttl,
  })
}
```

### JWT Payload

```typescript
// lib/auth/jwt.ts
interface JWTPayload {
  sub: string        // user id
  email: string
  name: string
  role: string
  context: 'team' | 'customer'
  iat: number        // issued at
  exp: number        // expiration
}
```

### Refresh Token no Banco

```typescript
// Tabela refresh_tokens (ja existe na migration 002)
// - id: UUID
// - user_id: UUID (FK users)
// - token_hash: string (hash do token, nunca plaintext)
// - expires_at: timestamp
// - revoked_at: timestamp (null se ativo)
// - device_info: JSONB
// - ip_address: string
```

### Middleware Flow

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'

const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/auth/refresh']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas publicas - permite
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Detecta contexto
  const context = pathname.startsWith('/portal') ? 'customer' : 'team'
  const accessCookie = request.cookies.get(`access-${context}`)?.value

  // Sem access token
  if (!accessCookie) {
    return tryRefreshOrRedirect(request, context)
  }

  // Valida access token
  const payload = await verifyJWT(accessCookie, context)
  if (!payload) {
    return tryRefreshOrRedirect(request, context)
  }

  // Token valido - permite
  return NextResponse.next()
}

async function tryRefreshOrRedirect(request: NextRequest, context: string) {
  const refreshCookie = request.cookies.get(`refresh-${context}`)?.value

  if (!refreshCookie) {
    return redirectToLogin(request, context)
  }

  // Tenta refresh via API interna
  try {
    const refreshResponse = await fetch(new URL('/api/auth/refresh', request.url), {
      method: 'POST',
      headers: { Cookie: `refresh-${context}=${refreshCookie}` },
    })

    if (refreshResponse.ok) {
      // Propaga os novos cookies
      const response = NextResponse.next()
      refreshResponse.headers.getSetCookie().forEach(cookie => {
        response.headers.append('Set-Cookie', cookie)
      })
      return response
    }
  } catch (e) {
    // Refresh falhou
  }

  return redirectToLogin(request, context)
}

function redirectToLogin(request: NextRequest, context: string) {
  const loginPath = context === 'customer' ? '/portal/login' : '/login'
  const url = request.nextUrl.clone()
  url.pathname = loginPath
  url.searchParams.set('callbackUrl', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

---

## Validacao

### Testar Login:
1. Acessar `/login`
2. Inserir `admin@mail.com` / `12345678`
3. Verificar:
   - Cookie `access-team` existe (httpOnly, nao visivel no JS)
   - Cookie `refresh-team` existe (httpOnly)
   - Redirect para `/dashboard`

### Testar Refresh Automatico:
1. Estar logado
2. Esperar access token expirar (15min) ou deletar cookie manualmente
3. Acessar rota protegida
4. Middleware deve fazer refresh transparente
5. Novos cookies devem ser setados

### Testar Logout:
1. Clicar logout
2. Verificar:
   - Cookies removidos
   - refresh_token marcado como revoked no banco
   - Redirect para `/login`

### Testar Protecao:
1. Limpar todos os cookies
2. Acessar `/dashboard` diretamente
3. Deve redirecionar para `/login?callbackUrl=/dashboard`

---

## Ordem de Execucao

```
Fase 1: Infraestrutura
├─ 1.1 Instalar deps
├─ 1.2 lib/db.ts
├─ 1.3 lib/auth/config.ts
├─ 1.4 lib/auth/password.ts
├─ 1.5 lib/auth/jwt.ts
├─ 1.6 lib/auth/cookies.ts
└─ 1.7 lib/auth/tokens.ts

Fase 2: API Routes
├─ 2.1 api/auth/login
├─ 2.2 api/auth/refresh
├─ 2.3 api/auth/logout
└─ 2.4 api/auth/me

Fase 3: Middleware
└─ 3.1 middleware.ts

Fase 4: Frontend
├─ 4.1 Atualizar login/page.tsx
├─ 4.2 use-session.ts
└─ 4.3 Logout

Fase 5: Env vars
└─ 5.1 Adicionar ao .env
```
