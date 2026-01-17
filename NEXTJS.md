# NEXTJS.md

Padrao Next.js do vibe-method para aplicacoes PWA.

**Relacionados:**
- [ROUTING.md](./ROUTING.md) - Padrao de roteamento URL-first (estrutura, filtros, modais)
- [USER.md](./USER.md) - Autenticacao, login multi-etapas, redirect
- [PERMISSIONS.md](./PERMISSIONS.md) - Controle de acesso e protecao de rotas

## Por que Next.js?

Next.js permite criar um unico app que contempla:

1. **Comunicacao publica** (landing pages, blog, SEO) via SSR/SSG
2. **Sistema privado** (app autenticado) via App Router
3. **PWA nativo** com service worker e instalacao

Um unico deploy serve tanto o site publico quanto o sistema do cliente.

## Stack Base

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| Next.js | 16+ | App Router, SSR, API Routes |
| React | 19+ | UI components |
| Tailwind CSS | 4 | Styling com OKLCH |
| Radix UI | latest | Primitivos acessiveis |
| shadcn/ui | latest | Componentes pre-estilizados |
| Serwist | 9+ | PWA, Service Worker |
| Zustand | 5+ | State management |

## Estrutura de Rotas

Ver [ROUTING.md](./ROUTING.md) para documentacao completa de roteamento.

```
src/app/
├── layout.tsx          # Root - metadados globais, viewport, fonts
├── globals.css         # CSS variables, Tailwind @theme
├── (public)/           # Landing pages, blog (SEO indexado)
│   ├── landing/
│   └── blog/
├── (auth)/             # Login multi-etapa
│   └── login/
├── (app)/              # Rotas protegidas (sistema)
│   ├── layout.tsx      # Sidebar, providers
│   ├── dashboard/
│   ├── {recurso}/      # CRUD: lista, novo, [id], [id]/edit
│   └── settings/       # Tabs via URL (subpastas)
├── api/                # API Routes
├── manifest.ts         # PWA manifest
├── sw.ts               # Service Worker (Serwist)
└── offline/            # Fallback offline
    └── page.tsx
```

### Route Groups

| Grupo | Proposito | Auth | SEO |
|-------|-----------|------|-----|
| `(public)` | Landing, blog | Nao | Indexado |
| `(auth)` | Login, registro | Nao | noindex |
| `(app)` | Sistema | Sim | noindex |

### Padroes de URL (Resumo)

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Lista | `/{recurso}` | `/clientes` |
| Criar | `/{recurso}/novo` | `/clientes/novo` |
| Detalhe | `/{recurso}/[id]` | `/clientes/123` |
| Editar | `/{recurso}/[id]/edit` | `/clientes/123/edit` |
| Filtros | `?status=x&q=y` | `/clientes?status=ativo` |
| Modais | `?modal={nome}` | `/clientes?modal=criar` |

Ver [ROUTING.md](./ROUTING.md) para detalhes completos.

## Configuracao Next.js

### next.config.ts

```typescript
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone", // Docker
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
    ];
  },
};

export default withSerwist(nextConfig);
```

### middleware.ts

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = ["/landing", "/blog", "/login", "/api/auth"];
const PROTECTED_ROUTES = ["/dashboard", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to landing
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  // Proteger rotas autenticadas
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

---

## PWA com Serwist

### Dependencias

```bash
npm install @serwist/next serwist
npm install -D @types/serviceworker
```

### manifest.ts

```typescript
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nome do App",
    short_name: "App",
    description: "Descricao do app",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2a2d6b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Versao desktop",
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Versao mobile",
      },
    ],
    categories: ["business", "productivity"],
  };
}
```

### sw.ts (Service Worker)

```typescript
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Background Sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Implementar sincronizacao de dados offline
}

// Push Notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const options: NotificationOptions = {
    body: data.message || "Nova notificacao",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    tag: data.tag || "default",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(data.title || "App", options));
});

// Click na notificacao
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then((c) => {
            if (c && "navigate" in c) return (c as WindowClient).navigate(url);
          });
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
```

### offline/page.tsx

```typescript
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold">Voce esta offline</h1>
      <p className="mt-2 text-muted-foreground">
        Verifique sua conexao e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Tentar novamente
      </button>
    </div>
  );
}
```

---

## Install Prompt

Componente para sugerir instalacao do PWA com 30s de delay.

### components/pwa/InstallPrompt.tsx

```typescript
"use client";

import { useEffect, useState } from "react";
import { X, Share, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop" | null;

const INSTALL_DELAY = 30000; // 30 segundos
const DISMISS_DAYS = 7; // Dias para mostrar novamente apos dismiss

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);

  useEffect(() => {
    // Verificar se ja instalado
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      localStorage.setItem("pwa-installed", "true");
      return;
    }

    // Verificar dismiss recente
    const dismissed = localStorage.getItem("pwa-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    // Detectar plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform("ios");
      // iOS nao suporta beforeinstallprompt - mostrar instrucoes manuais
      const timer = setTimeout(() => setShowPrompt(true), INSTALL_DELAY);
      return () => clearTimeout(timer);
    }

    if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Capturar evento do browser
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), INSTALL_DELAY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", new Date().toISOString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm animate-in slide-in-from-top">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Download className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              {platform === "ios" ? (
                <>
                  <p className="text-sm font-medium">Instale o app</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Toque em <Share className="h-3 w-3 inline" /> e depois em
                    "Adicionar a Tela de Inicio"
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Instale o app</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Acesso rapido direto da sua tela inicial
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {platform !== "ios" && deferredPrompt && (
              <Button size="sm" onClick={handleInstall}>
                Instalar
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Uso no Layout

```typescript
// src/app/(app)/layout.tsx
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InstallPrompt />
      {/* resto do layout */}
    </>
  );
}
```

---

## Responsividade

### Breakpoint Padrao

O breakpoint mobile/desktop e **768px** (Tailwind `md:`).

### Hook useIsMobile

```typescript
// src/hooks/use-mobile.ts
import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

### Safe Area (iOS PWA)

```css
/* src/app/globals.css */

/* PWA iOS - cor da status bar */
html {
  background-color: var(--primary);
}

body {
  @apply bg-background text-foreground;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Containers fullscreen respeitam safe area */
[data-slot="sidebar-wrapper"],
.min-h-screen {
  min-height: calc(100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom)) !important;
}
```

### Padroes Mobile

```typescript
// Header mobile (apenas em telas pequenas)
<header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
  <SidebarTrigger />
  <span className="font-semibold">App</span>
</header>

// Conteudo escondido em mobile
<span className="hidden sm:inline">Texto visivel apenas em desktop</span>

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* cards */}
</div>

// Sheet/Drawer em mobile, Dialog em desktop
const isMobile = useIsMobile();
if (isMobile) {
  return <Sheet>{/* conteudo */}</Sheet>;
}
return <Dialog>{/* conteudo */}</Dialog>;
```

---

## SEO

### Root Layout Metadata

```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#2a2d6b",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.NEXTAUTH_URL || "http://localhost:3000"
  ),
  title: {
    default: "Nome do App",
    template: "%s | Nome do App",
  },
  description: "Descricao do app para SEO",
  applicationName: "Nome do App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Nome do App",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Nome do App",
    description: "Descricao do app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nome do App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nome do App",
    description: "Descricao do app",
    images: ["/og-image.png"],
  },
};
```

### Landing Page com Schema.org

```typescript
// src/app/(public)/landing/layout.tsx
import Script from "next/script";
import type { Metadata } from "next";

const COMPANY = {
  nome: "Nome da Empresa",
  descricao: "Descricao da empresa",
  url: "https://exemplo.com",
  telefone: "+55 32 99999-9999",
  email: "contato@exemplo.com",
  endereco: "Rua Exemplo, 123",
  cidade: "Cidade",
  estado: "MG",
  cep: "36000-000",
  pais: "BR",
  fundacao: "2020",
};

export const metadata: Metadata = {
  title: `${COMPANY.nome} | Titulo Principal`,
  description: COMPANY.descricao,
  keywords: ["palavra1", "palavra2", "palavra3"],
  metadataBase: new URL(COMPANY.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: COMPANY.url,
    siteName: COMPANY.nome,
    title: COMPANY.nome,
    description: COMPANY.descricao,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: COMPANY.nome,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: COMPANY.nome,
    description: COMPANY.descricao,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Schema.org JSON-LD
const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": COMPANY.url,
  name: COMPANY.nome,
  description: COMPANY.descricao,
  url: COMPANY.url,
  telephone: COMPANY.telefone,
  email: COMPANY.email,
  foundingDate: COMPANY.fundacao,
  logo: `${COMPANY.url}/icons/icon-256.png`,
  image: `${COMPANY.url}/og-image.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY.endereco,
    addressLocality: COMPANY.cidade,
    addressRegion: COMPANY.estado,
    postalCode: COMPANY.cep,
    addressCountry: COMPANY.pais,
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
```

---

## Data Fetching

Gerenciamento de dados do servidor com cache, polling e revalidacao.

### Por que TanStack Query

Fetch manual requer reimplementar:
- Cache e invalidacao
- Deduplicacao de requests
- Retry com backoff
- Polling periodico
- Page Visibility (pausar quando aba inativa)
- Estados de loading/error

**TanStack Query** oferece tudo isso pronto, com ~10 linhas de codigo.

### Server State vs Client State

| Tipo | Ferramenta | Exemplos |
|------|------------|----------|
| **Server State** | TanStack Query | Listas, detalhes, configs do servidor |
| **Client State** | Zustand | UI (modals, filtros), preferencias, auth |

**Regra:** Se o dado vem do servidor e pode ser cacheado → TanStack Query.

### Configuracao

```typescript
// providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,       // 5 min - dados frescos
            gcTime: 10 * 60 * 1000,         // 10 min - garbage collection
            refetchOnWindowFocus: true,     // Revalida ao focar aba
            refetchOnReconnect: true,       // Revalida ao reconectar
            retry: (count, error: any) => {
              if (error?.status >= 400 && error?.status < 500) return false;
              return count < 3;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

```typescript
// src/app/layout.tsx
import { QueryProvider } from "@/providers/QueryProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

### Query Keys

Padrao: `[dominio, ...identificadores]`

```typescript
// Lista
['threads']
['threads', { status: 'open', limit: 20 }]

// Detalhe
['threads', threadId]

// Namespace
['admin', 'users']
['admin', 'users', userId]
```

### Cache (staleTime)

Tempo que dados sao considerados frescos (nao refetch automatico).

| Tipo de Dado | staleTime | Motivo |
|--------------|-----------|--------|
| Chat/Mensagens | 5-10s | Atualizacao frequente |
| Listas principais | 30s | Balance freshness/recursos |
| Notificacoes | 30s-1min | Nao critico |
| Metricas/Dashboard | 1-5min | Dados agregados |
| Configuracoes | 10min | Mudam raramente |
| Labels/Tags | 30min | Quase estaticos |

### Hooks de Query

```typescript
// hooks/useThreads.ts
import { useQuery } from "@tanstack/react-query";

export function useThreads(params?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: ["threads", params ?? {}],
    queryFn: () => fetchThreads(params),
    staleTime: 30 * 1000,  // 30s
  });
}

// hooks/useThread.ts - com condicional
export function useThread(threadId: string | null) {
  return useQuery({
    queryKey: ["threads", threadId],
    queryFn: () => fetchThread(threadId!),
    enabled: !!threadId,  // So executa se tem ID
    staleTime: 10 * 1000,
  });
}
```

### Polling

Para dados que precisam atualizar periodicamente **sem sockets**.

```typescript
// hooks/useNotifications.ts
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30 * 1000,  // Polling a cada 30s
  });
}
```

**Intervalos recomendados:**

| Tipo | Intervalo | Quando usar |
|------|-----------|-------------|
| Chat ativo | 5s | Usuario espera resposta rapida |
| Listas | 10s | Dados mudam com frequencia |
| Notificacoes | 30s | Nao critico, economiza recursos |
| Metricas | 60s | Dados agregados |
| Config | Sem polling | Invalida via mutation |

**Page Visibility:** TanStack Query automaticamente pausa polling quando aba esta inativa (`refetchOnWindowFocus: true`).

### Polling vs Sockets

| Cenario | Solucao |
|---------|---------|
| Projeto SEM sockets | `refetchInterval` ativo |
| Projeto COM sockets | `refetchInterval: false`, socket notifica |

Com sockets, o socket emite evento e o frontend invalida/atualiza cache:

```typescript
// Socket notifica, Query atualiza
socket.on("thread:message", (data) => {
  queryClient.setQueryData(["threads", data.threadId], (old) => ({
    ...old,
    messages: [...(old?.messages ?? []), data.message],
  }));
});
```

Ver [SOCKET.md](./SOCKET.md) para detalhes da camada de sockets.

### Mutations

```typescript
// hooks/useCreateThread.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThread,
    onSuccess: () => {
      // Invalidar lista para refetch
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

// hooks/useUpdateThread.ts - invalidacao em cascata
export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateData }) =>
      updateThread(id, data),
    onSuccess: (_, { id }) => {
      // Invalidar lista E detalhe
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threads", id] });
    },
  });
}
```

### Optimistic Updates

Para UX instantanea (ex: like, toggle).

```typescript
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (itemId) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ["items", itemId] });

      // Snapshot anterior
      const previous = queryClient.getQueryData(["items", itemId]);

      // Update otimista
      queryClient.setQueryData(["items", itemId], (old: any) => ({
        ...old,
        isFavorite: !old.isFavorite,
      }));

      return { previous };
    },
    onError: (err, itemId, context) => {
      // Rollback em caso de erro
      queryClient.setQueryData(["items", itemId], context?.previous);
    },
    onSettled: (_, __, itemId) => {
      // Refetch para garantir sincronizacao
      queryClient.invalidateQueries({ queryKey: ["items", itemId] });
    },
  });
}
```

### Estrutura de Hooks

```
src/hooks/
├── queries/
│   ├── useThreads.ts
│   ├── useThread.ts
│   ├── useUsers.ts
│   └── useNotifications.ts
└── mutations/
    ├── useCreateThread.ts
    ├── useUpdateThread.ts
    └── useDeleteThread.ts
```

### Checklist Data Fetching

- [ ] QueryProvider no layout raiz
- [ ] staleTime configurado por tipo de dado
- [ ] Query keys estruturadas `[dominio, ...ids]`
- [ ] `enabled` para queries condicionais
- [ ] Mutations com `invalidateQueries`
- [ ] Polling apenas quando nao tem sockets
- [ ] DevTools habilitado em dev

---

## Verificacao

### Lighthouse PWA Audit

1. Abra DevTools > Lighthouse
2. Selecione "Progressive Web App"
3. Verifique score 100 para PWA

### Checklist PWA

- [ ] Manifest.json valido
- [ ] Service Worker registrado
- [ ] Icons 192x192 e 512x512
- [ ] Icons maskable
- [ ] Funciona offline (fallback)
- [ ] HTTPS em producao

### Checklist SEO

- [ ] Title e description em todas as paginas publicas
- [ ] Open Graph images (1200x630)
- [ ] Schema.org JSON-LD na landing
- [ ] Canonical URLs
- [ ] robots.txt configurado

### Checklist Mobile

- [ ] Responsive em 320px, 375px, 768px, 1024px
- [ ] Safe area funciona no iOS
- [ ] Touch targets >= 44px
- [ ] Sem scroll horizontal