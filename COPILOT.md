# Copilot

Assistente pessoal contextual integrado ao sistema, implementado como **agente LangGraph** com capacidade de orquestração de pensamento e ferramentas.

---

## Conceito

O Copilot não é um chatbot genérico - é um **colaborador contextual** que:

- **Sabe onde você está** (página, URL, parâmetros)
- **Entende a entidade** que você visualiza (pedido #123, cliente X)
- **Conhece as ações** disponíveis (Actions)
- **Pode executar ações** com confirmação humana
- **Orquestra ferramentas** para completar tarefas complexas

**Analogia**: O Copilot é o colaborador que senta ao lado do usuário, vê a mesma tela, e ajuda sem precisar de explicações sobre "onde estamos".

---

## Agente LangGraph

O Copilot é um **agente** (não chatbot). A diferença fundamental:

| Chatbot | Agente |
|---------|--------|
| Responde perguntas | Orquestra tarefas |
| LLM é o core | LLM é uma ferramenta |
| Sem side-effects | Executa ações no sistema |
| Stateless | Mantém estado de execução |

### Arquitetura do Agente

```
┌─────────────────────────────────────────────────────────────┐
│                      COPILOT AGENT                          │
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │   REASON    │───▶│    ACT      │───▶│   OBSERVE   │    │
│   │  (pensar)   │    │  (executar) │    │  (avaliar)  │    │
│   └─────────────┘    └─────────────┘    └─────────────┘    │
│          ▲                                    │             │
│          └────────────────────────────────────┘             │
│                    Loop ReAct                               │
├─────────────────────────────────────────────────────────────┤
│                        TOOLS                                │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│   │ list_actions │ │prepare_action│ │execute_action│       │
│   └──────────────┘ └──────────────┘ └──────────────┘       │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│   │ search_kb    │ │ analyze     │ │ summarize    │       │
│   └──────────────┘ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### LLMs como Ferramentas

LLMs não são o core do agente - são ferramentas à disposição dele:

```
search_history        → sem LLM (só busca)
summarize             → modelo barato, janela grande
analyze_sentiment     → modelo capaz, janela média
generate_response     → modelo principal
orchestrator          → modelo mais capaz (orquestra tudo)
```

Cada tool pode ter sua própria LLM e configuração (modelo, temperature, max_tokens).

---

## Duas Interfaces

O Copilot se manifesta de duas formas:

### Panel Lateral (Chat)

```
┌─────────────────────────────────────────────────────────┐
│                    APP                           │ + │   │
│  ┌─────────┐  ┌──────────────────────────────┐ │ 💬│   │
│  │         │  │                              │ │ 💡│   │
│  │ Sidebar │  │       Conteúdo da Página     │ │ 📜│   │
│  │         │  │                              │ │ ⚙️│   │
│  └─────────┘  └──────────────────────────────┘ │   │   │
│                                    ┌───────────┴───┴───┤
│                                    │  COPILOT PANEL     │
│                                    │  [mensagens...]    │
│                                    │  [input + toggle]  │
│                                    └────────────────────┤
└─────────────────────────────────────────────────────────┘
```

- **Localização**: Lateral direita, estilo VSCode
- **Persistência**: PostgreSQL (permanente)
- **Natureza**: Conversas importantes, tarefas complexas
- **Modo**: agent (pode executar actions)

### Popup Flutuante (Ctrl+.)

```
┌──────────────────────────────────────┐
│  Campo de texto qualquer             │
│  ┌────────────────────────────────┐  │
│  │ Escrevendo um comentário...    │  │
│  └────────────────────────────────┘  │
│         ▲                            │
│    ┌────┴─────────────────────┐      │
│    │ ✨ Copilot                │      │
│    │ "Torne mais formal"      │      │
│    │ [Contexto]  [Enviar]     │      │
│    └──────────────────────────┘      │
└──────────────────────────────────────┘
```

- **Localização**: Junto ao campo focado
- **Ativação**: Ctrl+. ou botão ✨
- **Persistência**: MongoDB + TTL (7 dias)
- **Natureza**: Ajuda rápida, efêmera
- **Modo**: chat (só leitura, sem actions)

---

## Três Pilares de Contexto

### 1. Onde (Localização)

```typescript
{
  page: "hub.orders.detail",           // Identificador semântico
  pattern: "/hub/orders/:order_id",    // URL pattern
  params: { order_id: "123" }          // Parâmetros extraídos
}
```

### 2. O Que (Entidade)

```typescript
{
  entity: {
    type: "order",
    id: "123",
    data: {
      number: 123,
      status: "pending",
      customer_name: "João Silva",
      total: 150.00
    }
  }
}
```

### 3. Ações (Actions)

```typescript
{
  actions: [
    "order.confirm",
    "order.cancel",
    "order.assign",
    "chat.sendMessage"
  ]
}
```

---

## Toggle de Contexto

Tanto no panel quanto no popup, existe um toggle:

```
┌─────────────────────────────────────┐
│  [mensagem do usuário...]           │
│                                     │
│  [🔘 Contexto]              [Enviar]│
└─────────────────────────────────────┘
```

- **Ligado**: Copilot recebe contexto completo (onde, o que, ações)
- **Desligado**: Copilot recebe apenas a mensagem
- **Padrão**: Ligado
- **Persistência**: localStorage

---

## Sistema de Menções

### Triggers

| Trigger | Busca | Cor |
|---------|-------|-----|
| `@` | Usuários do sistema | accent |
| `@` | Clientes | success |
| `#` | Entidades (orders, tickets) | accent |

### Payload Expandido

Quando o usuário menciona `@joao` ou `#123`, o LLM recebe os dados completos:

```typescript
{
  content: "Confirme o pedido #123 do @joao",
  mentions: [
    {
      type: "order",
      id: "uuid-order-123",
      label: "123",
      data: { number: 123, status: "pending", total: 150.00 }
    },
    {
      type: "customer",
      id: "uuid-joao",
      label: "joao",
      data: { name: "João Silva", email: "joao@..." }
    }
  ]
}
```

---

## Confirmação de Actions

O Copilot NUNCA executa ações sem confirmação. Fluxo obrigatório:

```
1. Usuário: "cancela esse pedido"
2. Copilot: [prepare_action] → mostra preview
   "Confirmar order.cancel?
    Parâmetros: order_id: 123
    ⚠️ Esta ação não pode ser desfeita."
3. Usuário: "sim" / "ok" / "confirma"
4. Copilot: [execute_action] → executa
   "✅ order.cancel executado com sucesso."
```

### Confirmação Inteligente

| Usuário diz | Copilot entende | Ação |
|-------------|-----------------|------|
| "Cancela esse pedido" | Comando direto | Prepara e pede confirmação |
| "Acho que não vai rolar" | Infere cancelamento | Pergunta: "Quer que eu cancele?" |

Regra: se o Copilot **inferiu** a ação, deve perguntar antes de preparar.

---

## Dois Níveis de Persistência

```
É chat (panel)?  →  PostgreSQL (permanente)
É popup?         →  MongoDB + TTL (cache)
```

### Chat Permanente (PostgreSQL)

```sql
copilot_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) DEFAULT 'Nova conversa',
  title_set_by VARCHAR(10), -- system, ai, user
  context_page VARCHAR(100),
  context_badge VARCHAR(255),
  created_at, updated_at
)

copilot_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES copilot_sessions(id),
  role VARCHAR(10), -- user, assistant
  content TEXT,
  mentions JSONB DEFAULT '[]',
  context JSONB,
  created_at
)
```

### Trocas Rápidas (MongoDB)

```javascript
{
  _id: ObjectId,
  userId: "uuid",
  fieldId: "comment-editor-123",
  messages: [...],
  createdAt: ISODate,
  expiresAt: ISODate  // TTL index
}
```

### Promoção

Troca rápida pode ser promovida a chat permanente:

1. Usuário faz pergunta no popup
2. Resposta é útil, quer aprofundar
3. Clica "Continuar no Chat"
4. Sistema copia para PostgreSQL, abre no panel

---

## Estrutura de Arquivos

```
projeto/
├── app/src/
│   ├── contexts/
│   │   └── copilot-context.tsx     # Provider global
│   ├── hooks/
│   │   ├── useCopilotPage.ts       # Declaração de contexto
│   │   ├── useCopilotField.ts      # Attach Ctrl+. em campos
│   │   ├── useCopilotChat.ts       # Streaming de mensagens
│   │   ├── useCopilotQuick.ts      # Trocas rápidas
│   │   └── useCopilotSessions.ts   # CRUD de sessões
│   └── components/copilot/
│       ├── CopilotPanel.tsx        # Panel lateral
│       ├── CopilotPopup.tsx        # Popup flutuante
│       ├── CopilotChat.tsx         # Área de mensagens
│       ├── CopilotInput.tsx        # Input com toggle/menções
│       ├── CopilotHistory.tsx      # Lista de sessões
│       └── MentionPopup.tsx        # Autocomplete de menções
│
├── agents/
│   ├── copilot/
│   │   ├── index.ts                # Agente LangGraph
│   │   ├── prompt.ts               # Builder de system prompt
│   │   └── types.ts                # Schemas Zod
│   ├── prompts/
│   │   └── copilot-system.md       # Prompt base
│   └── tools/
│       └── copilot-actions.ts      # Tools do agente
│
└── database/migrations/
    └── XXX_copilot_sessions.sql
```

---

## System Prompt Modular

O system prompt é montado dinamicamente:

```markdown
# Identidade

Você é o Copilot, assistente integrado ao [Sistema].
Você ajuda a equipe a ser mais produtiva.

# Contexto da Página
{{#if pageContext}}
O usuário está em: {{pageContext.page}}
{{#if pageContext.entity}}
## Entidade Atual
Tipo: {{entity.type}}
Dados: {{json entity.data}}
{{/if}}
{{/if}}

# Entidades Referenciadas
{{#each mentions}}
- {{type}} "{{label}}": {{json data}}
{{/each}}

# Ações Disponíveis
{{#each tools}}
- {{name}}: {{description}}
{{/each}}

# Diretrizes
- Seja conciso e direto
- Use dados reais, nunca invente
- Peça confirmação antes de executar ações
- Responda em português brasileiro
```

---

## Tools do Agente

### list_actions

Descobre quais ações o usuário pode executar.

```typescript
{
  name: 'list_actions',
  description: 'Lista actions disponíveis',
  schema: z.object({
    filter: z.string().optional()
  })
}
```

### prepare_action

Prepara preview da ação para confirmação.

```typescript
{
  name: 'prepare_action',
  description: 'Prepara action para confirmação',
  schema: z.object({
    action: z.string(),
    params: z.record(z.unknown())
  })
}
```

### execute_action

Executa após confirmação do usuário.

```typescript
{
  name: 'execute_action',
  description: 'Executa action confirmada',
  schema: z.object({
    action: z.string(),
    params: z.record(z.unknown())
  })
}
```

---

## Hooks de Integração

### useCopilotPage

Páginas declaram seu contexto:

```typescript
const copilot = useCopilotPage({
  page: 'hub.orders.detail',
  pattern: '/hub/orders/:order_id',
  title: `Pedido #${order.number}`,
  breadcrumb: ['Hub', 'Pedidos', `#${order.number}`],
});

useEffect(() => {
  if (order) {
    copilot.setEntity({
      type: 'order',
      id: order.id,
      data: { number: order.number, status: order.status },
    });
  }
}, [order]);
```

### useCopilotField

Attach Ctrl+. em campos de texto:

```typescript
const textareaRef = useRef<HTMLTextAreaElement>(null);
const copilot = useCopilotField({
  fieldId: 'comment-editor-123',
  inputRef: textareaRef,
  onApply: (result) => setComment(result),
});

return (
  <>
    <textarea ref={textareaRef} onKeyDown={copilot.handleKeyDown} />
    {copilot.isPopupOpen && (
      <CopilotPopup
        fieldId={copilot.fieldId}
        inputText={copilot.selectedText || copilot.currentText}
        position={copilot.popupPosition}
        onApply={copilot.handleApply}
        onClose={copilot.closePopup}
      />
    )}
  </>
);
```

---

## Gestão de Títulos

Ciclo de vida do título da sessão:

```
"Nova conversa"  →  "Título gerado pela IA"  →  "Título editado"
     │                      │                         │
     │ (system)             │ (ai)                    │ (user)
     │                      │                         │
     └──────────────────────┴─────────────────────────┘
                            │
                    titleSetBy: 'system' | 'ai' | 'user'
```

- Após 2-3 mensagens, IA gera título
- Se usuário editar, IA nunca mais muda

---

## Configurações

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `COPILOT_QUICK_TTL_DAYS` | 7 | TTL para trocas rápidas |
| `COPILOT_CONTEXT_WINDOW` | 50 | Máximo de mensagens no contexto |
| `COPILOT_POPUP_SHORTCUT` | . | Tecla do atalho (Ctrl+X) |

---

## Modos de Operação

| Modo | Tools | Actions | Uso padrão |
|------|-------|---------|------------|
| **chat** | Somente leitura | Não | Popup (troca rápida) |
| **agent** | Todas | Sim, com confirmação | Panel lateral |

- Popup sempre usa modo **chat**
- Panel inicia em modo **agent**

---

## Checklist de Implementação

### Fase 1: Chat Funcional (MVP)

- [ ] Schema PostgreSQL (sessions + messages)
- [ ] CopilotProvider no layout
- [ ] CopilotPanel com chat básico
- [ ] API /api/copilot/chat com streaming
- [ ] Agente LangGraph básico
- [ ] Auto-título via LLM

### Fase 2: Contexto de Página

- [ ] useCopilotPage hook
- [ ] Toggle de contexto no input
- [ ] System prompt com seções dinâmicas
- [ ] Badge de contexto no histórico

### Fase 3: Popup e Trocas Rápidas

- [ ] useCopilotField hook
- [ ] CopilotPopup posicionado
- [ ] Schema MongoDB com TTL
- [ ] Promoção para chat permanente
- [ ] Histórico unificado

### Fase 4: Menções

- [ ] Detecção de @ e # no input
- [ ] MentionPopup com autocomplete
- [ ] API de busca de entidades
- [ ] Payload expandido para LLM

### Fase 5: Agente Completo

- [ ] Tools: list/prepare/execute actions
- [ ] Fluxo de confirmação
- [ ] Execução em background
- [ ] Badge de não lidas
