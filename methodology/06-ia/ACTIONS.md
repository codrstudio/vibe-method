# Actions Module

Catalogo de mutations do sistema, parte do Backbone Hub.

---

## Indice

1. [Visao Geral](#visao-geral) - Papel no sistema
2. [Regra Fundamental](#regra-fundamental) - Por que tudo passa por Actions
3. [O que o Registry Expoe](#o-que-o-registry-expoe) - Campos do catalogo
4. [Template de Action](#template-de-action) - Estrutura padrao
5. [API REST](#api-rest) - Endpoints
6. [Chamada Interna](#chamada-interna) - Uso por outros modulos
7. [Auditoria](#auditoria) - Registro de execucoes
8. [Estrutura de Pastas](#estrutura-de-pastas) - Organizacao
9. [Boas Praticas](#boas-praticas) - DO e DON'T

---

## Visao Geral

**Actions** e o modulo de mutations do Backbone Hub. Unico ponto onde IA e UI podem executar operacoes.

```
┌─────────────┐     HTTP      ┌──────────────────────────────────────┐
│  apps/app   │──────────────▶│           apps/backbone              │
│  (Next.js)  │  POST /act/   │                                      │
└─────────────┘   execute     │  ┌──────────────────────────────────┐│
                              │  │         Actions Module           ││
                              │  │                                  ││
                              │  │  Registry                        ││
                              │  │  ├── thread.*                    ││
                              │  │  ├── kb.*                        ││
                              │  │  └── user.*                      ││
                              │  │                                  ││
                              │  └──────────────────────────────────┘│
                              │         ▲              ▲             │
                              │         │ import       │ import      │
                              │  ┌──────┴───┐   ┌──────┴──────┐     │
                              │  │  Agents  │   │  Services   │     │
                              │  └──────────┘   └─────────────┘     │
                              └──────────────────────────────────────┘
```

| Aspecto | Valor |
|---------|-------|
| Localizacao | `apps/backbone/src/actions/` |
| Parte de | Backbone Hub (Fastify) |

---

## Regra Fundamental

**TODA mutation DEVE passar pela camada Actions.**

| Correto | Incorreto |
|---------|-----------|
| `POST /act/execute` com `kb.createLibrary` | `POST /api/docs/libraries` direto |
| Frontend chama actions | Frontend chama API de servico |

**Consequencia de violar:**

Mutations fora de Actions sao **invisiveis** para agentes inteligentes.
Isso quebra o fundamento: IA que permeia todas as aplicacoes.

---

## O que o Registry Expoe

Para cada action registrada, o catalogo expoe:

| Campo | Descricao | Uso pela IA |
|-------|-----------|-------------|
| `name` | Identificador unico (`dominio.acao`) | Chamada de execucao |
| `description` | Descricao legivel | Entender o que faz |
| `keywords` | Palavras-chave (min. 3) | Busca semantica |
| `inputSchema` | JSON Schema (de Zod) | Montar parametros |
| `outputSchema` | JSON Schema (de Zod) | Interpretar resultado |
| `permissions` | Permissoes necessarias | Filtrar por acesso |

O catalogo retorna apenas actions que o usuario pode executar.

---

## Template de Action

```typescript
// apps/backbone/src/actions/catalog/kb/createLibrary.ts

import { defineAction } from '../../registry';
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
    // ctx contem: userId, userRole, userPermissions, source, requestId
    // params ja validado pelo inputSchema

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

### Convencoes

| Convencao | Regra | Exemplo |
|-----------|-------|---------|
| Nome | `dominio.acao` (camelCase) | `thread.addComment` |
| Keywords | Minimo 3, idioma do projeto | `['adicionar', 'comentario', 'thread']` |
| Permissoes | Array de strings | `['thread.write']` |

---

## API REST

Endpoints expostos pelo Backbone para chamadas externas (App frontend, APIs).

### POST /backbone/act/execute

Executa uma action.

```http
POST /backbone/act/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "kb.createLibrary",
  "params": {
    "name": "Documentacao",
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

### GET /backbone/act/catalog

Retorna actions disponiveis para o usuario.

```http
GET /backbone/act/catalog
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "actions": [
    {
      "name": "kb.createLibrary",
      "description": "Cria uma nova biblioteca no Knowledge Base",
      "keywords": ["criar", "nova", "biblioteca", "kb"],
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "minLength": 1 },
          "groupId": { "type": "string", "format": "uuid" }
        },
        "required": ["name", "groupId"]
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "createdAt": { "type": "string", "format": "date-time" }
        }
      }
    }
  ]
}
```

Retorna apenas actions que o usuario tem permissao para executar.

---

## Chamada Interna

Outros modulos do Backbone (Agents, Services) chamam Actions diretamente via import.

### Agents → Actions

```typescript
// Em agents/triager/index.ts
import { executeAction } from '../../actions/registry';

async function actNode(state: TriagerState) {
  for (const action of state.plannedActions) {
    await executeAction(action.name, action.params, {
      userId: state.context.userId,
      userRole: state.context.userRole,
      userPermissions: state.context.permissions,
      source: 'agent',
      requestId: state.requestId,
    });
  }
}
```

### Services → Actions

```typescript
// Em services/billing/service.ts
import { executeAction } from '../../actions/registry';

async function processPayment(invoice: Invoice) {
  await executeAction('billing.recordPayment', {
    invoiceId: invoice.id,
    amount: invoice.total,
  }, systemContext);
}
```

### Vantagens da Chamada Direta

- **Zero latencia de rede**: Mesmo processo, mesmo runtime
- **Tipagem completa**: TypeScript infere tipos automaticamente
- **Sem serializacao**: Objetos passados por referencia
- **Atomicidade**: Transacoes podem ser compartilhadas

---

## Auditoria

Toda execucao é registrada automaticamente em MongoDB.

```javascript
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

### Source Tracking

Sabe de onde veio a chamada:

| Source | Origem |
|--------|--------|
| `ui` | Interface do usuario (click, form) |
| `copilot` | Assistente Copilot |
| `agent` | Agente autonomo (Gatekeeper, Worker) |
| `api` | Chamada externa via API |

---

## Estrutura de Pastas

```
apps/backbone/src/actions/     # Modulo Actions dentro do Backbone
├── index.ts                   # Exports publicos do modulo
├── registry.ts                # Singleton registry
├── types.ts                   # ActionDef, ActionContext, etc.
│
└── catalog/                   # Definicoes de actions
    ├── index.ts               # Re-exports (auto-registro)
    ├── thread/
    │   ├── create.ts
    │   ├── close.ts
    │   └── addComment.ts
    ├── kb/
    │   └── createLibrary.ts
    ├── user/
    │   └── updateProfile.ts
    └── billing/
        └── recordPayment.ts
```

Actions sao auto-registradas ao importar em `catalog/index.ts`.

**Rotas HTTP** ficam em `apps/backbone/src/routes/actions/`.

---

## Registry

### Definicao

```typescript
// registry.ts

import { z } from 'zod';

export interface ActionDef<TInput, TOutput> {
  name: string;
  description: string;
  keywords: string[];
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  permissions: string[];
  execute: (ctx: ActionContext, params: TInput) => Promise<TOutput>;
}

export interface ActionContext {
  userId: string;
  userRole: string;
  userPermissions: string[];
  source: 'ui' | 'copilot' | 'agent' | 'api';
  requestId: string;
}

const registry = new Map<string, ActionDef<unknown, unknown>>();

export function defineAction<TInput, TOutput>(
  def: ActionDef<TInput, TOutput>
): ActionDef<TInput, TOutput> {
  registry.set(def.name, def as ActionDef<unknown, unknown>);
  return def;
}

export function getAction(name: string) {
  return registry.get(name);
}

export function getAllActions() {
  return Array.from(registry.values());
}
```

### Execucao

```typescript
// routes/execute.ts

export async function executeHandler(req: Request, reply: Reply) {
  const { action, params } = req.body;
  const ctx = buildContext(req);

  const def = getAction(action);
  if (!def) {
    return reply.status(404).send({
      success: false,
      error: 'ACTION_NOT_FOUND',
      message: `Action ${action} not found`,
    });
  }

  // Verificar permissoes
  const hasPermission = def.permissions.every(
    p => ctx.userPermissions.includes(p)
  );
  if (!hasPermission) {
    return reply.status(403).send({
      success: false,
      error: 'PERMISSION_DENIED',
      message: `Missing permissions: ${def.permissions.join(', ')}`,
    });
  }

  // Validar input
  const parsed = def.inputSchema.safeParse(params);
  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      error: 'VALIDATION_ERROR',
      message: parsed.error.message,
    });
  }

  // Executar
  const start = Date.now();
  try {
    const result = await def.execute(ctx, parsed.data);

    // Auditoria
    await logExecution({
      action,
      params,
      result,
      success: true,
      context: ctx,
      durationMs: Date.now() - start,
    });

    return { success: true, result };
  } catch (error) {
    await logExecution({
      action,
      params,
      result: { error: error.message },
      success: false,
      context: ctx,
      durationMs: Date.now() - start,
    });

    return reply.status(500).send({
      success: false,
      error: 'EXECUTION_ERROR',
      message: error.message,
    });
  }
}
```

---

## Exemplos de Actions

### Thread

```typescript
// actions/thread/create.ts
export const createThread = defineAction({
  name: 'thread.create',
  description: 'Cria uma nova thread de conversa',
  keywords: ['criar', 'nova', 'thread', 'conversa', 'iniciar'],

  inputSchema: z.object({
    customerId: z.string().uuid(),
    channel: z.enum(['whatsapp', 'email', 'web']),
    initialMessage: z.string().optional(),
  }),

  outputSchema: z.object({
    id: z.string().uuid(),
    number: z.number(),
  }),

  permissions: ['thread.write'],

  async execute(ctx, params) {
    const thread = await db.threads.create({
      customerId: params.customerId,
      channel: params.channel,
      createdBy: ctx.userId,
    });

    if (params.initialMessage) {
      await db.messages.create({
        threadId: thread.id,
        content: params.initialMessage,
        direction: 'inbound',
      });
    }

    return { id: thread.id, number: thread.number };
  },
});

// actions/thread/close.ts
export const closeThread = defineAction({
  name: 'thread.close',
  description: 'Encerra uma thread de conversa',
  keywords: ['fechar', 'encerrar', 'finalizar', 'thread'],

  inputSchema: z.object({
    threadId: z.string().uuid(),
    resolution: z.string().optional(),
  }),

  outputSchema: z.object({
    closedAt: z.string().datetime(),
  }),

  permissions: ['thread.write'],

  async execute(ctx, params) {
    const thread = await db.threads.close({
      id: params.threadId,
      resolution: params.resolution,
      closedBy: ctx.userId,
    });

    return { closedAt: thread.closedAt.toISOString() };
  },
});

// actions/thread/addComment.ts
export const addComment = defineAction({
  name: 'thread.addComment',
  description: 'Adiciona comentario interno a uma thread',
  keywords: ['adicionar', 'comentario', 'nota', 'thread', 'interno'],

  inputSchema: z.object({
    threadId: z.string().uuid(),
    content: z.string().min(1),
  }),

  outputSchema: z.object({
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
  }),

  permissions: ['thread.comment'],

  async execute(ctx, params) {
    const comment = await db.comments.create({
      threadId: params.threadId,
      content: params.content,
      authorId: ctx.userId,
    });

    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
    };
  },
});
```

### Labels

```typescript
// actions/thread/addLabel.ts
export const addLabel = defineAction({
  name: 'thread.addLabel',
  description: 'Adiciona label a uma thread',
  keywords: ['adicionar', 'label', 'tag', 'classificar', 'marcar'],

  inputSchema: z.object({
    threadId: z.string().uuid(),
    label: z.string().min(1),
  }),

  outputSchema: z.object({
    labels: z.array(z.string()),
  }),

  permissions: ['thread.label'],

  async execute(ctx, params) {
    const thread = await db.threads.addLabel(
      params.threadId,
      params.label
    );

    return { labels: thread.labels };
  },
});
```

---

## Boas Praticas

### DO

- Toda mutation passa por Actions
- Keywords minimo 3, idioma consistente
- Schemas Zod para input e output
- Auditoria automatica de toda execucao
- Permissoes granulares por action
- Source tracking em toda chamada
- Nomes semanticos: `dominio.verbo`

### DON'T

- Mutations diretas em APIs de servico
- Actions sem keywords (busca semantica quebra)
- Permissoes muito amplas (usar granular)
- Ignorar validacao de input
- Pular auditoria para "performance"
- Actions que fazem multiplas coisas (uma action = uma operacao)

---

## Checklist - Nova Action

- [ ] Criar arquivo em `apps/backbone/src/actions/catalog/<dominio>/<acao>.ts`
- [ ] Definir nome `dominio.verboAcao`
- [ ] Descricao clara e legivel
- [ ] Keywords minimo 3
- [ ] InputSchema com Zod
- [ ] OutputSchema com Zod
- [ ] Permissoes necessarias
- [ ] Implementar execute()
- [ ] Re-exportar em `actions/catalog/index.ts`
- [ ] Testar via POST /backbone/act/execute
- [ ] Verificar auditoria em MongoDB
