# User Area

Sistema completo de gerenciamento de usuario com autenticacao multi-metodo, perfil e seguranca.

**Relacionados:**
- [ROUTING.md](./ROUTING.md) - Roteamento URL-first, deep linking, redirect apos login
- [PERMISSIONS.md](./PERMISSIONS.md) - Controle de acesso RBAC
- [NEXTJS.md](./NEXTJS.md) - Stack e middleware de autenticacao

---

## Autenticacao HTTP-Only Cookie

Padrao de autenticacao segura usando JWT armazenado em cookie HTTP-only.

### Por que HTTP-Only Cookie?

| Aspecto | Cookie HTTP-Only | localStorage/sessionStorage |
|---------|------------------|----------------------------|
| **XSS** | Imune (JS nao acessa) | Vulneravel |
| **CSRF** | Mitigado com SameSite | N/A |
| **Persistencia** | Controlada pelo servidor | Controlada pelo cliente |
| **Tamanho** | ~4KB limite | ~5MB |

### Implementacao com NextAuth.js

NextAuth gerencia automaticamente o cookie de sessao:

```typescript
// lib/auth/config.ts

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // ... validacao de credenciais
    }),
  ],

  session: {
    strategy: "jwt",        // JWT armazenado em cookie
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  // ... callbacks para popular JWT
};
```

### Caracteristicas do Cookie

| Propriedade | Valor | Descricao |
|-------------|-------|-----------|
| `name` | `next-auth.session-token` | Nome padrao NextAuth |
| `httpOnly` | `true` | JavaScript nao acessa |
| `secure` | `true` (HTTPS) | Apenas conexoes seguras |
| `sameSite` | `lax` | Protecao CSRF |
| `path` | `/` | Disponivel em todas rotas |
| `maxAge` | Configuravel | Tempo de expiracao |

### Leitura do Token

**Server-side (Middleware/API):**
```typescript
import { getToken } from "next-auth/jwt";

const token = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET,
});

// token.id, token.roles, token.clinic_id, etc.
```

**Server Components:**
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const session = await getServerSession(authOptions);
// session.user.id, session.user.roles, etc.
```

**Client Components:**
```typescript
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
// session.user.id, session.user.roles, etc.
```

### Fluxo de Autenticacao

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────>│  NextAuth   │────>│   Banco     │
│   Login     │     │  /api/auth  │     │   (users)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           v
                    ┌─────────────┐
                    │  Set-Cookie │
                    │  httpOnly   │
                    │  JWT signed │
                    └─────────────┘
```

### Implicacoes para o Frontend

1. **Full Page Refresh apos login**: Necessario para browser enviar cookie
   ```typescript
   // CORRETO
   window.location.href = "/dashboard";

   // INCORRETO (cookie pode nao ser enviado)
   router.push("/dashboard");
   ```

2. **Nao tentar ler token no cliente**: `document.cookie` nao mostra cookies httpOnly

3. **Usar hooks do NextAuth**: `useSession()` faz request interno para obter sessao

### Variavel de Ambiente

```bash
# Obrigatoria - usada para assinar o JWT
NEXTAUTH_SECRET=sua-chave-secreta-minimo-32-caracteres

# Gerar chave segura:
openssl rand -base64 32
```

---

## Autenticacao Multi-Etapas

Login em 3 passos progressivos que oferece flexibilidade sem comprometer seguranca.

### Fluxo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ETAPA 1   │────>│   ETAPA 2   │────>│   ETAPA 3   │
│   Email/    │     │   Escolha   │     │   Senha/    │
│   Telefone  │     │   Metodo    │     │   Codigo    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Etapa 1: Identificacao

Usuario informa email ou telefone.

```typescript
// Estado inicial
const [step, setStep] = useState<"email" | "method" | "password" | "otp">("email");
const [email, setEmail] = useState("");
```

### Etapa 2: Escolha do Metodo

Usuario escolhe como deseja autenticar:

| Metodo | Icone | Descricao |
|--------|-------|-----------|
| `password` | KeyRound | Senha cadastrada |
| `email_otp` | Mail | Codigo por email |
| `whatsapp_otp` | Smartphone | Codigo por WhatsApp |
| `sms_otp` | MessageSquare | Codigo por SMS |

```typescript
type AuthMethod = "password" | "email_otp" | "whatsapp_otp" | "sms_otp";

const AUTH_METHODS: AuthMethodOption[] = [
  {
    id: "password",
    icon: <KeyRound className="h-6 w-6" />,
    label: "Senha",
    description: "Usar minha senha cadastrada",
  },
  {
    id: "email_otp",
    icon: <Mail className="h-6 w-6" />,
    label: "Codigo por Email",
    description: "Receber codigo no email",
  },
  // ... outros metodos
];
```

### Etapa 3: Autenticacao

**Se escolheu senha:**
- Input de senha com toggle de visibilidade
- Validacao via NextAuth credentials provider

**Se escolheu OTP:**
- Sistema envia codigo via canal escolhido (email/WhatsApp/SMS)
- Input numerico de 6 digitos
- Opcao de reenviar codigo
- Validacao via API `/api/auth/verify-otp`

### Implementacao de Referencia

```typescript
// portal/src/app/(auth)/login/page.tsx

const handleMethodSelect = async (method: AuthMethod) => {
  setSelectedMethod(method);

  if (method === "password") {
    setStep("password");
  } else {
    // Enviar OTP
    await fetch("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, channel: method }),
    });
    setStep("otp");
  }
};
```

### Navegacao

- Botao "Voltar" em cada etapa permite retroceder
- Estado mantido durante navegacao

---

## Redirect Apos Login

Padrao para redirecionar usuario de volta a rota original apos autenticacao.

### Fluxo Completo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Usuario    │────>│  Middleware │────>│    Login    │────>│  Rota       │
│  acessa     │     │  intercepta │     │  autentica  │     │  original   │
│  /rota-x    │     │  redireciona│     │  redireciona│     │  /rota-x    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          v                    v
                    /login?callbackUrl=   window.location.href
                    /rota-x               (full page refresh)
```

### Camada 1: Middleware (Server-Side)

O middleware intercepta rotas protegidas e redireciona para login com `callbackUrl`.

```typescript
// middleware.ts

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // Rotas publicas (nao requerem autenticacao)
  const publicRoutes = ["/login", "/api/auth", "/api/health"];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Nao autenticado em rota protegida -> redireciona para login
  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Autenticado na pagina de login -> redireciona para home
  if (isAuthenticated && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/).*)",
  ],
};
```

### Camada 2: Layout (Client-Side Fallback)

Fallback client-side caso middleware nao intercepte (ex: navegacao SPA).

```typescript
// app/(app)/layout.tsx

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirectUrl}`);
    }
  }, [status, pathname, router]);

  // ...
}
```

### Camada 3: Login Page (Leitura e Redirect)

Login le o parametro e redireciona apos sucesso.

```typescript
// app/(auth)/login/page.tsx

function LoginForm() {
  const searchParams = useSearchParams();

  // Aceita ambos: middleware usa "callbackUrl", layout usa "redirect"
  const redirectUrl = searchParams.get("callbackUrl")
    || searchParams.get("redirect")
    || "/home"; // default

  const handleLoginSuccess = async () => {
    // IMPORTANTE: usar window.location.href para full page refresh
    // Isso garante que o cookie de sessao seja lido corretamente
    await new Promise((resolve) => setTimeout(resolve, 100)); // aguarda cookie
    window.location.href = decodeURIComponent(redirectUrl);
  };
}
```

### Por que Full Page Refresh?

Usar `window.location.href` em vez de `router.push`:

1. **Cookie de sessao**: NextAuth seta cookie apos login. `router.push` pode navegar antes do cookie estar disponivel.
2. **Estado limpo**: Full refresh garante que todos os stores/caches sejam reinicializados com usuario autenticado.
3. **Middleware re-executa**: Garante que o middleware valide a nova sessao.

### Query Params Suportados

| Param | Origem | Prioridade |
|-------|--------|------------|
| `callbackUrl` | Middleware | 1 (maior) |
| `redirect` | Layout client-side | 2 |
| default | Hardcoded | 3 (fallback) |

### Rotas Publicas

Definir no middleware quais rotas NAO requerem autenticacao:

```typescript
const publicRoutes = [
  "/login",      // Pagina de login
  "/landing",    // Landing page
  "/offline",    // Pagina offline (PWA)
  "/api/auth",   // Endpoints NextAuth
  "/api/health", // Health check
];
```

---

## Arquitetura Multi-Contexto

Sistema de autenticacao com multiplos contextos (equipe e cliente) usando cookies separados.

### Estrutura de Rotas

| Rota | Contexto | Descricao |
|------|----------|-----------|
| `/landing` | Publico | Landing page institucional |
| `/login` | Equipe | Login da area de trabalho |
| `/hub` | Equipe (protegido) | App de trabalho da equipe |
| `/portal/landing` | Publico | Landing page area do cliente |
| `/portal/login` | Cliente | Login da area do cliente |
| `/portal` | Cliente (protegido) | Area do cliente |

### Cookies por Contexto

| Cookie | Contexto | Duracao | Uso |
|--------|----------|---------|-----|
| `session-team` | Equipe | 24h | Autenticacao do hub |
| `session-customer` | Cliente | 7 dias | Autenticacao do portal |

Ambos os cookies sao httpOnly, secure e SameSite=lax.

### Redirects Automaticos

```
/ (raiz)
├── Usuario logado (session-team) → /hub
└── Usuario nao logado → /landing

/portal
├── Usuario logado (session-customer) → /portal (dashboard)
└── Usuario nao logado → /portal/landing
```

### LoginForm Parametrizavel

Componente unico de login reutilizado em ambos os contextos:

```typescript
// components/auth/LoginForm.tsx

interface LoginFormProps {
  apiEndpoint: string;        // "/api/auth/team" ou "/api/auth/customer"
  cookieName: string;         // "session-team" ou "session-customer"
  redirectTo: string;         // "/hub" ou "/portal"
  title?: string;
  subtitle?: string;
}

export function LoginForm({
  apiEndpoint,
  cookieName,
  redirectTo,
  title = "Login",
  subtitle,
}: LoginFormProps) {
  // ... implementacao
}
```

**Uso na area da equipe:**
```typescript
// app/(hub)/login/page.tsx

<LoginForm
  apiEndpoint="/api/auth/team"
  cookieName="session-team"
  redirectTo="/hub"
  title="Area da Equipe"
/>
```

**Uso na area do cliente:**
```typescript
// app/(portal)/portal/login/page.tsx

<LoginForm
  apiEndpoint="/api/auth/customer"
  cookieName="session-customer"
  redirectTo="/portal"
  title="Area do Cliente"
/>
```

### Middleware Multi-Contexto

```typescript
// middleware.ts

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // === Contexto Portal (Cliente) ===
  if (pathname.startsWith("/portal")) {
    const customerSession = request.cookies.get("session-customer");

    // Rotas publicas do portal
    if (pathname === "/portal/login" || pathname === "/portal/landing") {
      if (customerSession) {
        // Ja logado -> redireciona para portal
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      return NextResponse.next();
    }

    // Rotas protegidas do portal
    if (!customerSession) {
      return NextResponse.redirect(new URL("/portal/landing", request.url));
    }

    return NextResponse.next();
  }

  // === Contexto Hub (Equipe) ===
  const teamSession = request.cookies.get("session-team");

  // Rotas publicas do hub
  if (pathname === "/login" || pathname === "/landing") {
    if (teamSession) {
      return NextResponse.redirect(new URL("/hub", request.url));
    }
    return NextResponse.next();
  }

  // Rota raiz
  if (pathname === "/") {
    if (teamSession) {
      return NextResponse.redirect(new URL("/hub", request.url));
    }
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  // Rotas protegidas do hub
  if (!teamSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
```

### Estrutura de Pastas (Next.js App Router)

```
app/
├── (public)/
│   ├── landing/page.tsx         # Landing institucional
│   └── portal/
│       └── landing/page.tsx     # Landing do cliente
│
├── (hub)/
│   ├── login/page.tsx           # Login equipe
│   ├── hub/
│   │   ├── layout.tsx           # Layout protegido
│   │   └── page.tsx             # Dashboard equipe
│   └── ...
│
└── (portal)/
    └── portal/
        ├── login/page.tsx       # Login cliente
        ├── layout.tsx           # Layout protegido
        └── page.tsx             # Dashboard cliente
```

### API Endpoints

| Endpoint | Metodo | Cookie | Descricao |
|----------|--------|--------|-----------|
| `/api/auth/team` | POST | session-team | Login da equipe |
| `/api/auth/customer` | POST | session-customer | Login do cliente |
| `/api/auth/team/logout` | POST | - | Logout equipe |
| `/api/auth/customer/logout` | POST | - | Logout cliente |

### Validacao de Sessao

```typescript
// lib/auth/validate-session.ts

export async function validateTeamSession(
  request: NextRequest
): Promise<TeamUser | null> {
  const token = request.cookies.get("session-team")?.value;
  if (!token) return null;

  try {
    const payload = await verifyJWT(token, process.env.JWT_SECRET_TEAM!);
    return payload as TeamUser;
  } catch {
    return null;
  }
}

export async function validateCustomerSession(
  request: NextRequest
): Promise<Customer | null> {
  const token = request.cookies.get("session-customer")?.value;
  if (!token) return null;

  try {
    const payload = await verifyJWT(token, process.env.JWT_SECRET_CUSTOMER!);
    return payload as Customer;
  } catch {
    return null;
  }
}
```

### Variaveis de Ambiente

```bash
# Chaves JWT separadas por contexto
JWT_SECRET_TEAM=chave-secreta-equipe-32-caracteres
JWT_SECRET_CUSTOMER=chave-secreta-cliente-32-caracteres

# Gerar chaves:
openssl rand -base64 32
```

---

## Avatar Upload

Sistema robusto de upload de avatar com crop circular.

### Caracteristicas

| Feature | Implementacao |
|---------|---------------|
| **Formatos** | JPEG, PNG, GIF, WebP |
| **Tamanho max** | 5MB |
| **Crop** | Circular, aspect ratio 1:1 |
| **Zoom** | 1x a 3x |
| **Rotacao** | -180° a +180° |
| **Preview** | Em tempo real |

### Formatos Aceitos

```typescript
// lib/image-utils.ts
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

### Componentes

**AvatarUpload** - Componente principal
- Exibe avatar atual com fallback para iniciais
- Overlay com icone de camera no hover
- Botoes "Alterar foto" e "Remover"
- Integra com AvatarCropper

**AvatarCropper** - Modal de edicao
- Usa biblioteca `react-easy-crop`
- Crop circular em tempo real
- Controles de zoom (slider)
- Controles de rotacao (slider + reset)
- Preview instantaneo

### Fluxo de Upload

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Selecao   │────>│    Crop     │────>│   Upload    │
│   Arquivo   │     │  (Modal)    │     │   Storage   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       v                   v                   v
   Validacao          react-easy-crop     /api/avatar
   (tipo, tamanho)    (zoom, rotate)      (armazena)
```

### API de Avatar

```typescript
// GET /api/avatar/[userId]
// Retorna imagem do avatar ou 404

// POST /api/avatar
// Body: FormData com blob do avatar cropado
// Retorna: { url: "/api/avatar/{userId}" }

// DELETE /api/avatar
// Remove avatar do usuario
```

### Implementacao de Referencia

```typescript
// components/profile/AvatarUpload.tsx

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
  userInitials,
  onAvatarChange,
}: AvatarUploadProps) {
  const handleCropComplete = async (croppedBlob: Blob) => {
    // Upload do novo avatar
    const newUrl = await uploadAvatar(userId, croppedBlob);

    // Atualiza perfil no banco
    await updateProfileAvatar(userId, newUrl);

    // Notifica componente pai
    onAvatarChange(newUrl);
  };
}
```

### Cache Busting

Avatar usa query param para invalidar cache:

```typescript
<AvatarImage
  src={`${currentAvatarUrl}?v=${avatarKey}`}
  alt={userName}
/>
```

---

## Area de Seguranca

### Alteracao de Senha

Formulario com 3 campos e validacao completa:

| Campo | Validacao |
|-------|-----------|
| Senha atual | Obrigatorio, verificado no backend |
| Nova senha | Obrigatorio, minimo 8 caracteres |
| Confirmar senha | Deve coincidir com nova senha |

### Caracteristicas

- Toggle de visibilidade para cada campo (icone olho)
- Validacao client-side antes de submit
- Feedback de erro inline por campo
- Loading state durante submit
- Toast de sucesso/erro

### Implementacao de Referencia

```typescript
// components/profile/ChangePasswordForm.tsx

const validate = (): boolean => {
  const newErrors = { currentPassword: "", newPassword: "", confirmPassword: "" };

  if (!formData.currentPassword) {
    newErrors.currentPassword = "Senha atual e obrigatoria";
  }

  if (!formData.newPassword) {
    newErrors.newPassword = "Nova senha e obrigatoria";
  } else if (formData.newPassword.length < 8) {
    newErrors.newPassword = "A senha deve ter no minimo 8 caracteres";
  }

  if (formData.newPassword !== formData.confirmPassword) {
    newErrors.confirmPassword = "As senhas nao coincidem";
  }

  setErrors(newErrors);
  return !Object.values(newErrors).some(Boolean);
};
```

### API de Alteracao

```typescript
// POST /api/profile
// Body: { currentPassword, newPassword }
// Verifica senha atual antes de atualizar
```

---

## Dependencias

```json
{
  "dependencies": {
    "react-easy-crop": "^5.0.0",
    "next-auth": "^4.24.0"
  }
}
```

---

## Estrutura de Arquivos

```
portal/src/
├── app/(auth)/
│   └── login/
│       └── page.tsx              # Login multi-etapas
│
├── components/profile/
│   ├── AvatarUpload.tsx          # Upload + preview
│   ├── AvatarCropper.tsx         # Modal de crop
│   └── ChangePasswordForm.tsx    # Alteracao de senha
│
├── lib/
│   └── image-utils.ts            # Validacao + crop + upload
│
└── api/
    ├── auth/
    │   ├── send-otp/route.ts     # Envio de OTP
    │   └── verify-otp/route.ts   # Verificacao de OTP
    ├── avatar/
    │   └── [userId]/route.ts     # GET/POST/DELETE avatar
    └── profile/route.ts          # Alteracao de senha
```

---

## Boas Praticas

1. **Validacao dupla**: Client-side para UX, server-side para seguranca
2. **Feedback visual**: Loading states, toasts, erros inline
3. **Acessibilidade**: Labels associados, focus management, ARIA
4. **Responsividade**: Layout adaptavel para mobile
5. **Cache**: Invalidacao apos upload de avatar
6. **Seguranca**: Verificacao de senha atual antes de alteracao
