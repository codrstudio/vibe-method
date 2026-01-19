# Feature: Authentication

Sistema de autenticacao e gerenciamento de sessao multi-contexto para equipe e clientes.

**Prefixo:** AUTH

---

## Design

### DES-AUTH-001: HTTP-Only Cookie Strategy

Usar JWT armazenado em cookie HTTP-only para autenticacao segura.

**Implementacao:**
- Cookie httpOnly impede acesso via JavaScript (protecao XSS)
- SameSite=lax para protecao CSRF
- Secure=true em producao (apenas HTTPS)
- Cookies separados por contexto (equipe vs cliente)

**Trade-offs:**
- Limite de ~4KB por cookie
- Requer full page refresh apos login para garantir envio do cookie
- Mas elimina vulnerabilidades XSS relacionadas a tokens

---

### DES-AUTH-002: Multi-Context Authentication

Separar autenticacao em dois contextos com cookies independentes.

**Implementacao:**
- `session-team`: Cookie para equipe (hub), duracao 24h
- `session-customer`: Cookie para clientes (portal), duracao 7 dias
- Chaves JWT distintas por contexto (`JWT_SECRET_TEAM`, `JWT_SECRET_CUSTOMER`)
- Middleware que roteia validacao baseado no pathname

**Trade-offs:**
- Complexidade adicional de gerenciar dois fluxos
- Mas permite politicas de seguranca distintas por audiencia
- Sessao de equipe mais curta (seguranca), cliente mais longa (UX)

---

### DES-AUTH-003: Multi-Step Login Flow

Login em 3 etapas progressivas para flexibilidade.

**Implementacao:**
1. **Identificacao:** Usuario informa email ou telefone
2. **Escolha de metodo:** Password, Email OTP, WhatsApp OTP ou SMS OTP
3. **Autenticacao:** Validar credencial escolhida

**Trade-offs:**
- Mais passos que login tradicional
- Mas oferece opcoes para usuarios sem senha ou que preferem OTP
- Permite autenticacao passwordless para clientes do portal

---

### DES-AUTH-004: OTP Implementation

Codigo de uso unico enviado por email, WhatsApp ou SMS.

**Implementacao:**
- Codigo numerico de 6 digitos
- TTL de 5 minutos
- Armazenamento temporario em Redis com chave `otp:{channel}:{identifier}`
- Rate limit de 3 envios por hora por identificador
- Endpoints: `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`

**Trade-offs:**
- Dependencia de servicos externos (email, Evolution/WhatsApp)
- Custo por SMS enviado
- Mas elimina necessidade de lembrar senhas para usuarios ocasionais

---

### DES-AUTH-005: Session Validation

Validacao de sessao no middleware e server components.

**Implementacao:**
- Middleware valida token JWT em toda requisicao protegida
- Funcoes `validateTeamSession()` e `validateCustomerSession()` para API routes
- Server components usam `getServerSession()` do NextAuth
- Client components usam hook `useSession()`

**Trade-offs:**
- Validacao em cada requisicao adiciona latencia (~1-2ms)
- Mas garante que sessoes expiradas sao detectadas imediatamente

---

### DES-AUTH-006: Redirect After Login

Padrao para redirecionar usuario de volta a rota original.

**Implementacao:**
- Middleware adiciona `callbackUrl` no redirect para login
- Pagina de login le `callbackUrl` ou `redirect` dos query params
- Apos sucesso, usa `window.location.href` (full page refresh)
- Fallback para `/hub` (equipe) ou `/portal` (cliente)

**Trade-offs:**
- Full page refresh menos fluido que SPA navigation
- Mas garante que cookie de sessao seja enviado corretamente

---

### DES-AUTH-007: Role-Based Access Control (RBAC)

Controle de acesso baseado em papeis com permissoes granulares.

**Implementacao:**
- Tabelas: `permissions`, `role_permissions`, `user_permissions`
- Formato de permissao: `recurso:acao` (ex: `entregas:read`)
- Wildcards: `*` (admin), `recurso.*` (todas acoes do recurso)
- Escopo: `null` (todos) ou `'own'` (apenas proprios recursos)
- Cache de permissoes em memoria (TTL 5 min)

**Trade-offs:**
- Complexidade de gerenciar matriz de permissoes
- Mas permite controle fino sem hardcodar roles no codigo

**Refs:** vibe-method/PERMISSIONS.md

---

### DES-AUTH-008: Permission Check Flow

Verificacao de permissao em 3 camadas.

**Implementacao:**
1. **Middleware:** Bloqueia rotas nao autorizadas (server-side)
2. **API:** `withPermission()` decorator valida em cada endpoint
3. **UI:** Componente `<CanAccess>` esconde elementos sem permissao

**Trade-offs:**
- Verificacao redundante em multiplas camadas
- Mas defesa em profundidade impede acesso mesmo se uma camada falhar

---

### DES-AUTH-009: Avatar Upload System

Upload de avatar com crop circular.

**Implementacao:**
- Formatos: JPEG, PNG, GIF, WebP
- Tamanho maximo: 5MB
- Biblioteca `react-easy-crop` para crop no cliente
- API: `GET/POST/DELETE /api/avatar/[userId]`
- Cache busting via query param (`?v={timestamp}`)

**Trade-offs:**
- Crop no cliente reduz carga do servidor
- Mas requer JavaScript habilitado

---

### DES-AUTH-010: Password Change Security

Alteracao de senha com validacao dupla.

**Implementacao:**
- Requer senha atual antes de permitir alteracao
- Nova senha minimo 8 caracteres
- Confirmacao deve coincidir
- Validacao client-side para UX, server-side para seguranca
- Endpoint: `POST /api/profile`

**Trade-offs:**
- Exigir senha atual adiciona fricao
- Mas impede alteracao por sessao comprometida

---

## Dependencias

**Libs:**
- `next-auth` - Gerenciamento de sessao
- `jose` - Operacoes JWT
- `react-easy-crop` - Crop de avatar

**Infraestrutura:**
- Redis - Armazenamento de OTP e cache de sessao
- PostgreSQL - Tabelas de usuarios e permissoes

**Refs:**
- vibe-method/USER.md
- vibe-method/PERMISSIONS.md
