# LLM Conversation Pattern

Este documento define o padrao correto para enviar mensagens para LLMs neste projeto.

## Padrao RAG (Retrieval-Augmented Generation)

Ao fazer chamadas para LLM com dados recuperados do sistema, siga este formato:

```typescript
messages: [
  {
    role: 'system',
    content: `${SYSTEM_PROMPT}

## Dados Disponiveis
${RAG_DATA}`
  },
  { role: 'user', content: 'mensagem antiga 1' },
  { role: 'assistant', content: 'resposta antiga 1' },
  { role: 'user', content: 'mensagem antiga 2' },
  { role: 'assistant', content: 'resposta antiga 2' },
  { role: 'user', content: 'MENSAGEM ATUAL DO USUARIO' }  // <- A que precisa responder
]
```

## Regras

### 1. RAG vai no SYSTEM
- Dados recuperados (listas, resultados de busca, etc.) devem ser injetados no system prompt
- NUNCA adicione RAG como mensagem `user` separada

### 2. Historico alternado
- Mensagens anteriores devem alternar `user` / `assistant`
- Mapeamento: `direction: 'in'` → `user`, `direction: 'out'` → `assistant`

### 3. Ultima mensagem e a atual
- A ultima mensagem `user` DEVE ser a mensagem atual do usuario
- E sobre essa mensagem que a LLM deve gerar resposta

## Exemplo Correto

```typescript
// Usuario perguntou: "quais produtos tem?"
// RAG retornou: "PRODUTOS: Notebook, Mouse, Teclado, Monitor"

const messages = [
  {
    role: 'system',
    content: `Voce e um assistente de vendas...

## Dados Disponiveis
PRODUTOS: Notebook, Mouse, Teclado, Monitor`
  },
  { role: 'user', content: 'ola' },
  { role: 'assistant', content: 'Ola! Como posso ajudar?' },
  { role: 'user', content: 'quais produtos tem?' }  // <- ATUAL
]

// LLM responde: "Temos os seguintes produtos: Notebook, Mouse..."
```

## Exemplo ERRADO

```typescript
// NUNCA faca isso:
const messages = [
  { role: 'system', content: 'Voce e um assistente...' },
  { role: 'user', content: 'ola' },
  { role: 'assistant', content: 'Ola!' },
  { role: 'user', content: 'Responda usando: PRODUTOS: ...' }  // ERRADO!
]

// Problemas:
// 1. RAG como mensagem user
// 2. Mensagem atual do usuario nao esta presente
// 3. LLM nao sabe qual pergunta responder
```

## Implementacao

### Chamada Direta (sem agente)

```typescript
// nodes/llm.ts
export async function generateResponse(
  systemPrompt: string,
  history: Array<{ direction: 'in' | 'out'; content: string }>,
  currentMessage: string,
  ragContext?: string
): Promise<LLMResult> {
  // 1. Montar system prompt com RAG
  let fullPrompt = systemPrompt;
  if (ragContext) {
    fullPrompt += `\n\n## Dados Disponiveis\n${ragContext}`;
  }

  // 2. Montar mensagens
  const messages: ChatMessage[] = [
    { role: 'system', content: fullPrompt },
  ];

  // 3. Adicionar historico
  for (const msg of history) {
    messages.push({
      role: msg.direction === 'in' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  // 4. Adicionar mensagem atual
  messages.push({ role: 'user', content: currentMessage });

  // 5. Chamar LLM
  return callOpenRouter(messages, options);
}
```

### Com Agente ReAct

O agente recebe o contexto no state e constroi o prompt automaticamente:

```typescript
// agents/assistant/index.ts
async function agentNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const systemPrompt = buildSystemPrompt({
    userName: state.userName,
    currentDatetime: state.currentDatetime,
    contextSummary: state.contextSummary,  // RAG injetado aqui
  });

  const messagesWithSystem: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...state.messages  // Historico + mensagem atual
  ];

  const response = await model.invoke(messagesWithSystem);
  return { messages: [response] };
}
```

## Fluxo Completo

```
1. Usuario envia mensagem
   ↓
2. Workflow carrega contexto (loadContext)
   - Busca usuario do banco
   - Busca historico de mensagens
   - Busca dados relevantes (RAG)
   ↓
3. Agente recebe:
   - System prompt + RAG (no state.contextSummary)
   - Historico de mensagens (conversationHistory)
   - Mensagem atual (message)
   ↓
4. Agente processa:
   - Monta messages array no formato correto
   - Chama LLM
   - (Opcional) Usa tools
   - Gera resposta
   ↓
5. Workflow salva e envia resposta
```

## Dicas

1. **Limite o historico**: Use apenas as ultimas 10-20 mensagens para evitar context overflow
2. **RAG relevante**: Filtre dados RAG para incluir apenas o que e relevante para a pergunta
3. **Prompt claro**: O system prompt deve explicar como usar os dados disponiveis
4. **Teste isolado**: Teste a geracao de resposta com dados mockados antes de integrar

## Referencias

- [LangChain RAG](https://python.langchain.com/docs/tutorials/rag/)
- [OpenAI Chat Completions](https://platform.openai.com/docs/guides/chat)
