# Tool Calling com LLMs via OpenRouter

Este documento compila aprendizados sobre tool calling (function calling) em projetos LangChain/LangGraph.

## Problema

Nem todos os LLMs suportam tool calling de forma confiavel. Alguns modelos:
- Geram JSON como texto em vez de usar `tool_calls`
- "Alucinam" chamadas de ferramentas inexistentes
- Ignoram ferramentas mesmo quando sao a melhor opcao

## Modelos Recomendados

| Modelo | Tool Calling | Custo (OpenRouter) | Observacoes |
|--------|--------------|-------------------|-------------|
| `openai/gpt-4o-mini` | Excelente | $0.15/M in, $0.60/M out | Recomendado |
| `anthropic/claude-3.5-sonnet` | Excelente | $3/M in, $15/M out | Caro |
| `google/gemini-2.0-flash-001` | Inconsistente | $0.075/M in, $0.30/M out | Pode falhar |
| `mistralai/mistral-small` | Bom | $0.20/M in, $0.60/M out | Alternativa |

**Dica:** Consulte precos atuais em https://openrouter.ai/models (mudam frequentemente).

## Configuracao LangChain

### Basico: bindTools()

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { tools } from '../tools/index.js';

const model = new ChatOpenAI({
  model: 'openai/gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
  apiKey: process.env.OPENROUTER_API_KEY,
}).bindTools(tools);
```

### Forcando Tool Use

O parametro `tool_choice` controla quando o modelo DEVE usar ferramentas:

```typescript
// Auto: modelo decide (default)
model.bindTools(tools, { tool_choice: 'auto' });

// Required: DEVE usar pelo menos uma tool
model.bindTools(tools, { tool_choice: 'required' });

// Especifica: DEVE usar essa tool
model.bindTools(tools, {
  tool_choice: { type: 'function', function: { name: 'minha_tool' } }
});
```

**Cuidado**: `tool_choice: 'required'` pode causar loops infinitos.

## Definindo Tools

### Estrutura com Zod

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const minhaTool = tool(
  async ({ param1, param2 }) => {
    // Implementacao
    const resultado = await meuService.fazer(param1, param2);
    return JSON.stringify({ success: true, data: resultado });
  },
  {
    name: 'minha_tool',
    description: 'Descreva claramente quando usar esta tool.',
    schema: z.object({
      param1: z.string().describe('Descricao do param1'),
      param2: z.number().optional().describe('Descricao do param2'),
    }),
  }
);
```

### Dicas para Descricoes

As descricoes sao CRITICAS para o modelo decidir quando usar cada tool:

```typescript
// RUIM: vago demais
description: 'Busca dados'

// BOM: especifico e com contexto
description: `Busca usuarios por email ou nome. Use quando:
- O usuario pedir para encontrar alguem
- Precisar validar se um email existe
- Listar usuarios de um departamento`
```

## Padrao ReAct (LangGraph)

O padrao ReAct (Reasoning + Acting) eh ideal para agentes com tools:

```
┌─────────────────────────────────────────────────────┐
│                    LOOP ReAct                       │
│                                                     │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     │
│   │  THINK  │────▶│   ACT   │────▶│ OBSERVE │     │
│   │  (LLM)  │     │ (Tools) │     │         │─────┤
│   └─────────┘     └─────────┘     └─────────┘     │
│        ▲                                          │
│        └──────────────────────────────────────────┘
│               (ate resposta final ou max loops)
└─────────────────────────────────────────────────────┘
```

```typescript
import { StateGraph, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';

const workflow = new StateGraph(AgentState)
  .addNode('agent', agentNode)     // LLM com tools
  .addNode('tools', toolNode)      // Executa tools
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('tools', 'agent');

function shouldContinue(state) {
  const lastMessage = state.messages.at(-1);
  if (lastMessage?.tool_calls?.length > 0) {
    return 'tools';  // Continua loop
  }
  return END;  // Termina
}
```

## Tratando Erros de Tools

Sempre retorne JSON estruturado das tools:

```typescript
export const minhaTool = tool(
  async (params) => {
    try {
      const result = await service.fazer(params);
      return JSON.stringify({
        success: true,
        data: result,
        message: 'Operacao concluida com sucesso',
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: 'Nao foi possivel completar a operacao. Tente novamente.',
      });
    }
  },
  { /* ... */ }
);
```

O modelo usa o retorno da tool para formular a resposta final ao usuario.

## Debugging

### Logs Uteis

```typescript
// Ver qual tool foi chamada
console.log('Tool calls:', lastMessage.tool_calls);

// Ver resultado da tool
console.log('Tool result:', toolResult.content);

// Ver mensagem final
console.log('Response:', lastMessage.content);
```

### Teste Isolado de Tools

Teste tools diretamente sem passar pelo agente:

```javascript
// .tmp/test-tool.mjs
import { minhaTool } from '../dist/tools/example.js';

const result = await minhaTool.invoke({
  param1: 'valor',
  param2: 42,
});

console.log(result);
```

## Checklist de Problemas

| Sintoma | Causa Provavel | Solucao |
|---------|----------------|---------|
| Modelo gera JSON como texto | Modelo nao suporta tool calling | Trocar modelo (GPT-4o-mini) |
| Tool nao e chamada | Descricao vaga | Melhorar description |
| Loop infinito | tool_choice: required | Usar 'auto' ou limitar loops |
| Resposta vazia | Tool retornou erro | Verificar logs da tool |
| Params errados | Schema Zod incorreto | Revisar tipos e describes |

## Referencias

- [LangChain Tool Calling](https://js.langchain.com/docs/concepts/tool_calling)
- [LangGraph ReAct Agent](https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/)
- [OpenRouter Models](https://openrouter.ai/models)
