# Caching Strategy

Estrategia de cache em camadas para PWAs com suporte offline-first.

---

## Por que Cache em Camadas

Cache mal implementado causa "cache-hell":
- Dados antigos persistem apos mutations
- Refresh nao atualiza
- Versoes diferentes coexistem
- Usuario precisa limpar cache manualmente

A solucao e ter **camadas bem definidas** com **invalidacao coordenada**.

---

## Stack

| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| TanStack Query | 5+ | Server state (memoria) |
| @tanstack/react-query-persist-client | 5+ | Persistencia IndexedDB |
| idb-keyval | 6+ | IndexedDB wrapper |
| Zustand | 5+ | Client state + localStorage |
| Serwist | 9+ | Service Worker |

```bash
npm install @tanstack/react-query @tanstack/react-query-persist-client idb-keyval zustand
```

---

## Arquitetura de Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 5: HTTP Cache (Browser)                                 │
│  ├── Controlado por headers (Cache-Control, ETag)               │
│  └── Assets estaticos com hash no nome (Next.js automatico)     │
├─────────────────────────────────────────────────────────────────┤
│  CAMADA 4: Service Worker Cache (Serwist)                       │
│  ├── Assets com estrategia (CacheFirst, StaleWhileRevalidate)   │
│  └── Offline fallback page                                      │
├─────────────────────────────────────────────────────────────────┤
│  CAMADA 3: Query Cache - Memoria (TanStack Query)               │
│  ├── Dados do servidor, volatil                                 │
│  ├── staleTime por tipo de dado                                 │
│  └── Invalidacao via query keys                                 │
├─────────────────────────────────────────────────────────────────┤
│  CAMADA 2: Query Cache - Persistido (IndexedDB)                 │
│  ├── TanStack Query Persist com idb-keyval                      │
│  ├── maxAge alinhado com gcTime                                 │
│  └── Buster por versao do app                                   │
├─────────────────────────────────────────────────────────────────┤
│  CAMADA 1: Client State (Zustand + localStorage)                │
│  ├── Preferencias do usuario                                    │
│  ├── Filtros, tema, sidebar state                               │
│  └── Versioning com migrations                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Responsabilidades

| Camada | O que cacheia | Invalidacao |
|--------|---------------|-------------|
| HTTP | Assets estaticos | Hash no filename |
| Service Worker | Assets, offline page | Deploy (skipWaiting) |
| Query (memoria) | Server state | staleTime, mutations, socket |
| Query (persist) | Server state offline | maxAge, buster |
| Client state | Preferencias UI | Nunca (user action) |

---

## Limitacoes por Plataforma

| Plataforma | Service Worker | IndexedDB | Limitacoes |
|------------|----------------|-----------|------------|
| Chrome/Edge (Desktop) | Completo | GBs | Nenhuma |
| Firefox (Desktop) | Completo | GBs | Nenhuma |
| Android (Chrome) | Completo | ~500MB+ | Background sync pode falhar |
| **iOS Safari** | Limitado | ~500MB | **7 dias sem uso = dados apagados** |

### iOS: Regra dos 7 Dias

Safari apaga dados de origens sem interacao nos ultimos 7 dias:
- IndexedDB
- Cache API
- localStorage (em alguns casos)

**Solucao:** Solicitar `navigator.storage.persist()` apos login.

---

## Implementacao

### 1. Persister IndexedDB

```typescript
// lib/query/persister.ts
import { get, set, del } from 'idb-keyval';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const IDB_KEY = 'QUERY_CACHE';

export function createIDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(IDB_KEY, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(IDB_KEY);
    },
    removeClient: async () => {
      await del(IDB_KEY);
    },
  };
}
```

### 2. Query Provider

```typescript
// providers/QueryProvider.tsx
"use client";

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { createIDBPersister } from '@/lib/query/persister';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24,     // 24h - tempo no garbage collector
        staleTime: 1000 * 60 * 5,         // 5min - tempo ate considerar stale
        networkMode: 'offlineFirst',      // Tenta cache antes de rede
        refetchOnWindowFocus: true,       // Revalida ao focar aba
        refetchOnReconnect: true,         // Revalida ao reconectar
        retry: (count, error: any) => {
          if (error?.status >= 400 && error?.status < 500) return false;
          return count < 3;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      },
      mutations: {
        retry: false, // Mutations nao fazem retry (evita duplicacao)
      },
    },
  }));

  const [persister] = useState(() => createIDBPersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24h - igual gcTime
        buster: APP_VERSION,          // Invalida em novo deploy
      }}
    >
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </PersistQueryClientProvider>
  );
}
```

### 3. Persistent Storage (iOS)

```typescript
// lib/storage/persist.ts

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;

  const isPersisted = await navigator.storage.persisted();
  if (isPersisted) return true;

  return await navigator.storage.persist();
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;

  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
```

```typescript
// Chamar apos login bem-sucedido
// app/(auth)/login/page.tsx

const handleLoginSuccess = async () => {
  await requestPersistentStorage(); // Solicita persistencia ao iOS
  window.location.href = redirectUrl;
};
```

### 4. Invalidacao Coordenada

```typescript
// lib/cache/invalidate.ts

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION!;
const VERSION_KEY = 'app-version';

export async function checkAndInvalidateCaches() {
  const storedVersion = localStorage.getItem(VERSION_KEY);

  if (storedVersion === APP_VERSION) return; // Mesma versao, nada a fazer

  // Versao mudou - invalidar tudo

  // 1. Cache API (Service Worker caches)
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }

  // 2. Service Worker - forcar update
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.update()));
  }

  // 3. IndexedDB do TanStack Query - buster ja cuida disso

  // 4. Marcar versao atual
  localStorage.setItem(VERSION_KEY, APP_VERSION);
}

export async function clearAllCaches() {
  // Para logout ou reset manual

  // 1. TanStack Query
  // queryClient.clear() - chamar onde tem acesso ao client

  // 2. Cache API
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }

  // 3. IndexedDB
  const { del } = await import('idb-keyval');
  await del('QUERY_CACHE');

  // 4. localStorage seletivo (manter preferencias)
  localStorage.removeItem('app-version');
}
```

```typescript
// Chamar no layout raiz
// app/layout.tsx

import { checkAndInvalidateCaches } from '@/lib/cache/invalidate';

// Em useEffect no client component
useEffect(() => {
  checkAndInvalidateCaches();
}, []);
```

---

## Query Keys

Padrao hierarquico para invalidacao precisa.

### Estrutura

```typescript
// Padrao: [dominio, ...identificadores]

// Listas
['threads']
['threads', { status: 'open', limit: 20 }]

// Detalhes
['threads', threadId]
['threads', threadId, 'comments']

// Namespaces
['admin', 'users']
['admin', 'users', userId]
```

### Factory Pattern

```typescript
// lib/query/keys.ts

export const threadKeys = {
  all: ['threads'] as const,
  lists: () => [...threadKeys.all, 'list'] as const,
  list: (filters: ThreadFilters) => [...threadKeys.lists(), filters] as const,
  details: () => [...threadKeys.all, 'detail'] as const,
  detail: (id: string) => [...threadKeys.details(), id] as const,
  comments: (id: string) => [...threadKeys.detail(id), 'comments'] as const,
};

// Uso
useQuery({ queryKey: threadKeys.detail(id), ... });
queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
```

---

## staleTime por Tipo de Dado

| Tipo | staleTime | Persistir? | Motivo |
|------|-----------|------------|--------|
| Chat/Mensagens | 10-30s | Sim | Atualiza frequente, util offline |
| Listas principais | 30s-1min | Sim | Balance freshness/recursos |
| Notificacoes | 30s-1min | Nao | Sempre quer dados frescos |
| Metricas/Dashboard | 1-5min | Nao | Dados agregados |
| Perfil do usuario | 5min | Sim | Muda pouco |
| Configuracoes | 10-30min | Sim | Muda raramente |
| Labels/Tags | 30min+ | Sim | Quase estaticos |

### Exemplos

```typescript
// hooks/useThreads.ts
export function useThreads(filters?: ThreadFilters) {
  return useQuery({
    queryKey: threadKeys.list(filters ?? {}),
    queryFn: () => fetchThreads(filters),
    staleTime: 30 * 1000, // 30s
  });
}

// hooks/useConfig.ts
export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: 30 * 60 * 1000, // 30min
  });
}

// hooks/useDashboard.ts - sem persistencia
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 60 * 1000,       // 1min
    gcTime: 5 * 60 * 1000,      // 5min (menor que padrao)
    refetchInterval: 60 * 1000, // Polling 1min
  });
}
```

---

## Mutations e Invalidacao

### Padrao Basico

```typescript
// hooks/mutations/useCreateThread.ts
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
    },
  });
}
```

### Invalidacao em Cascata

```typescript
// hooks/mutations/useUpdateThread.ts
export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateData }) =>
      updateThread(id, data),
    onSuccess: (_, { id }) => {
      // Invalida lista E detalhe
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: threadKeys.detail(id) });
    },
  });
}
```

### Optimistic Updates

Para UX instantanea (toggles, likes, etc).

```typescript
// hooks/mutations/useToggleFavorite.ts
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (itemId) => {
      // 1. Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['items', itemId] });

      // 2. Snapshot do estado anterior
      const previous = queryClient.getQueryData(['items', itemId]);

      // 3. Update otimista
      queryClient.setQueryData(['items', itemId], (old: any) => ({
        ...old,
        isFavorite: !old.isFavorite,
      }));

      // 4. Retornar contexto para rollback
      return { previous };
    },
    onError: (err, itemId, context) => {
      // Rollback em caso de erro
      queryClient.setQueryData(['items', itemId], context?.previous);
    },
    onSettled: (_, __, itemId) => {
      // Revalidar para garantir sincronizacao
      queryClient.invalidateQueries({ queryKey: ['items', itemId] });
    },
  });
}
```

---

## Real-time + Cache

WebSocket atualiza o cache diretamente.

### Setup

```typescript
// hooks/useRealtimeSync.ts
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/lib/socket';
import { useEffect } from 'react';

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    // Nova mensagem - merge no cache
    socket.on('thread:message', (event) => {
      queryClient.setQueryData(
        threadKeys.comments(event.threadId),
        (old: Comment[] = []) => [...old, event.comment]
      );

      // Tambem invalida lista (contador pode mudar)
      queryClient.invalidateQueries({
        queryKey: threadKeys.lists(),
        refetchType: 'none', // Marca stale, nao refetch imediato
      });
    });

    // Servidor pode forcar invalidacao
    socket.on('cache:invalidate', (keys: string[][]) => {
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    });

    return () => {
      socket.off('thread:message');
      socket.off('cache:invalidate');
    };
  }, [socket, queryClient]);
}
```

### Uso no Layout

```typescript
// app/(app)/layout.tsx
"use client";

import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useRealtimeSync(); // Ativa sincronizacao real-time

  return <>{children}</>;
}
```

---

## Polling (Fallback)

Para projetos sem WebSocket ou como fallback.

```typescript
// hooks/useNotifications.ts
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Polling 30s
    // TanStack Query automaticamente pausa quando aba inativa
  });
}
```

### Polling vs WebSocket

| Cenario | Solucao |
|---------|---------|
| Projeto sem sockets | `refetchInterval` ativo |
| Projeto com sockets | `refetchInterval: false`, socket notifica |
| Hibrido (fallback) | Socket principal, polling como backup |

---

## Client State (Zustand)

Preferencias do usuario, separadas do server state.

```typescript
// stores/preferences.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PreferencesState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarOpen: (open: boolean) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: any, version) => {
        // Migrations quando versao muda
        if (version === 0) {
          return { ...persisted, sidebarOpen: true };
        }
        return persisted;
      },
    }
  )
);
```

### Regra: Server State vs Client State

| Tipo | Ferramenta | Exemplos |
|------|------------|----------|
| **Server State** | TanStack Query | Threads, users, config do servidor |
| **Client State** | Zustand | Tema, sidebar, filtros ativos |

**Regra:** Se o dado vem do servidor → TanStack Query.

---

## Estrutura de Arquivos

```
src/
├── providers/
│   └── QueryProvider.tsx        # TanStack + Persist setup
│
├── lib/
│   ├── query/
│   │   ├── persister.ts         # IndexedDB persister
│   │   └── keys.ts              # Query key factories
│   ├── cache/
│   │   └── invalidate.ts        # Invalidacao coordenada
│   └── storage/
│       └── persist.ts           # iOS persistent storage
│
├── hooks/
│   ├── queries/                 # useQuery hooks
│   │   ├── useThreads.ts
│   │   ├── useThread.ts
│   │   └── useConfig.ts
│   ├── mutations/               # useMutation hooks
│   │   ├── useCreateThread.ts
│   │   └── useUpdateThread.ts
│   └── useRealtimeSync.ts       # WebSocket + cache
│
└── stores/
    └── preferences.ts           # Zustand client state
```

---

## Checklist

### Setup Inicial

- [ ] Instalar dependencias (TanStack Query, persist-client, idb-keyval)
- [ ] Criar persister IndexedDB
- [ ] Configurar QueryProvider com PersistQueryClientProvider
- [ ] Definir APP_VERSION no .env
- [ ] Implementar checkAndInvalidateCaches no layout

### Por Feature

- [ ] Definir query keys com factory pattern
- [ ] Configurar staleTime apropriado
- [ ] Implementar invalidacao nas mutations
- [ ] Adicionar optimistic updates onde faz sentido
- [ ] Integrar com WebSocket se disponivel

### iOS

- [ ] Chamar requestPersistentStorage() apos login
- [ ] Testar comportamento apos 7 dias de inatividade

### Deploy

- [ ] Atualizar NEXT_PUBLIC_APP_VERSION
- [ ] Buster invalida caches automaticamente

---

## Troubleshooting

### Dados antigos persistem

1. Verificar se buster esta configurado
2. Verificar se APP_VERSION foi incrementado
3. Chamar `queryClient.invalidateQueries()` apos mutations

### iOS perde dados

1. Verificar se `requestPersistentStorage()` foi chamado
2. Usuario precisa interagir com o app a cada 7 dias
3. Considerar notificacao push para engajamento

### Cache nao atualiza com WebSocket

1. Verificar se `setQueryData` usa a query key correta
2. Verificar se o formato do dado e compativel com o cache
3. Usar `invalidateQueries` como fallback

### Memoria alta

1. Reduzir `gcTime` para dados menos importantes
2. Nao persistir dados que mudam frequentemente (dashboard)
3. Usar `queryClient.removeQueries()` no logout

---

## Referencias

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [persistQueryClient](https://tanstack.com/query/v5/docs/react/plugins/persistQueryClient)
- [WebKit Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [MDN Storage Quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
