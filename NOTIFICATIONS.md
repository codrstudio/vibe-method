# Notifications & Tasks

Sistema unificado de notificacoes passivas e tarefas que requerem decisao.

---

## Visao Geral

O sistema tem dois tipos de elementos:

| Tipo | Proposito | Acao do Usuario |
|------|-----------|-----------------|
| **Notification** | Informar | Ler, dispensar |
| **Task** | Informar + requerer decisao | Decidir via labels, preencher inputs |

```
┌─────────────────────────────────────────────────────────┐
│                      BACKBONE                            │
│                                                          │
│  Agents/Sistema criam notificacoes e tasks              │
│  Ex: IA incerta → cria task pedindo aprovacao           │
│                                                          │
└────────────────────────┬────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
     ┌─────────────┐          ┌─────────────┐
     │   Sockets   │          │   Polling   │
     │  (se tiver) │          │ (fallback)  │
     └──────┬──────┘          └──────┬──────┘
            │                        │
            └───────────┬────────────┘
                        ▼
              ┌─────────────────┐
              │    Frontend     │
              │  (TanStack Q.)  │
              └─────────────────┘
```

**Onde vive:** `apps/backbone/src/notifications/`

Ver [BACKBONE.md](./BACKBONE.md) para estrutura da camada.

---

## Caso de Uso Principal

Sistemas com IA no backbone frequentemente precisam de **human-in-the-loop**:

```
1. Agente gera mensagem para cliente
2. Agente de qualidade verifica
3. Verificacao falha 3 vezes
4. Sistema cria TASK pedindo decisao do usuario
5. Usuario aprova, edita ou rejeita
6. Sistema continua o fluxo
```

Task = notificacao que **bloqueia um fluxo** ate o usuario decidir.

---

## Anatomia

### Notification

```
├── id
├── type: 'notification'
├── title
├── message
├── timestamp
├── seen: boolean
├── read: boolean
├── followups[]          # Links sem side-effect
│   └── { label, url }
└── reference?           # Vinculo contextual
    └── { type, id }     # Ex: { type: 'report', id: '123' }
```

### Task

```
├── id
├── type: 'task'
├── title
├── message
├── timestamp
├── seen: boolean
├── read: boolean
├── followups[]
├── reference?
├── labels[]             # Controlam workflow
│   └── { key, display_name, color, icon }
├── currentLabel         # Estado atual (ex: 'pending')
├── inputs[]             # Formulario opcional
│   └── { type, name, label, required, value }
└── metadata             # Dados extras para o backend
```

---

## Followups

Links para recursos relacionados. **Sem side-effect** (navegacao pura).

```typescript
followups: [
  { label: "Ver relatorio", url: "/reports/123" },
  { label: "Abrir conversa", url: "/threads/456" }
]
```

Uso: Notification diz "Relatorio gerado" e oferece link para abri-lo.

---

## Task Workflow

Tasks usam **labels** para controlar ciclo de vida.

### Estrutura de Label

```typescript
{
  key: "pending",           // Nome interno (kebab-case)
  display_name: "Pendente", // Nome na UI
  color: "#f59e0b",         // Cor do badge
  icon: "clock",            // Icone (Lucide)
  metadata: {
    is_initial: true,       // Estado inicial?
    is_terminal: false,     // Estado final?
    transitions_to: ["approved", "denied"],  // Transicoes validas
    side_effect: null       // Acao do backend ao entrar
  }
}
```

### Exemplo de Workflow

```
         ┌──────────┐
         │ pending  │  (inicial)
         └────┬─────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌────────┐        ┌────────┐
│approved│        │ denied │
└────────┘        └────────┘
 (terminal)        (terminal)
```

**Decisao via label:** Usuario clica em "Aprovar" ou "Negar" → label muda → backend executa side_effect.

### Workflow com Revisao

```
         ┌──────────┐
         │ pending  │
         └────┬─────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌────────┐ ┌──────┐ ┌────────┐
│approved│ │ edit │ │ denied │
└────────┘ └──┬───┘ └────────┘
              │
              ▼
         ┌──────────┐
         │ pending  │  (volta para revisao)
         └──────────┘
```

---

## Task Inputs

Formulario simples para capturar dados do usuario.

### Tipos Suportados

| Tipo | Uso | Validacao |
|------|-----|-----------|
| `markdown` | Editar texto rico | - |
| `option_list` | Escolher entre opcoes | required |
| `checkbox` | Selecionar multiplos | - |
| `text` | Texto simples | required, minLength |
| `password` | Senha | required |
| `email` | Email | required, format |
| `phone` | Telefone | required, format |
| `select` | Dropdown | required |

### Exemplo

```typescript
inputs: [
  {
    type: "markdown",
    name: "message",
    label: "Mensagem para o cliente",
    required: true,
    value: "Ola, seu pedido foi enviado..."  // Pre-preenchido
  },
  {
    type: "select",
    name: "priority",
    label: "Prioridade",
    required: true,
    options: [
      { value: "low", label: "Baixa" },
      { value: "high", label: "Alta" }
    ]
  }
]
```

### Validacao e Transicao

Se task tem inputs obrigatorios, transicao de label so ocorre apos preenchimento.

```
Usuario clica "Aprovar"
    ↓
Valida inputs (required, format)
    ↓
Se invalido → mostra erros
Se valido → transiciona label + envia dados
```

### Limites

Tasks sao para **interacoes simples**. Se precisar de:

- Validacao complexa
- Multiplos steps
- Logica condicional

→ Nao use tasks. Crie uma pagina dedicada.

---

## Resources da Interface

### 1. Barra de Notificacao

Localizada na sidebar, abaixo do brand.

```
┌─────────────────┐
│     BRAND       │
├─────────────────┤
│ [🔔 12] [⚡ 3]  │  ← Barra de notificacao
├─────────────────┤
│   Menu...       │
└─────────────────┘
```

| Icone | Modo | Badge conta |
|-------|------|-------------|
| 🔔 | Auto (tudo) | Notifications + Tasks |
| ⚡ | Tasks only | Apenas Tasks |

### 2. Painel Popup

Aparece no hover dos icones. Lista resumida.

```
┌─────────────────────────────┐
│ Notificacoes           [x]  │
├─────────────────────────────┤
│ ● Relatorio gerado     2min │
│ ◆ Aprovacao necessaria  5min│
│ ● Cliente respondeu    10min│
├─────────────────────────────┤
│ Ver todas →                 │
└─────────────────────────────┘
```

- `●` Notification
- `◆` Task

### 3. Pagina Dashboard

Rota: `/notifications`

Gestao completa com filtros, busca, acoes em lote.

### 4. Popup de Task

Modal otimizado para tomada de decisao.

```
┌─────────────────────────────────┐
│ Aprovacao de Mensagem      [x] │
├─────────────────────────────────┤
│                                 │
│ O agente gerou esta mensagem    │
│ mas nao tem certeza se esta     │
│ adequada.                       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Ola, seu pedido foi...      │ │  ← Input markdown
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Aprovar]  [Editar]  [Rejeitar] │  ← Labels como botoes
│                                 │
└─────────────────────────────────┘
```

### 5. Badges Contextuais

Badges acoplados a itens do app.

```
Menu lateral:
├── Dashboard
├── Clientes [2]    ← 2 tasks relacionadas a clientes
├── Relatorios [1]  ← 1 notification de relatorio
└── Config
```

Baseado em `reference.type` da notification/task.

---

## Entrega de Eventos

### Fluxo Unico

```
1. SOCKET NOTIFICA (se disponivel)
   Evento: notification:update
   Payload: { unreadCount, taskCount, hasUrgent }
   → Badge atualiza instantaneamente

2. FETCH DE PREVIEW (sob demanda)
   Quando: hover no icone ou abrir painel
   Query: useNotificationsPreview()
   → Lista resumida renderiza

3. FETCH COMPLETO (sob demanda)
   Quando: clica em task especifica
   Query: useTask(taskId)
   → Modal de decisao renderiza
```

### Com Sockets

```typescript
// Socket notifica com estatisticas
socket.on("notification:update", (data) => {
  // data = { unreadCount: 12, taskCount: 3, hasUrgent: true }

  // Atualiza estado local (badge)
  setStats(data);

  // Invalida cache para proximo fetch
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
});
```

Ver [SOCKET.md](./SOCKET.md) para detalhes da camada.

### Sem Sockets (Polling)

```typescript
// Polling de estatisticas a cada 30s
export function useNotificationStats() {
  return useQuery({
    queryKey: ["notifications", "stats"],
    queryFn: fetchNotificationStats,
    refetchInterval: 30 * 1000,
  });
}
```

Ver [NEXTJS.md](./NEXTJS.md) seção Data Fetching para detalhes de TanStack Query.

### Decisao: Sockets ou Polling?

| Projeto | Recomendacao |
|---------|--------------|
| Ja tem sockets (chat, presenca) | Notif/Tasks usa sockets |
| Nao tem sockets | Polling 30s e suficiente |

Se ja tem sockets, adicionar evento `notification:update` e trivial.

---

## API

### Endpoints

```
GET  /backbone/notifications/stats
     → { unreadCount, taskCount, hasUrgent }

GET  /backbone/notifications/preview
     → Lista resumida (titulo, tipo, timestamp)

GET  /backbone/notifications
     → Lista completa com paginacao

GET  /backbone/notifications/:id
     → Detalhe completo (incluindo inputs para tasks)

PATCH /backbone/notifications/:id/seen
      → Marca como visto

PATCH /backbone/notifications/:id/read
      → Marca como lido

PATCH /backbone/tasks/:id/transition
      Body: { to: "approved", inputs: { message: "..." } }
      → Transiciona label + envia dados

DELETE /backbone/notifications/:id
       → Remove (dismiss)
```

### Eventos Socket

| Evento | Direcao | Payload | Quando |
|--------|---------|---------|--------|
| `notification:update` | S→C | `{ unreadCount, taskCount, hasUrgent }` | Qualquer mudanca |
| `notification:new` | S→C | `{ id, type, title }` | Nova notif/task (opcional, para toast) |

---

## Estrutura de Pastas

```
apps/backbone/src/notifications/
├── types.ts              # Tipos e schemas
├── service.ts            # Logica de negocio
├── repository.ts         # Acesso a dados
├── events.ts             # Emissao para sockets
└── lifecycles/           # Workflows de task
    ├── approval.ts       # pending → approved/denied
    └── review.ts         # pending → edit → pending
```

---

## Checklist de Implementacao

### Backend (Backbone)

- [ ] Tabelas: notifications, task_inputs, task_labels
- [ ] Repository com queries
- [ ] Service com logica de transicao
- [ ] Lifecycles definidos
- [ ] Eventos emitidos via Redis pub/sub

### Frontend

- [ ] Barra de notificacao na sidebar
- [ ] Painel popup (hover)
- [ ] Pagina /notifications
- [ ] Modal de task
- [ ] Badges contextuais
- [ ] Hooks: useNotificationStats, useNotificationsPreview, useTask
- [ ] Integracao com sockets OU polling

### Integracao

- [ ] Agents criam tasks quando precisam de decisao
- [ ] Transicao de label executa side_effect no backbone
- [ ] Dados de inputs sao passados para o fluxo original
