# Arquitetura: Separacao de Conceitos

Este documento define a estrutura de pastas e responsabilidades em projetos LangGraph/LangChain.

## Visao Geral

```
backbone/
├── src/
│   ├── agents/          # Entidades que RACIOCINAM (usam LLM)
│   ├── jobs/            # Tarefas agendadas (cron)
│   ├── services/        # Logica de negocio (sem LLM)
│   ├── tools/           # Ferramentas dos agentes
│   ├── workflows/       # Pipelines deterministicos
│   ├── nodes/           # Acoes atomicas reutilizaveis
│   └── db/              # Queries e tipos do banco
└── docs/                # Documentacao
```

## 1. Agents (Agentes)

**Responsabilidade**: Entidades que RACIOCINAM e DECIDEM usando LLM.

```
agents/
└── assistant/           # Agente principal
    ├── index.ts         # Grafo ReAct + invokeAgent()
    └── prompt.ts        # System prompt do agente
```

**Caracteristicas:**
- Usam LLM para tomar decisoes
- Implementam padrao ReAct (loop pensa→age→observa)
- Tem tools vinculadas via `bindTools()`
- Cada agente tem personalidade propria (prompt.ts)

```typescript
// agents/assistant/index.ts
export async function invokeAgent(input: AgentInput): Promise<AgentOutput> {
  const model = new ChatOpenAI({ ... }).bindTools(tools);

  const workflow = new StateGraph(AgentState)
    .addNode('agent', callModel)
    .addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue)
    .addEdge('tools', 'agent');

  return await workflow.compile().invoke(state);
}
```

## 2. Jobs (Tarefas Agendadas)

**Responsabilidade**: Tarefas executadas por cron, SEM interacao de usuario.

```
jobs/
└── scheduler.ts      # Registra todos os crons
```

**Caracteristicas:**
- Executadas por scheduler (node-cron)
- Nao recebem input de usuario
- Podem chamar workflows ou services
- Sao puras funcoes async

```typescript
// jobs/scheduler.ts
import cron from 'node-cron';

export function startScheduler() {
  cron.schedule('*/5 * * * *', async () => {
    await runCleanupJob();
  });
}
```

## 3. Services (Servicos)

**Responsabilidade**: Logica de negocio PURA, sem LLM.

```
services/
├── index.ts          # Re-exports
└── ...               # Adicione seus services
```

**Caracteristicas:**
- Nao usam LLM
- Encapsulam regras de negocio
- Chamam queries do banco (db/)
- Podem disparar side effects (notificacoes)

```typescript
// services/users.ts
export async function createUser(input: CreateInput): Promise<User> {
  // 1. Validar dados
  if (!input.email) throw new Error('Email required');

  // 2. Criar no banco
  const user = await db.insert('users', input);

  // 3. Notificar (side effect)
  await notifyWelcome(user);

  return user;
}
```

## 4. Tools (Ferramentas)

**Responsabilidade**: Acoes que AGENTES podem executar.

```
tools/
├── example.ts       # Tool de exemplo
└── index.ts         # Exporta array de tools
```

**Caracteristicas:**
- Definidas com Zod schema
- Tem name + description (critico para LLM)
- Retornam JSON estruturado
- Sao chamadas pelo agente via tool_calls

```typescript
// tools/example.ts
export const minhaTool = tool(
  async ({ param }) => {
    const result = await meuService.fazer(param);
    return JSON.stringify({ success: true, data: result });
  },
  {
    name: 'minha_tool',
    description: 'Descreva quando o agente deve usar esta tool.',
    schema: z.object({
      param: z.string().describe('Descricao do parametro'),
    }),
  }
);
```

## 5. Workflows (Pipelines)

**Responsabilidade**: Orquestrar sequencia de passos DETERMINISTICOS.

```
workflows/
├── message-handler.ts     # load → agent → send
└── index.ts               # Re-exports
```

**Caracteristicas:**
- Fluxo fixo (nao decide, apenas executa)
- Podem chamar agentes como um dos passos
- Usam StateGraph mas sem LLM proprio
- Orquestram nodes e services

```typescript
// workflows/message-handler.ts
const workflow = new StateGraph(StateAnnotation)
  .addNode('loadContext', loadContextNode)
  .addNode('agent', agentNode)
  .addNode('saveAndSend', saveAndSendNode)
  .addEdge(START, 'loadContext')
  .addEdge('loadContext', 'agent')
  .addEdge('agent', 'saveAndSend')
  .addEdge('saveAndSend', END);
```

## 6. Nodes (Acoes Atomicas)

**Responsabilidade**: Acoes reutilizaveis entre workflows.

```
nodes/
├── llm.ts           # Chamadas genericas ao LLM
├── integration.ts   # Integracao com APIs externas
├── executions.ts    # Tracking de execucoes
└── index.ts         # Re-exports
```

**Caracteristicas:**
- Funcoes puras (input → output)
- Sem side effects alem do esperado
- Reutilizaveis em multiplos workflows
- Encapsulam integracao com APIs externas

```typescript
// nodes/integration.ts
export async function sendMessage(params: SendParams): Promise<SendResult> {
  await externalApi.post('/messages', {
    to: params.to,
    text: params.message,
  });
  return { success: true };
}
```

## Fluxo Completo

```
┌──────────────────────────────────────────────────────────────┐
│                       REQUISICAO                             │
│                     (webhook)                                │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      WORKFLOW                                │
│                 (message-handler.ts)                         │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐       │
│  │  LOAD    │───▶│  AGENT   │───▶│  SAVE & SEND     │       │
│  │ CONTEXT  │    │          │    │                  │       │
│  └──────────┘    └────┬─────┘    └──────────────────┘       │
│       │               │                   │                  │
│       ▼               ▼                   ▼                  │
│     db/            agents/             nodes/                │
│                   assistant/          integration.ts         │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │          AGENT              │
              │    (agents/assistant/)      │
              │                             │
              │  ┌──────┐   ┌──────────┐   │
              │  │ LLM  │◀─▶│  TOOLS   │   │
              │  │      │   │          │   │
              │  └──────┘   └────┬─────┘   │
              │                  │         │
              │                  ▼         │
              │            services/       │
              └─────────────────────────────┘
```

## Regras de Dependencia

```
jobs/
  └─▶ workflows/, services/

workflows/
  └─▶ agents/, nodes/, services/

agents/
  └─▶ tools/

tools/
  └─▶ services/

services/
  └─▶ db/

nodes/
  └─▶ APIs externas
```

**Proibido:**
- services/ chamar agents/ (inversao de dependencia)
- tools/ chamar workflows/ (circular)
- db/ chamar services/ (inversao)

## Quando Usar Cada Conceito

| Precisa de... | Use |
|---------------|-----|
| LLM para decidir | Agent |
| Executar por cron | Job |
| Logica sem LLM | Service |
| Acao do agente | Tool |
| Sequencia fixa | Workflow |
| Acao atomica | Node |

## Referencias

- [LangGraph Concepts](https://langchain-ai.github.io/langgraphjs/concepts/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
