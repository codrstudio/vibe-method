# Estudo de Viabilidade: Error Boundary Frontend

## Resumo Executivo

**Viabilidade: ALTA** - O Next.js App Router possui suporte nativo para tratamento de erros via arquivos `error.tsx` e `global-error.tsx`. A implementação é simples e não requer bibliotecas adicionais.

---

## 1. Contexto Atual

### Status do Projeto

| Aspecto | Status |
|---------|--------|
| Framework | Next.js 15.1.4 (App Router) |
| React | 19.0.0 |
| Error Boundaries | **Implementados** |
| Página de fallback existente | `offline/page.tsx` (referência) |
| Componentes UI | shadcn completo disponível |

### Problema

Quando ocorre um erro não tratado em um componente React, toda a aplicação "crasha", exibindo uma tela branca ou a stack trace de desenvolvimento. Isso resulta em:

- Experiência de usuário ruim
- Perda de contexto de navegação
- Necessidade de reload manual

---

## 2. Solução Proposta

### Conceito

Implementar **Error Boundaries** em múltiplos níveis para capturar erros e exibir uma UI elegante de recuperação, permitindo ao usuário:

1. **Voltar** para a página anterior
2. **Tentar novamente** (re-renderizar o componente)
3. **Ir para Home** como fallback

### Arquitetura de Erros no Next.js App Router

```
error.tsx         → Erros em páginas/layouts específicos
global-error.tsx  → Erros que quebram o root layout
not-found.tsx     → Páginas não encontradas (404)
```

**Hierarquia de captura:**

```
global-error.tsx (captura TUDO, inclusive root layout)
    └── app/layout.tsx
        └── app/error.tsx (captura erros em /app/*)
            └── app/(dashboard)/error.tsx (opcional, mais granular)
                └── page.tsx (onde erros ocorrem)
```

---

## 3. Implementação Proposta

### 3.1 Componente Base: ErrorCard

Componente reutilizável para exibir erros de forma consistente.

```tsx
// components/error-card.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ErrorCardProps {
  title?: string;
  message?: string;
  error?: Error;
  reset?: () => void;
  showDetails?: boolean;
}

export function ErrorCard({
  title = "Algo deu errado",
  message = "Ocorreu um erro inesperado. Tente novamente ou volte para a pagina anterior.",
  error,
  reset,
  showDetails = process.env.NODE_ENV === "development",
}: ErrorCardProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{message}</p>
          {showDetails && error && (
            <pre className="mt-4 p-3 bg-muted rounded text-xs text-left overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {reset && (
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 3.2 Error Boundary: error.tsx

Captura erros em páginas específicas (mantém o layout).

```tsx
// app/app/error.tsx
"use client";

import { ErrorCard } from "@/components/error-card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorCard error={error} reset={reset} />;
}
```

### 3.3 Global Error: global-error.tsx

Captura erros que quebram até o root layout.

```tsx
// app/global-error.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Não pode usar componentes que dependem de providers
  // pois o root layout falhou
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md border rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Erro Critico</h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro grave na aplicacao.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={reset}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Tentar novamente
              </button>
              <a
                href="/"
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Ir para Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### 3.4 Not Found: not-found.tsx

Página 404 customizada.

```tsx
// app/not-found.tsx
import { ErrorCard } from "@/components/error-card";

export default function NotFound() {
  return (
    <ErrorCard
      title="Pagina nao encontrada"
      message="A pagina que voce procura nao existe ou foi movida."
    />
  );
}
```

---

## 4. Estrutura de Arquivos

```
apps/app/
├── app/
│   ├── global-error.tsx      # [CRIAR] Erros críticos
│   ├── not-found.tsx         # [CRIAR] 404
│   ├── layout.tsx            # (existente)
│   └── app/
│       ├── error.tsx         # [CRIAR] Erros em /app/*
│       └── ...
├── components/
│   ├── error-card.tsx        # [CRIAR] Componente base
│   └── ui/                   # (existente)
```

---

## 5. Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **UX** | Usuário vê mensagem clara em vez de tela branca |
| **Recuperação** | Opções de retry, voltar, ir para home |
| **Contexto** | Layout é preservado quando possível |
| **Debug** | Stack trace visível apenas em development |
| **Padrão** | Usa convenções nativas do Next.js |

---

## 6. Considerações Técnicas

### Error Boundaries vs Try-Catch

| Cenário | Solução |
|---------|---------|
| Erros de renderização | Error Boundary (`error.tsx`) |
| Erros em event handlers | Try-catch no handler |
| Erros em async/await | Try-catch ou `.catch()` |
| Erros em Server Components | Error Boundary captura |

### Limitações

1. **global-error.tsx** não tem acesso a providers (ThemeProvider, etc.)
2. **error.tsx** deve ser Client Component (`"use client"`)
3. Erros em Server Actions precisam de tratamento separado

### Integração com React Query

O projeto usa TanStack Query. Erros de fetch já são tratados pelo QueryProvider. O Error Boundary captura apenas erros de renderização não tratados.

---

## 7. Checklist de Implementação

- [x] Criar `components/error-card.tsx`
- [x] Criar `app/global-error.tsx`
- [x] Criar `app/not-found.tsx`
- [x] Criar `app/app/error.tsx`
- [ ] Testar com erro simulado
- [ ] Validar comportamento em production build

---

## 8. Conclusão

**Recomendação: IMPLEMENTAR**

A solução é:
- **Nativa** do Next.js (sem dependências extras)
- **Simples** de implementar (4 arquivos)
- **Consistente** com padrões existentes (offline page)
- **Segura** (não expõe detalhes em produção)

O esforço é baixo e o ganho em UX é significativo.
