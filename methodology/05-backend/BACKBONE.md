# Backbone Hub

Hub de servicos backend que unifica services, agents, actions e knowledge.

---

## Indice

1. [Visao Geral](#visao-geral) - Papel no sistema
2. [Arquitetura do Hub](#arquitetura-do-hub) - Modulos internos
3. [Estrutura de Pastas](#estrutura-de-pastas) - Organizacao
4. [Modulo Services](#modulo-services) - Notifications, scheduling
5. [Modulo Agents](#modulo-agents) - LangGraph
6. [Modulo Actions](#modulo-actions) - Catalogo de mutations
7. [Modulo Knowledge](#modulo-knowledge) - RAG e busca
8. [Comunicacao Interna](#comunicacao-interna) - Entre modulos
9. [API REST](#api-rest) - Endpoints
10. [Eventos](#eventos) - Redis pub/sub
11. [Boas Praticas](#boas-praticas) - DO e DON'T

---

## Visao Geral

**Backbone** e o hub central que unifica todos os servicos backend em um unico processo.

```
┌─────────────┐                    ┌──────────────────────────────────────┐
│  apps/app   │───── chamadas ────▶│           apps/backbone              │
│  (Next.js)  │◀──── eventos ──────│              (Fastify)               │
└─────────────┘                    │                                      │
                                   │  ┌──────────┐  ┌─────────────────┐  │
┌─────────────┐                    │  │ Services │  │     Agents      │  │
│apps/socket  │◀─── emite ─────────│  │ notif    │  │ triager,copilot │  │
│ (Socket.io) │     eventos        │  │ schedule │◀─▶│ workers         │  │
└─────────────┘                    │  │ billing  │  │                 │  │
                                   │  └──────────┘  └─────────────────┘  │
                                   │         │              │            │
                                   │         ▼              ▼            │
                                   │  ┌──────────────────────────────┐  │
                                   │  │          Actions             │  │
                                   │  │    (catalogo de mutations)   │  │
                                   │  └──────────────────────────────┘  │
                                   │                │                    │
                                   │                ▼                    │
                                   │  ┌──────────────────────────────┐  │
                                   │  │         Knowledge            │  │
                                   │  │      (RAG, full-text)        │  │
                                   │  └──────────────────────────────┘  │
                                   └──────────────────────────────────────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  Database   │
                                            │  Redis/PG   │
                                            └─────────────┘
```

| Aspecto | Valor |
|---------|-------|
| Localizacao | `apps/backbone/` |
| Framework | Fastify |
| Porta (dev) | XX02 |

---

## Arquitetura do Hub

O backbone unifica 4 modulos com responsabilidades distintas:

| Modulo | Responsabilidade | Documentacao |
|--------|------------------|--------------|
| **services** | Logica orquestrada (notifications, scheduling, billing) | Este arquivo |
| **agents** | Raciocinio LLM (triager, copilot, workers) | [AGENTES.md](../06-ia/AGENTES.md) |
| **actions** | Catalogo de mutations (thread.*, kb.*, user.*) | [ACTIONS.md](../06-ia/ACTIONS.md) |
| **knowledge** | Knowledge Base e RAG (busca, indexacao) | [COPILOT.md](../06-ia/COPILOT.md) |

### Papel de Cada Modulo

```
Services = "COMO orquestrar" (coordenacao, sistemas gerais)
Agents   = "COMO pensar"     (raciocinio, decisao)
Actions  = "O QUE fazer"     (catalogo de mutations)
Knowledge = "O QUE saber"    (contexto, busca)
```

### Vantagens da Unificacao

- **Deploy simplificado**: Um container, um processo
- **Comunicacao direta**: Modulos chamam funcoes, nao HTTP
- **Contexto compartilhado**: Config, db, cache unificados
- **Menos overhead**: Sem latencia de rede interna

---

## Estrutura de Pastas

```
apps/backbone/
├── src/
│   ├── index.ts                    # Fastify server
│   ├── config.ts                   # Configuracao centralizada
│   │
│   ├── services/                   # Modulo Services
│   │   ├── notifications/
│   │   │   ├── types.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   └── lifecycles/
│   │   ├── scheduling/
│   │   └── billing/
│   │
│   ├── agents/                     # Modulo Agents
│   │   ├── triager/
│   │   │   ├── index.ts            # Graph LangGraph
│   │   │   ├── types.ts
│   │   │   └── prompt.ts
│   │   ├── copilot/
│   │   ├── workers/
│   │   ├── nodes/                  # Nodos reutilizaveis
│   │   ├── prompts/                # Prompts em Markdown
│   │   └── tools/                  # Tools dos agentes
│   │
│   ├── actions/                    # Modulo Actions
│   │   ├── registry.ts             # Singleton registry
│   │   ├── types.ts
│   │   └── catalog/
│   │       ├── thread/
│   │       ├── kb/
│   │       └── user/
│   │
│   ├── knowledge/                  # Modulo Knowledge
│   │   ├── indexer.ts              # Indexacao Meilisearch
│   │   ├── search.ts               # Busca full-text
│   │   └── rag.ts                  # Retrieval para agents
│   │
│   ├── lib/                        # Utilitarios compartilhados
│   │   ├── db.ts
│   │   ├── redis.ts
│   │   ├── llm.ts
│   │   └── events.ts
│   │
│   └── routes/                     # HTTP endpoints
│       ├── services/
│       ├── agents/
│       ├── actions/
│       └── health.ts
│
├── package.json
└── Dockerfile
```

---

## Modulo Services

Hospeda logica de negocio orquestrada que nao e mutation simples nem IA.

### Quando Usar Services

| Cenario | Modulo Correto |
|---------|----------------|
| CRUD simples | Actions |
| Decisao inteligente | Agents |
| Sistema com ciclo de vida | **Services** |
| Coordenacao multi-sistema | **Services** |
| Features gerais do sistema | **Services** |

### Exemplos

| Sistema | Descricao |
|---------|-----------|
| **notifications** | Notificacoes + Tasks com workflow |
| **scheduling** | Agendamentos e lembretes |
| **billing** | Cobranca e assinaturas |
| **audit** | Logs de auditoria estruturados |

---

## Anatomia de um Sistema

Cada sistema dentro do backbone segue estrutura consistente:

```
<sistema>/
├── types.ts          # Tipos e schemas Zod
├── service.ts        # Logica de negocio
├── repository.ts     # Acesso a dados
└── lifecycles/       # Maquinas de estado (se houver)
    └── <workflow>.ts
```

### types.ts

Define tipos, schemas de validacao e enums.

```typescript
import { z } from 'zod';

export const NotificationTypeEnum = z.enum(['info', 'warning', 'task']);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

export const CreateNotificationSchema = z.object({
  type: NotificationTypeEnum,
  title: z.string().min(1),
  message: z.string(),
  userId: z.string().uuid(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
```

### service.ts

Logica de negocio. Orquestra repository, emite eventos, aplica regras.

```typescript
import { repository } from './repository';
import { emitToUser } from '../lib/events';
import type { CreateNotificationInput } from './types';

export async function createNotification(data: CreateNotificationInput) {
  const notification = await repository.create(data);

  await emitToUser(data.userId, 'notification:new', notification);

  return notification;
}

export async function getNotifications(userId: string) {
  return repository.findByUser(userId);
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await repository.markRead(notificationId, userId);

  await emitToUser(userId, 'notification:updated', notification);

  return notification;
}
```

### repository.ts

Acesso a dados. Queries e mutations no banco.

```typescript
import { db } from '../lib/db';
import type { CreateNotificationInput } from './types';

export const repository = {
  async create(data: CreateNotificationInput) {
    return db.query(
      `INSERT INTO notifications (type, title, message, user_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.type, data.title, data.message, data.userId]
    );
  },

  async findByUser(userId: string) {
    return db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
  },

  async markRead(notificationId: string, userId: string) {
    return db.query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
  },
};
```

### lifecycles/

Maquinas de estado para entidades com ciclo de vida.

```typescript
// lifecycles/approval.ts

export const STATES = ['pending', 'approved', 'denied'] as const;
export type State = typeof STATES[number];

export const TRANSITIONS: Record<State, State[]> = {
  pending: ['approved', 'denied'],
  approved: [],
  denied: [],
};

export function canTransition(from: State, to: State): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateTransition(from: State, to: State): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition: ${from} -> ${to}`);
  }
}
```

---

## Comunicacao Interna

Os modulos do backbone comunicam diretamente via funcoes, sem HTTP.

### Services → Agents

Services podem invocar agents quando precisam de decisao inteligente.

```typescript
// Em services/notifications/service.ts
import { invokeTriager } from '../../agents/triager';

async function processIncomingMessage(message: Message) {
  // Invocar agent diretamente (mesmo processo)
  const classification = await invokeTriager({
    body: message.content,
    authorType: message.authorType,
  });

  // Usar resultado
  if (classification.urgency === 'critical') {
    await createUrgentNotification(message, classification);
  }
}
```

### Agents → Actions

Agents executam mutations via Actions (chamada direta).

```typescript
// Em agents/triager/index.ts
import { executeAction } from '../../actions/registry';

async function actNode(state: TriagerState) {
  for (const action of state.plannedActions) {
    // Chamada direta, sem HTTP
    await executeAction(action.name, action.params, state.context);
  }
}
```

### Agents → Knowledge

Agents consultam Knowledge para contexto.

```typescript
// Em agents/copilot/index.ts
import { searchKnowledge, retrieveForRAG } from '../../knowledge';

async function loadContextNode(state: CopilotState) {
  // Buscar documentos relevantes
  const docs = await retrieveForRAG(state.query, { limit: 5 });

  return { context: docs };
}
```

### Services → Actions

Services executam mutations via Actions.

```typescript
// Em services/billing/service.ts
import { executeAction } from '../../actions/registry';

async function processPayment(invoice: Invoice) {
  // Usar action para registrar pagamento
  await executeAction('billing.recordPayment', {
    invoiceId: invoice.id,
    amount: invoice.total,
  }, systemContext);
}
```

---

## Integracao Externa

### Backbone → Sockets

Backbone emite eventos em tempo real via Redis pub/sub.

```typescript
// Em lib/events.ts
import { redis } from './redis';

export async function emitToUser(userId: string, event: string, data: unknown) {
  await redis.publish('socket:user', JSON.stringify({
    userId,
    event,
    data,
  }));
}

export async function emitToRoom(room: string, event: string, data: unknown) {
  await redis.publish('socket:room', JSON.stringify({
    room,
    event,
    data,
  }));
}

export async function broadcast(event: string, data: unknown) {
  await redis.publish('socket:broadcast', JSON.stringify({
    event,
    data,
  }));
}
```

### App → Backbone

Frontend consome APIs do backbone.

```typescript
// Em app/
const response = await fetch('/backbone/notifications');
const notifications = await response.json();

// Com filtros
const response = await fetch('/backbone/notifications?type=task&unread=true');

// Executar action
const response = await fetch('/backbone/act/execute', {
  method: 'POST',
  body: JSON.stringify({ action: 'thread.create', params: {...} }),
});
```

---

## API REST

### Visao Geral de Rotas

```
# Services
GET    /backbone/notifications           # Listar notificacoes
POST   /backbone/notifications           # Criar notificacao
PATCH  /backbone/notifications/:id       # Atualizar

# Actions
GET    /backbone/act/catalog             # Catalogo de actions
POST   /backbone/act/execute             # Executar action

# Agents
POST   /backbone/agents/copilot/invoke   # Invocar copilot
POST   /backbone/webhook/message         # Webhook externo

# Knowledge
GET    /backbone/kb/search               # Busca full-text
POST   /backbone/kb/index                # Indexar documento

# Health
GET    /backbone/health                  # Status do hub
```

### Padrao de Rotas - Services

```
GET    /backbone/<sistema>           # Listar
GET    /backbone/<sistema>/:id       # Detalhe
POST   /backbone/<sistema>           # Criar
PATCH  /backbone/<sistema>/:id       # Atualizar
DELETE /backbone/<sistema>/:id       # Remover
```

### Exemplo: Notifications

```http
GET /backbone/notifications
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "123",
      "type": "task",
      "title": "Aprovacao necessaria",
      "message": "Revisar mensagem antes de enviar",
      "read_at": null,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

```http
POST /backbone/notifications
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "task",
  "title": "Aprovacao necessaria",
  "message": "Revisar mensagem antes de enviar",
  "userId": "user-uuid-123"
}

Response:
{
  "data": {
    "id": "456",
    "type": "task",
    "title": "Aprovacao necessaria",
    "message": "Revisar mensagem antes de enviar",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Transitions (para entidades com lifecycle)

```http
PATCH /backbone/notifications/:id/transition
Content-Type: application/json
Authorization: Bearer <token>

{
  "to": "approved"
}

Response:
{
  "data": {
    "id": "456",
    "status": "approved",
    "transitioned_at": "2024-01-15T10:35:00Z"
  }
}
```

---

## Eventos

Backbone emite eventos via Redis pub/sub para o servico de sockets.

| Evento | Payload | Quando |
|--------|---------|--------|
| `notification:new` | Notification | Nova notificacao criada |
| `notification:updated` | Notification | Notificacao atualizada |
| `notification:deleted` | { id } | Notificacao removida |
| `task:transition` | { id, from, to } | Task mudou de estado |
| `task:assigned` | { id, userId } | Task atribuida |

### Exemplo de Payload

```json
{
  "userId": "user-uuid-123",
  "event": "notification:new",
  "data": {
    "id": "456",
    "type": "task",
    "title": "Aprovacao necessaria",
    "message": "Revisar mensagem antes de enviar",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## Boas Praticas

### DO

- Agrupar por modulo e dominio (`services/notifications/`, `actions/catalog/thread/`)
- Separar types, service, repository em cada sistema
- Usar comunicacao direta entre modulos (import, nao HTTP)
- Emitir eventos para sockets via Redis pub/sub
- Usar lifecycles para entidades com estado
- Validar transicoes antes de aplicar
- Tipar tudo com Zod
- Documentar eventos emitidos
- Toda mutation passa por Actions (mesmo vinda de Services)

### DON'T

- Chamar outros modulos via HTTP (usar import direto)
- Fazer mutations diretas no banco (usar Actions)
- Criar sistemas sem tipos bem definidos
- Emitir eventos sem necessidade real
- Misturar responsabilidades entre modulos
- Acessar sockets diretamente (usar Redis pub/sub)
- Duplicar logica entre modulos

---

## Checklist - Novo Sistema em Services

- [ ] Criar pasta em `src/services/<sistema>/`
- [ ] Definir `types.ts` com schemas Zod
- [ ] Implementar `repository.ts` com queries
- [ ] Implementar `service.ts` com logica
- [ ] Criar `lifecycles/` se houver ciclo de vida
- [ ] Adicionar rotas em `routes/services/<sistema>.ts`
- [ ] Documentar eventos emitidos
- [ ] Adicionar ao CLAUDE.md do projeto

## Checklist - Nova Action

- [ ] Criar arquivo em `src/actions/catalog/<dominio>/<acao>.ts`
- [ ] Definir nome `dominio.verboAcao`
- [ ] Keywords minimo 3
- [ ] InputSchema e OutputSchema com Zod
- [ ] Permissoes necessarias
- [ ] Implementar execute()
- [ ] Re-exportar em `actions/catalog/index.ts`

## Checklist - Novo Agent

- [ ] Criar pasta em `src/agents/<nome>/`
- [ ] Implementar `index.ts` com StateGraph
- [ ] Definir `types.ts` com State annotation
- [ ] Criar `prompt.ts` com builders
- [ ] Adicionar prompts em `agents/prompts/<nome>-*.md`
- [ ] Implementar fallbacks em cada nodo
- [ ] Integrar com Actions para mutations
