# Backbone Scaffold

Esqueleto generico para projetos com agentes de IA usando LangGraph.

## Quick Start

```bash
# 1. Copiar para seu projeto
cp -r method/scaffold/backbone ./backbone

# 2. Instalar dependencias
cd backbone && npm install

# 3. Configurar variaveis
cp .env.example .env
# Editar .env com suas credenciais

# 4. Rodar em desenvolvimento
npm run dev

# 5. Health check
curl http://localhost:8000/health
```

## Estrutura

```
backbone/
├── index.ts              # Servidor Fastify (endpoints)
├── config.ts             # Validacao de env vars (Zod)
├── types.ts              # TypeScript types
│
├── agents/               # Entidades que RACIOCINAM (LLM)
│   └── assistant/
│       ├── index.ts      # Grafo ReAct generico
│       └── prompt.ts     # System prompt (CUSTOMIZAR)
│
├── db/                   # Database layer
│   ├── index.ts          # Pool PostgreSQL + helpers
│   ├── types.ts          # Types de DB
│   └── queries/          # Queries especificas (adicionar)
│
├── nodes/                # Acoes atomicas reutilizaveis
│   ├── index.ts          # Re-exports
│   ├── llm.ts            # Chamadas OpenRouter
│   ├── executions.ts     # Tracking de execucoes
│   └── integration.ts    # Exemplo de integracao externa
│
├── services/             # Logica de negocio (sem LLM)
│   └── index.ts          # Placeholder (adicionar)
│
├── tools/                # Ferramentas dos agentes
│   ├── index.ts          # Array de tools exportado
│   └── example.ts        # Tool de exemplo (echo)
│
├── workflows/            # Pipelines deterministicos
│   ├── index.ts          # Re-exports
│   └── message-handler.ts # Workflow exemplo
│
├── jobs/                 # Tarefas agendadas (cron)
│   └── scheduler.ts      # node-cron generico
│
├── prompts/              # System prompts (YAML/texto)
│   └── README.md         # Documentacao
│
├── templates/            # Templates de mensagens
│   └── README.md         # Documentacao
│
├── docs/                 # Documentacao de arquitetura
│   ├── ARCHITECTURE.md   # Divisao de responsabilidades
│   ├── AGENTS-VS-WORKFLOWS.md
│   ├── TOOL-CALLING.md
│   └── LLM-PATTERN.md
│
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

## O que e Cada Pasta

| Pasta | Responsabilidade | Usa LLM? |
|-------|------------------|----------|
| `agents/` | Entidades que **raciocinam** e decidem | Sim |
| `workflows/` | Pipelines que **orquestram** etapas | Nao* |
| `tools/` | Acoes que **agentes executam** | Nao |
| `services/` | Logica de **negocio pura** | Nao |
| `nodes/` | Acoes **atomicas reutilizaveis** | Parcial |
| `jobs/` | Tarefas **agendadas** (cron) | Nao |
| `db/` | Acesso ao **banco de dados** | Nao |
| `prompts/` | **Textos longos** para LLMs | - |
| `templates/` | **Mensagens** para usuarios | - |

*Workflows podem chamar agents como um dos passos

## Fluxo de Dados

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   WEBHOOK   │────>│  WORKFLOW   │────>│    AGENT    │
│  (trigger)  │<────│ (pipeline)  │<────│  (LangGraph)│
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                    ┌──────┴──────┐     ┌──────┴──────┐
                    │   SERVICES  │     │    TOOLS    │
                    │  (business) │     │  (actions)  │
                    └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │     DB      │
                    │ (PostgreSQL)│
                    └─────────────┘
```

## Como Customizar

### 1. Definir suas Tools

```typescript
// tools/meu-dominio.ts
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const minhaTool = tool(
  async ({ param1 }) => {
    const resultado = await meuService.fazer(param1);
    return JSON.stringify({ success: true, data: resultado });
  },
  {
    name: 'minha_tool',
    description: 'Descreva claramente quando usar',
    schema: z.object({
      param1: z.string().describe('Descricao do parametro'),
    }),
  }
);
```

### 2. Configurar o Prompt

```typescript
// agents/assistant/prompt.ts
export function buildSystemPrompt(context: PromptContext): string {
  return `Voce e um assistente para ${context.appName}.

## Seu Papel
- Descreva a personalidade
- Defina regras de comportamento

## Tools Disponiveis
- minha_tool: quando usar

## Data/Hora Atual
${context.currentDatetime}`;
}
```

### 3. Criar Services

```typescript
// services/meu-servico.ts
import * as db from '../db/index.js';

export async function minhaOperacao(input: Input): Promise<Output> {
  // Validar, executar, retornar
}
```

### 4. Adicionar Queries

```typescript
// db/queries/minha-entidade.ts
import { query, queryOne } from '../index.js';

export async function findById(id: string) {
  return queryOne('SELECT * FROM tabela WHERE id = $1', [id]);
}
```

## Comandos

```bash
npm run dev      # Desenvolvimento (hot reload)
npm run build    # Compilar TypeScript
npm run start    # Producao
npm test         # Testes
```

## Variaveis de Ambiente

| Variavel | Descricao | Default |
|----------|-----------|---------|
| `PORT` | Porta do servidor | 8000 |
| `NODE_ENV` | Ambiente | development |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `OPENROUTER_API_KEY` | API key do OpenRouter | - |
| `OPENROUTER_BASE_URL` | Base URL | https://openrouter.ai/api/v1 |
| `OPENROUTER_DEFAULT_MODEL` | Modelo LLM | google/gemini-2.0-flash-001 |

## Referencias

- [LangGraph Concepts](https://langchain-ai.github.io/langgraphjs/concepts/)
- [OpenRouter Models](https://openrouter.ai/models)
- Ver `docs/` para documentacao detalhada
