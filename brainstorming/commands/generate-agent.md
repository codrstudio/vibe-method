# Generate Agent

Gera estrutura de agente LangGraph a partir do spec.

**Uso:** `/ai:generate-agent {nome-do-agente}`

**Exemplo:** `/ai:generate-agent biz-writer`

---

## Prompt

```markdown
Gere o agente `$ARGUMENTS` seguindo estas instrucoes:

## 1. Ler Contexto

Leia os seguintes arquivos ANTES de gerar codigo:

- `specs/AI-INSTRUCTIONS.md` - Regras de geracao
- `specs/AI-INSTRUCTIONS.local.md` - Instrucoes do projeto (se existir)
- `specs/agents/$ARGUMENTS.md` - Spec do agente

## 2. Estrutura a Gerar

Crie a seguinte estrutura em `apps/backbone/src/agents/$ARGUMENTS/`:

```
$ARGUMENTS/
├── index.ts      # Export publico do agente
├── graph.ts      # Definicao do StateGraph
├── nodes/        # Um arquivo por node do grafo
│   └── *.ts
├── prompts.ts    # System prompts usados pelo agente
└── types.ts      # Tipos: State, Input, Output
```

## 3. Regras

- Usar `resolveLLM(intent)` para chamadas LLM - nunca hardcode provider/model
- Nomes de arquivos em kebab-case
- Nodes sao funcoes puras: `(state) => state`
- Tipos devem usar prefixo do agente: `BizWriterState`, `BizWriterInput`
- Imports de types via `@projeto/types`

## 4. Exemplo de graph.ts

```typescript
import { StateGraph, END } from '@langchain/langgraph';
import { loadContext } from './nodes/load-context';
import { generateMessage } from './nodes/generate-message';
import { AgentState } from './types';

const graph = new StateGraph<AgentState>({
  channels: {
    // definir channels baseado no spec
  }
})
  .addNode('load_context', loadContext)
  .addNode('generate_message', generateMessage)
  .addEdge('__start__', 'load_context')
  .addEdge('load_context', 'generate_message')
  .addEdge('generate_message', END);

export const agentGraph = graph.compile();
```

## 5. Exemplo de node com LLM

```typescript
import { resolveLLM } from '@/lib/llm';
import { SYSTEM_PROMPT } from '../prompts';
import { AgentState } from '../types';

export async function generateMessage(state: AgentState): Promise<Partial<AgentState>> {
  const llm = await resolveLLM('generate');

  const response = await llm.invoke([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: state.input }
  ]);

  return {
    output: response.content
  };
}
```

## 6. Apos Gerar

- Verificar se compila: `npm run build`
- Atualizar PLAN.md se existir
```

---

## Arquivo do Comando

Para usar como `/ai:generate-agent`, criar em `.claude/commands/generate-agent.md`:

```markdown
Gere o agente `$ARGUMENTS` seguindo estas instrucoes:

1. Leia ANTES de gerar:
   - `specs/AI-INSTRUCTIONS.md`
   - `specs/AI-INSTRUCTIONS.local.md` (se existir)
   - `specs/agents/$ARGUMENTS.md`

2. Crie em `apps/backbone/src/agents/$ARGUMENTS/`:
   - index.ts (export)
   - graph.ts (StateGraph)
   - nodes/*.ts (um por node)
   - prompts.ts (system prompts)
   - types.ts (State, Input, Output)

3. Regras:
   - Usar `resolveLLM(intent)` para LLM
   - Tipos com prefixo: BizWriterState
   - Imports via @projeto/types

4. Apos gerar, executar `npm run build`
```
