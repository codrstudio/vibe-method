# Backbone Layer

Barramento de retaguarda para servicos gerais do sistema.

---

## Visao Geral

**Backbone** hospeda logica de negocio orquestrada que nao pertence a camadas especificas.

```
┌─────────────┐                    ┌─────────────┐
│  apps/app   │───── chamadas ────▶│apps/backbone│◀─── agents escalam
│  (Next.js)  │◀──── eventos ──────│  (Fastify)  │     decisoes
└─────────────┘                    └──────┬──────┘
                                          │
┌─────────────┐                           │ coordena
│apps/sockets │◀──────────────────────────┤
│ (Socket.io) │  emite eventos            │
└─────────────┘                           │
                                          ▼
┌─────────────┐                    ┌─────────────┐
│apps/agents  │───── escala ──────▶│  Database   │
│ (LangGraph) │     human-in-loop  │             │
└─────────────┘                    └─────────────┘
```

| Aspecto | Valor |
|---------|-------|
| Localizacao | `apps/backbone/` |
| Framework | Fastify |
| Porta (dev) | XX02 |

---

## Papel no Sistema

```
Agents   = "COMO pensar"     (raciocinio, decisao)
Actions  = "O QUE fazer"     (catalogo de mutations)
Backbone = "COMO orquestrar" (coordenacao, sistemas gerais)
```

Backbone **coordena** fluxos que envolvem multiplas camadas.
Backbone **hospeda** sistemas que nao sao mutations simples nem IA.
Backbone **emite** eventos para sockets quando necessario.

---

## Quando Usar Backbone

| Cenario | Camada Correta |
|---------|----------------|
| CRUD simples | Actions |
| Decisao inteligente | Agents |
| Sistema com ciclo de vida | **Backbone** |
| Coordenacao multi-servico | **Backbone** |
| Features gerais do sistema | **Backbone** |

### Exemplos de Sistemas para Backbone

| Sistema | Descricao |
|---------|-----------|
| **notifications** | Notificacoes + Tasks com workflow |
| **scheduling** | Agendamentos e lembretes |
| **billing** | Cobranca e assinaturas |
| **audit** | Logs de auditoria estruturados |

---

## Estrutura de Pastas

```
apps/backbone/
├── src/
│   ├── index.ts                    # Fastify server
│   ├── config.ts                   # Configuracao
│   │
│   ├── notifications/              # Sistema de Notificacoes
│   │   ├── types.ts
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   └── lifecycles/             # Workflows de task
│   │       ├── approval.ts
│   │       └── review.ts
│   │
│   ├── scheduling/                 # Sistema de Agendamentos
│   │   ├── types.ts
│   │   ├── service.ts
│   │   └── repository.ts
│   │
│   ├── billing/                    # Sistema de Cobranca
│   │   └── ...
│   │
│   ├── lib/                        # Utilitarios compartilhados
│   │   ├── db.ts
│   │   ├── redis.ts
│   │   └── events.ts               # Emissao para sockets
│   │
│   └── routes/                     # HTTP endpoints
│       ├── notifications.ts
│       ├── scheduling.ts
│       └── health.ts
│
├── package.json
└── Dockerfile
```

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
```

### service.ts

Logica de negocio. Orquestra repository, emite eventos, aplica regras.

```typescript
import { repository } from './repository';
import { emitToUser } from '../lib/events';

export async function createNotification(data: CreateNotificationInput) {
  const notification = await repository.create(data);

  await emitToUser(data.userId, 'notification:new', notification);

  return notification;
}
```

### repository.ts

Acesso a dados. Queries e mutations no banco.

```typescript
import { db } from '../lib/db';

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
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
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
```

---

## Integracao com Outras Camadas

### Agents → Backbone

Agents escalam decisoes para humanos via backbone.

```typescript
// Em agents/
import { createTask } from '../lib/backbone';

async function handleUncertainty(state: AgentState) {
  if (state.confidence < 0.7) {
    await createTask({
      type: 'approval',
      title: 'Revisao necessaria',
      message: 'Agente incerto sobre resposta',
      data: state.draft,
      userId: state.assignedTo,
    });
  }
}
```

### Backbone → Sockets

Backbone emite eventos em tempo real.

```typescript
// Em backbone/lib/events.ts
import { redis } from './redis';

export async function emitToUser(userId: string, event: string, data: unknown) {
  await redis.publish('socket:user', JSON.stringify({
    userId,
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
```

---

## API REST

### Padrao de Rotas

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

POST /backbone/notifications
Content-Type: application/json
{
  "type": "task",
  "title": "Aprovacao necessaria",
  "message": "Revisar mensagem antes de enviar"
}

PATCH /backbone/notifications/:id/transition
{
  "to": "approved"
}
```

---

## Eventos

Backbone emite eventos via Redis pub/sub para o servico de sockets.

| Evento | Payload | Quando |
|--------|---------|--------|
| `notification:new` | Notification | Nova notificacao criada |
| `notification:updated` | Notification | Notificacao atualizada |
| `task:transition` | { id, from, to } | Task mudou de estado |

---

## Boas Praticas

### DO

- Agrupar por sistema/dominio (`notifications/`, `scheduling/`)
- Separar types, service, repository
- Emitir eventos para mudancas relevantes
- Usar lifecycles para entidades com estado
- Validar transicoes antes de aplicar

### DON'T

- Colocar logica de IA no backbone (usar agents)
- Fazer mutations diretas sem passar pelo service
- Criar sistemas sem tipos bem definidos
- Emitir eventos sem necessidade real
- Misturar sistemas diferentes na mesma pasta

---

## Checklist - Novo Sistema

- [ ] Criar pasta em `src/<sistema>/`
- [ ] Definir `types.ts` com schemas Zod
- [ ] Implementar `repository.ts` com queries
- [ ] Implementar `service.ts` com logica
- [ ] Criar `lifecycles/` se houver ciclo de vida
- [ ] Adicionar rotas em `routes/<sistema>.ts`
- [ ] Documentar eventos emitidos
- [ ] Adicionar ao CLAUDE.md do projeto
