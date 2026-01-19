# Copilot

Assistente pessoal contextual integrado ao sistema, implementado como **agente LangGraph** com capacidade de orquestracao de pensamento e ferramentas.

---

## Indice

1. [Conceito](#conceito) - O que é o Copilot
2. [Agente LangGraph](#agente-langgraph) - Arquitetura do agente
3. [Duas Interfaces](#duas-interfaces) - Panel e Popup
4. [Tres Pilares de Contexto](#tres-pilares-de-contexto) - Onde, O Que, Acoes
5. [Toggle de Contexto](#toggle-de-contexto) - Ligado/Desligado
6. [Sistema de Mencoes](#sistema-de-mencoes) - @usuarios #entidades
7. [Confirmacao de Actions](#confirmacao-de-actions) - Nunca executa sem pedir
8. [Dois Niveis de Persistencia](#dois-niveis-de-persistencia) - PostgreSQL vs MongoDB
9. [Estrutura de Arquivos](#estrutura-de-arquivos) - Organizacao
10. [System Prompt Modular](#system-prompt-modular) - Montagem dinamica
11. [Tools do Agente](#tools-do-agente) - list/prepare/execute
12. [Hooks de Integracao](#hooks-de-integracao) - useCopilotPage, useCopilotField
13. [Gestao de Titulos](#gestao-de-titulos) - Ciclo de vida
14. [Configuracoes](#configuracoes) - Variaveis de ambiente
15. [Modos de Operacao](#modos-de-operacao) - chat vs agent
16. [Checklist de Implementacao](#checklist-de-implementacao) - Fases

---

## Conceito

O Copilot nao é um chatbot generico - é um **colaborador contextual** que:

- **Sabe onde voce esta** (pagina, URL, parametros)
- **Entende a entidade** que voce visualiza (pedido #123, cliente X)
- **Conhece as acoes** disponiveis (Actions)
- **Pode executar acoes** com confirmacao humana
- **Orquestra ferramentas** para completar tarefas complexas

**Analogia**: O Copilot é o colaborador que senta ao lado do usuario, ve a mesma tela, e ajuda sem precisar de explicacoes sobre "onde estamos".

---

## Agente LangGraph

O Copilot é um **agente** (nao chatbot). A diferenca fundamental:

| Chatbot | Agente |
|---------|--------|
| Responde perguntas | Orquestra tarefas |
| LLM é o core | LLM é uma ferramenta |
| Sem side-effects | Executa acoes no sistema |
| Stateless | Mantem estado de execucao |

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
│   │ search_kb    │ │ analyze      │ │ summarize    │       │
│   └──────────────┘ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### LLMs como Ferramentas

LLMs nao sao o core do agente - sao ferramentas a disposicao dele:

```
search_history        → sem LLM (so busca)
summarize             → modelo barato, janela grande
analyze_sentiment     → modelo capaz, janela media
generate_response     → modelo principal
orchestrator          → modelo mais capaz (orquestra tudo)
```

Cada tool pode ter sua propria LLM e configuracao (modelo, temperature, max_tokens).

---

## Duas Interfaces

O Copilot se manifesta de duas formas:

### Panel Lateral (Chat)

```
┌─────────────────────────────────────────────────────────┐
│                    APP                           │ + │   │
│  ┌─────────┐  ┌──────────────────────────────┐ │💬│   │
│  │         │  │                              │ │💡│   │
│  │ Sidebar │  │       Conteudo da Pagina     │ │📜│   │
│  │         │  │                              │ │⚙️│   │
│  └─────────┘  └──────────────────────────────┘ │   │   │
│                                    ┌───────────┴───┴───┤
│                                    │  COPILOT PANEL     │
│                                    │  [mensagens...]    │
│                                    │  [input + toggle]  │
│                                    └────────────────────┤
└─────────────────────────────────────────────────────────┘
```

- **Localizacao**: Lateral direita, estilo VSCode
- **Persistencia**: PostgreSQL (permanente)
- **Natureza**: Conversas importantes, tarefas complexas
- **Modo**: agent (pode executar actions)

### Popup Flutuante (Ctrl+.)

```
┌──────────────────────────────────────┐
│  Campo de texto qualquer             │
│  ┌────────────────────────────────┐  │
│  │ Escrevendo um comentario...    │  │
│  └────────────────────────────────┘  │
│         ▲                            │
│    ┌────┴─────────────────────┐      │
│    │ ✨ Copilot                │      │
│    │ "Torne mais formal"      │      │
│    │ [Contexto]  [Enviar]     │      │
│    └──────────────────────────┘      │
└──────────────────────────────────────┘
```

- **Localizacao**: Junto ao campo focado
- **Ativacao**: Ctrl+. ou botao ✨
- **Persistencia**: MongoDB + TTL (7 dias)
- **Natureza**: Ajuda rapida, efemera
- **Modo**: chat (so leitura, sem actions)

---

## Tres Pilares de Contexto

### 1. Onde (Localizacao)

```typescript
{
  page: "hub.orders.detail",           // Identificador semantico
  pattern: "/hub/orders/:order_id",    // URL pattern
  params: { order_id: "123" }          // Parametros extraidos
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
      customer_name: "Joao Silva",
      total: 150.00
    }
  }
}
```

### 3. Acoes (Actions)

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
│  [mensagem do usuario...]           │
│                                     │
│  [🔘 Contexto]              [Enviar]│
└─────────────────────────────────────┘
```

- **Ligado**: Copilot recebe contexto completo (onde, o que, acoes)
- **Desligado**: Copilot recebe apenas a mensagem
- **Padrao**: Ligado
- **Persistencia**: localStorage

---

## Sistema de Mencoes

### Triggers

| Trigger | Busca | Cor |
|---------|-------|-----|
| `@` | Usuarios do sistema | accent |
| `@` | Clientes | success |
| `#` | Entidades (orders, tickets) | accent |

### Payload Expandido

Quando o usuario menciona `@joao` ou `#123`, o LLM recebe os dados completos:

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
      data: { name: "Joao Silva", email: "joao@..." }
    }
  ]
}
```

---

## Confirmacao de Actions

O Copilot NUNCA executa acoes sem confirmacao. Fluxo obrigatorio:

```
1. Usuario: "cancela esse pedido"
2. Copilot: [prepare_action] → mostra preview
   "Confirmar order.cancel?
    Parametros: order_id: 123
    ⚠️ Esta acao nao pode ser desfeita."
3. Usuario: "sim" / "ok" / "confirma"
4. Copilot: [execute_action] → executa
   "✅ order.cancel executado com sucesso."
```

### Confirmacao Inteligente

| Usuario diz | Copilot entende | Acao |
|-------------|-----------------|------|
| "Cancela esse pedido" | Comando direto | Prepara e pede confirmacao |
| "Acho que nao vai rolar" | Infere cancelamento | Pergunta: "Quer que eu cancele?" |

Regra: se o Copilot **inferiu** a acao, deve perguntar antes de preparar.

---

## Dois Niveis de Persistencia

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

### Trocas Rapidas (MongoDB)

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

### Promocao

Troca rapida pode ser promovida a chat permanente:

1. Usuario faz pergunta no popup
2. Resposta é util, quer aprofundar
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
│   │   ├── useCopilotPage.ts       # Declaracao de contexto
│   │   ├── useCopilotField.ts      # Attach Ctrl+. em campos
│   │   ├── useCopilotChat.ts       # Streaming de mensagens
│   │   ├── useCopilotQuick.ts      # Trocas rapidas
│   │   └── useCopilotSessions.ts   # CRUD de sessoes
│   └── components/copilot/
│       ├── CopilotPanel.tsx        # Panel lateral
│       ├── CopilotPopup.tsx        # Popup flutuante
│       ├── CopilotChat.tsx         # Area de mensagens
│       ├── CopilotInput.tsx        # Input com toggle/mencoes
│       ├── CopilotHistory.tsx      # Lista de sessoes
│       └── MentionPopup.tsx        # Autocomplete de mencoes
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

Voce é o Copilot, assistente integrado ao [Sistema].
Voce ajuda a equipe a ser mais produtiva.

# Contexto da Pagina
{{#if pageContext}}
O usuario esta em: {{pageContext.page}}
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

# Acoes Disponiveis
{{#each tools}}
- {{name}}: {{description}}
{{/each}}

# Diretrizes
- Seja conciso e direto
- Use dados reais, nunca invente
- Peca confirmacao antes de executar acoes
- Responda em portugues brasileiro
```

---

## Tools do Agente

### list_actions

Descobre quais acoes o usuario pode executar.

```typescript
{
  name: 'list_actions',
  description: 'Lista actions disponiveis',
  schema: z.object({
    filter: z.string().optional()
  })
}
```

### prepare_action

Prepara preview da acao para confirmacao.

```typescript
{
  name: 'prepare_action',
  description: 'Prepara action para confirmacao',
  schema: z.object({
    action: z.string(),
    params: z.record(z.unknown())
  })
}
```

### execute_action

Executa apos confirmacao do usuario.

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

### search_kb

Busca no Knowledge Base.

```typescript
{
  name: 'search_kb',
  description: 'Busca documentos no Knowledge Base',
  schema: z.object({
    query: z.string(),
    limit: z.number().default(5)
  })
}
```

### analyze

Analisa dados ou texto.

```typescript
{
  name: 'analyze',
  description: 'Analisa conteudo usando LLM especializado',
  schema: z.object({
    content: z.string(),
    type: z.enum(['sentiment', 'summary', 'entities'])
  })
}
```

---

## Hooks de Integracao

### useCopilotPage

Paginas declaram seu contexto:

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

### useCopilotChat

Gerencia streaming de mensagens:

```typescript
const { messages, sendMessage, isStreaming } = useCopilotChat({
  sessionId,
  onError: (error) => toast.error(error.message),
});

return (
  <CopilotChat
    messages={messages}
    isStreaming={isStreaming}
    onSend={sendMessage}
  />
);
```

### useCopilotSessions

CRUD de sessoes:

```typescript
const {
  sessions,
  currentSession,
  createSession,
  selectSession,
  deleteSession,
  updateTitle,
} = useCopilotSessions();
```

---

## Gestao de Titulos

Ciclo de vida do titulo da sessao:

```
"Nova conversa"  →  "Titulo gerado pela IA"  →  "Titulo editado"
     │                      │                         │
     │ (system)             │ (ai)                    │ (user)
     │                      │                         │
     └──────────────────────┴─────────────────────────┘
                            │
                    titleSetBy: 'system' | 'ai' | 'user'
```

- Apos 2-3 mensagens, IA gera titulo
- Se usuario editar, IA nunca mais muda

---

## Configuracoes

| Variavel | Padrao | Descricao |
|----------|--------|-----------|
| `COPILOT_QUICK_TTL_DAYS` | 7 | TTL para trocas rapidas |
| `COPILOT_CONTEXT_WINDOW` | 50 | Maximo de mensagens no contexto |
| `COPILOT_POPUP_SHORTCUT` | . | Tecla do atalho (Ctrl+X) |

---

## Modos de Operacao

| Modo | Tools | Actions | Uso padrao |
|------|-------|---------|------------|
| **chat** | Somente leitura | Nao | Popup (troca rapida) |
| **agent** | Todas | Sim, com confirmacao | Panel lateral |

- Popup sempre usa modo **chat**
- Panel inicia em modo **agent**

---

## Checklist de Implementacao

### Fase 1: Chat Funcional (MVP)

- [ ] Schema PostgreSQL (sessions + messages)
- [ ] CopilotProvider no layout
- [ ] CopilotPanel com chat basico
- [ ] API /api/copilot/chat com streaming
- [ ] Agente LangGraph basico
- [ ] Auto-titulo via LLM

### Fase 2: Contexto de Pagina

- [ ] useCopilotPage hook
- [ ] Toggle de contexto no input
- [ ] System prompt com secoes dinamicas
- [ ] Badge de contexto no historico

### Fase 3: Popup e Trocas Rapidas

- [ ] useCopilotField hook
- [ ] CopilotPopup posicionado
- [ ] Schema MongoDB com TTL
- [ ] Promocao para chat permanente
- [ ] Historico unificado

### Fase 4: Mencoes

- [ ] Deteccao de @ e # no input
- [ ] MentionPopup com autocomplete
- [ ] API de busca de entidades
- [ ] Payload expandido para LLM

### Fase 5: Agente Completo

- [ ] Tools: list/prepare/execute actions
- [ ] Fluxo de confirmacao
- [ ] Execucao em background
- [ ] Badge de nao lidas
