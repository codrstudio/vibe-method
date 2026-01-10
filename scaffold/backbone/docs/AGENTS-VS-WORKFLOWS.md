# Agentes vs Workflows: Qual a Diferenca?

## TL;DR

| Conceito | Definicao | Caracteristica Principal |
|----------|-----------|--------------------------|
| **Agent** | Entidade que RACIOCINA e DECIDE | Usa LLM para tomar decisoes |
| **Workflow** | Pipeline que ORQUESTRA etapas | Fluxo deterministico (sem LLM) |

## Estrutura

```
backbone/src/
├── agents/                   # AGENTES (raciocinam)
│   └── assistant/            # Agente principal
│       ├── index.ts          # ReAct loop: pensa → age → observa
│       └── prompt.ts         # System prompt com personalidade
│
├── workflows/                # PIPELINES (orquestram)
│   ├── message-handler.ts    # Pipeline: load → agent → send
│   └── index.ts
│
└── tools/                    # FERRAMENTAS dos agentes
    ├── example.ts
    └── index.ts
```

## O Agente (`agents/assistant/`)

O agente eh o "cerebro" que:
1. **Raciocina** sobre o que o usuario precisa
2. **Decide** quais ferramentas usar
3. **Observa** os resultados e continua raciocinando
4. **Responde** de forma natural

```
┌────────────────────────────────────────────────────┐
│                    AGENTE ReAct                    │
│                                                    │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐    │
│   │  THINK  │────▶│   ACT   │────▶│ OBSERVE │    │
│   │  (LLM)  │     │ (Tools) │     │         │────┘
│   └─────────┘     └─────────┘     └─────────┘  │
│        ▲                                       │
│        └───────────────────────────────────────┘
│                    (loop ate resposta final)
└────────────────────────────────────────────────────┘
```

**Codigo simplificado:**
```typescript
// agents/assistant/index.ts
const workflow = new StateGraph(AgentState)
  .addNode('agent', agentNode)      // LLM pensa e decide
  .addNode('tools', toolNode)       // Executa ferramentas
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue)  // tools ou end?
  .addEdge('tools', 'agent');       // Loop: volta a pensar
```

## Os Workflows (`workflows/`)

Workflows sao pipelines DETERMINISTICOS que:
1. **Orquestram** uma sequencia de passos
2. **Nao raciocinam** - apenas executam
3. **Podem chamar** o agente como um dos passos

### message-handler.ts

```
┌─────────────────────────────────────────────────────────┐
│                 WORKFLOW: Message Handler               │
│                                                         │
│   ┌───────────┐   ┌───────────┐   ┌───────────────┐    │
│   │  LOAD     │──▶│ ASSISTANT │──▶│  SAVE & SEND  │    │
│   │  CONTEXT  │   │  (agent)  │   │               │    │
│   └───────────┘   └───────────┘   └───────────────┘    │
│                                                         │
│   Deterministico: sempre load → agent → send           │
└─────────────────────────────────────────────────────────┘
```

**Codigo simplificado:**
```typescript
// workflows/message-handler.ts
import { invokeAgent } from '../agents/assistant/index.js';

const workflow = new StateGraph(StateAnnotation)
  .addNode('loadContext', loadContextNode)   // DB read
  .addNode('agent', agentNode)               // Chama agents/assistant
  .addNode('saveAndSend', saveAndSendNode)   // DB write + envio
  .addEdge(START, 'loadContext')
  .addEdge('loadContext', 'agent')
  .addEdge('agent', 'saveAndSend')
  .addEdge('saveAndSend', END);
```

## Comparacao

| Aspecto | Agent | Workflow |
|---------|-------|----------|
| **Usa LLM?** | Sim (raciocina) | Nao (exceto se chamar agent) |
| **Fluxo** | Dinamico (decide na hora) | Fixo (predefinido) |
| **Loop?** | Sim (pensa ate terminar) | Nao (linear) |
| **Ferramentas** | Decide quais usar | Nao usa diretamente |
| **Exemplo** | "Qual dado buscar?" | "Carregar dados do banco" |

## Multiplos Agentes

A estrutura `agents/` permite adicionar novos agentes:

```
agents/
├── assistant/     # Atendimento principal (atual)
├── analyzer/      # Analise de dados (futuro)
├── moderator/     # Moderacao (futuro)
└── summarizer/    # Resumos (futuro)
```

Cada agente tem seu proprio:
- `index.ts` - Grafo ReAct
- `prompt.ts` - Personalidade e regras
- Tools especificas (opcionais)

## Conclusao

O `message-handler.ts` NAO eh um agente - eh um **pipeline** que:
1. Prepara o contexto
2. Chama o agente `assistant`
3. Salva e envia a resposta

O **agente de verdade** esta em `agents/assistant/` - ele eh quem:
1. Pensa sobre o que fazer
2. Decide usar ferramentas
3. Gera a resposta final
