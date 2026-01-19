# Plano de Implementacao PWA

Baseado na documentacao `methodology/04-frontend/NEXTJS.md`.

**Status: IMPLEMENTADO**

---

## Resumo

Implementar PWA completo com Service Worker (Serwist), manifest, offline fallback, install prompt e caching estrategico.

---

## Pre-requisitos

- [x] Next.js 16+
- [x] App Router configurado
- [ ] HTTPS em producao

---

## Fase 1: Dependencias

- [x] @serwist/next
- [x] serwist
- [x] @tanstack/react-query
- [x] @tanstack/react-query-devtools

---

## Fase 2: Configuracao Base

- [x] `apps/app/next.config.ts` - Serwist + headers

---

## Fase 3: PWA Manifest

- [x] `apps/app/app/manifest.ts`
- [ ] Icons em `public/icons/` (gerar)
- [ ] Screenshots em `public/screenshots/` (gerar)

---

## Fase 4: Service Worker

- [x] `apps/app/app/sw.ts` - Completo com:
  - Precache
  - Offline fallback
  - Background Sync
  - Push Notifications
  - Notification Click handler

---

## Fase 5: Offline Fallback

- [x] `apps/app/app/offline/page.tsx`

---

## Fase 6: Install Prompt

- [x] `apps/app/components/pwa/InstallPrompt.tsx`
  - Deteccao iOS/Android/Desktop
  - 30s delay
  - 7 dias apos dismiss

---

## Fase 7: Metadata SEO/PWA

- [x] `apps/app/app/layout.tsx`
  - viewport com themeColor e viewportFit
  - metadata com manifest e appleWebApp
  - InstallPrompt integrado

---

## Fase 8: Safe Area CSS (iOS)

- [x] `apps/app/app/globals.css`
  - env(safe-area-inset-*)
  - min-height com svh

---

## Fase 9: TanStack Query

- [x] `apps/app/providers/QueryProvider.tsx`
  - staleTime: 5min
  - gcTime: 10min
  - refetchOnWindowFocus
  - refetchOnReconnect
  - retry com backoff

---

## Pendente

### Icons PWA (gerar manualmente)

Criar em `apps/app/public/icons/`:

- icon-192.png (192x192)
- icon-192-maskable.png (192x192, com padding)
- icon-512.png (512x512)
- icon-512-maskable.png (512x512, com padding)
- apple-touch-icon.png (180x180)

### Screenshots PWA (gerar manualmente)

Criar em `apps/app/public/screenshots/`:

- desktop.png (1280x720)
- mobile.png (390x844)

---

## Arquivos Criados/Modificados

| Arquivo | Acao |
|---------|------|
| `apps/app/next.config.ts` | Modificado (headers) |
| `apps/app/app/manifest.ts` | Criado |
| `apps/app/app/sw.ts` | Modificado (completo) |
| `apps/app/app/offline/page.tsx` | Criado |
| `apps/app/app/layout.tsx` | Modificado (metadata + providers) |
| `apps/app/app/globals.css` | Modificado (safe area) |
| `apps/app/components/pwa/InstallPrompt.tsx` | Criado |
| `apps/app/providers/QueryProvider.tsx` | Criado |

---

## Verificacao

### Checklist PWA

- [x] Manifest.ts configurado
- [x] Service Worker configurado
- [ ] Icons 192x192 e 512x512
- [ ] Icons maskable
- [x] Funciona offline (fallback)
- [ ] HTTPS em producao

### Lighthouse Audit

1. Abrir DevTools > Lighthouse
2. Selecionar "Progressive Web App"
3. Verificar score 100 para PWA

---

## Referencias

- Documentacao completa: `methodology/04-frontend/NEXTJS.md`
- Linhas 175-323: PWA com Serwist
- Linhas 348-499: Install Prompt
- Linhas 756-1005: Data Fetching Cache
