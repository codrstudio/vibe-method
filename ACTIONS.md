# Actions Layer

Catálogo de mutations para agentes inteligentes.

---

## Visao Geral

**Actions** é o único ponto onde a IA pode descobrir e executar mutations no sistema.

```
┌─────────────┐     HTTP      ┌─────────────┐
│  apps/app   │──────────────▶│apps/actions │◀─── IA consulta catálogo
│  (Next.js)  │  POST /act/   │  (Fastify)  │◀─── IA executa mutations
└─────────────┘   execute     └──────┬──────┘
                                     │
┌─────────────┐     HTTP             │
│apps/agents  │──────────────────────┘
│ (LangGraph) │  GET /act/catalog
└─────────────┘
```

| Aspecto | Valor |
|---------|-------|
| Localização | `apps/actions/` |
| Framework | Fastify |
| Porta (dev) | XX04 |

---

## Regra Fundamental

**TODA mutation DEVE passar pela camada Actions.**

| Correto | Incorreto |
|---------|-----------|
| `POST /act/execute` com `kb.createLibrary` | `POST /api/docs/libraries` direto |
| Frontend chama actions | Frontend chama API de serviço |

**Consequência de violar:**

Mutations fora de Actions são **invisíveis** para agentes inteligentes.
Isso quebra o fundamento: IA que permeia todas as aplicações.

---

## O que o Registry Expõe

Para cada action registrada, o catálogo expõe:

| Campo | Descrição | Uso pela IA |
|-------|-----------|-------------|
| `name` | Identificador único (`dominio.acao`) | Chamada de execução |
| `description` | Descrição legível | Entender o que faz |
| `keywords` | Palavras-chave (mín. 3) | Busca semântica |
| `inputSchema` | JSON Schema (de Zod) | Montar parâmetros |
| `outputSchema` | JSON Schema (de Zod) | Interpretar resultado |
| `permissions` | Permissões necessárias | Filtrar por acesso |

O catálogo retorna apenas actions que o usuário pode executar.

---

## Template

```typescript
// apps/actions/src/actions/kb/createLibrary.ts

import { defineAction } from '../registry';
import { z } from 'zod';

export const createLibrary = defineAction({
  name: 'kb.createLibrary',
  description: 'Cria uma nova biblioteca no Knowledge Base',
  keywords: ['criar', 'nova', 'biblioteca', 'kb'],

  inputSchema: z.object({
    name: z.string().min(1),
    groupId: z.string().uuid(),
  }),

  outputSchema: z.object({
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
  }),

  permissions: ['kb.write'],

  async execute(ctx, params) {
    // ctx contém: userId, userRole, userPermissions, source, requestId
    // params já validado pelo inputSchema

    const library = await db.libraries.create({
      name: params.name,
      groupId: params.groupId,
      createdBy: ctx.userId,
    });

    return {
      id: library.id,
      createdAt: library.createdAt.toISOString(),
    };
  },
});
```

### Convenções

| Convenção | Regra | Exemplo |
|-----------|-------|---------|
| Nome | `dominio.acao` (camelCase) | `thread.addComment` |
| Keywords | Mínimo 3, idioma do projeto | `['adicionar', 'comentario', 'thread']` |
| Permissões | Array de strings | `['thread.write']` |

---

## API REST

### POST /act/execute

Executa uma action.

```http
POST /act/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "kb.createLibrary",
  "params": {
    "name": "Documentação",
    "groupId": "uuid-here"
  }
}
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "result": {
    "id": "uuid-criado",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Resposta (erro):**
```json
{
  "success": false,
  "error": "PERMISSION_DENIED",
  "message": "User lacks permission: kb.write"
}
```

### GET /act/catalog

Retorna actions disponíveis para o usuário.

```http
GET /act/catalog
Authorization: Bearer <token>
```

Retorna apenas actions que o usuário tem permissão para executar.

---

## Auditoria

Toda execução é registrada automaticamente em MongoDB.

```typescript
{
  action: 'kb.createLibrary',
  params: { name: '...', groupId: '...' },
  result: { id: '...', createdAt: '...' },
  success: true,
  context: {
    userId: 'uuid',
    userRole: 'admin',
    source: 'ui',        // ui | copilot | agent | api
    requestId: 'uuid',
  },
  executedAt: ISODate('...'),
  durationMs: 45,
}
```

**Source tracking:** Sabe de onde veio a chamada (UI, Copilot, Agent, API externa).

---

## Estrutura de Pastas

```
apps/actions/
├── src/
│   ├── index.ts              # Fastify server
│   ├── registry.ts           # Singleton registry
│   ├── types.ts              # ActionDef, ActionContext, etc.
│   ├── routes/
│   │   ├── execute.ts        # POST /act/execute
│   │   └── catalog.ts        # GET /act/catalog
│   └── actions/
│       ├── index.ts          # Re-exports (auto-registro)
│       ├── thread/
│       │   ├── create.ts
│       │   ├── close.ts
│       │   └── addComment.ts
│       ├── kb/
│       │   └── createLibrary.ts
│       └── ...
└── package.json
```

Actions são auto-registradas ao importar em `actions/index.ts`.
