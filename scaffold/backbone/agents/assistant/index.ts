/**
 * ASSISTANT AGENT
 *
 * Agente principal usando padrao ReAct (Reasoning + Acting).
 * Implementa loop: pensa -> age -> observa -> pensa...
 *
 * CUSTOMIZE:
 * - Edite prompt.ts para definir personalidade
 * - Adicione tools em tools/ para acoes do agente
 */

import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { tools } from '../../tools/index.js';
import { config } from '../../config.js';
import { buildSystemPrompt } from './prompt.js';
import type { AgentInput, AgentOutput } from '../../types.js';

// =============================================================================
// STATE DEFINITION
// =============================================================================

/**
 * Estado do agente ReAct.
 * Mensagens acumulam automaticamente via reducer.
 */
const AgentState = Annotation.Root({
  // Mensagens da conversa (acumula automaticamente)
  messages: Annotation<BaseMessage[]>({
    reducer: (existing, incoming) => existing.concat(incoming),
    default: () => [],
  }),

  // Contexto (imutavel durante a execucao)
  userId: Annotation<string>({
    reducer: (_, incoming) => incoming,
    default: () => '',
  }),
  userName: Annotation<string>({
    reducer: (_, incoming) => incoming,
    default: () => 'Usuario',
  }),
  currentDatetime: Annotation<string>({
    reducer: (_, incoming) => incoming,
    default: () => new Date().toISOString(),
  }),
  contextSummary: Annotation<string>({
    reducer: (_, incoming) => incoming,
    default: () => '',
  }),
});

type AgentStateType = typeof AgentState.State;

// =============================================================================
// MODEL CONFIGURATION
// =============================================================================

/**
 * Modelo LLM configurado para usar OpenRouter.
 * Usa ChatOpenAI com baseURL customizada.
 */
const model = new ChatOpenAI({
  model: config.OPENROUTER_DEFAULT_MODEL,
  temperature: 0.7,
  maxTokens: 1000,
  configuration: {
    baseURL: config.OPENROUTER_BASE_URL,
  },
  apiKey: config.OPENROUTER_API_KEY,
}).bindTools(tools);

// =============================================================================
// AGENT NODE
// =============================================================================

/**
 * No do agente: pensa e decide se precisa usar ferramentas.
 */
async function agentNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  // Preparar mensagens com system prompt
  const systemPrompt = buildSystemPrompt({
    userId: state.userId,
    userName: state.userName,
    currentDatetime: state.currentDatetime,
    contextSummary: state.contextSummary,
  });

  const messagesWithSystem: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...state.messages
  ];

  try {
    // Chamar o modelo
    const response = await model.invoke(messagesWithSystem);

    // Retornar a resposta como nova mensagem
    return {
      messages: [response]
    };
  } catch (error) {
    console.error('[Assistant] Error invoking model:', error);

    // Retornar mensagem de erro amigavel
    return {
      messages: [
        new AIMessage({
          content: 'Desculpe, tive um problema ao processar sua mensagem. Pode repetir?'
        })
      ]
    };
  }
}

// =============================================================================
// TOOLS NODE
// =============================================================================

/**
 * No de ferramentas: executa as tools chamadas pelo agente.
 */
const toolNode = new ToolNode(tools);

// =============================================================================
// ROUTING FUNCTION
// =============================================================================

/**
 * Decide se o agente deve usar ferramentas ou finalizar.
 */
function shouldContinue(state: AgentStateType): 'tools' | '__end__' {
  const lastMessage = state.messages[state.messages.length - 1];

  // Se a ultima mensagem tem tool_calls, executar as ferramentas
  if (
    lastMessage &&
    'tool_calls' in lastMessage &&
    Array.isArray((lastMessage as AIMessage).tool_calls) &&
    (lastMessage as AIMessage).tool_calls!.length > 0
  ) {
    return 'tools';
  }

  // Caso contrario, finalizar
  return '__end__';
}

// =============================================================================
// BUILD GRAPH
// =============================================================================

const workflow = new StateGraph(AgentState)
  // Adicionar nos
  .addNode('agent', agentNode)
  .addNode('tools', toolNode)

  // Fluxo inicial: START -> agent
  .addEdge(START, 'agent')

  // Apos agent: decidir se vai para tools ou finaliza
  .addConditionalEdges('agent', shouldContinue, {
    tools: 'tools',
    __end__: END,
  })

  // Apos tools: voltar para agent (loop ReAct)
  .addEdge('tools', 'agent');

// Compilar o grafo
const compiledGraph = workflow.compile();

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Invoca o agente assistente com uma mensagem.
 *
 * @param input - Dados de entrada do agente
 * @returns Resposta do agente
 */
export async function invokeAgent(input: AgentInput): Promise<AgentOutput> {
  // Construir mensagens iniciais a partir do historico
  const messages: BaseMessage[] = [];

  // Adicionar historico da conversa (se houver)
  if (input.conversationHistory && input.conversationHistory.length > 0) {
    for (const msg of input.conversationHistory) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else {
        messages.push(new AIMessage(msg.content));
      }
    }
  }

  // Adicionar mensagem atual
  messages.push(new HumanMessage(input.message));

  // Preparar estado inicial
  const initialState = {
    messages,
    userId: input.userId || '',
    userName: input.userName || 'Usuario',
    currentDatetime: input.currentDatetime,
    contextSummary: input.contextSummary || '',
  };

  try {
    // Executar o grafo
    const result = await compiledGraph.invoke(initialState);

    // Extrair resposta final e ferramentas usadas
    const finalMessages = result.messages;
    const toolsUsed: string[] = [];
    let iterationCount = 0;

    // Contar ferramentas usadas
    for (const msg of finalMessages) {
      if (msg instanceof AIMessage && msg.tool_calls && msg.tool_calls.length > 0) {
        iterationCount++;
        for (const tc of msg.tool_calls) {
          if (!toolsUsed.includes(tc.name)) {
            toolsUsed.push(tc.name);
          }
        }
      }
    }

    // Extrair ultima resposta de texto
    const lastAIMessage = [...finalMessages]
      .reverse()
      .find(m => m instanceof AIMessage && typeof m.content === 'string' && m.content.length > 0);

    const response = lastAIMessage
      ? (lastAIMessage.content as string)
      : 'Desculpe, nao consegui processar sua mensagem.';

    return {
      response,
      toolsUsed,
      iterationCount
    };
  } catch (error) {
    console.error('[Assistant] Error executing graph:', error);

    return {
      response: 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente.',
      toolsUsed: [],
      iterationCount: 0
    };
  }
}

// Export the compiled graph for testing
export { compiledGraph as agentGraph };
