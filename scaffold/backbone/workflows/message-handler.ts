/**
 * WORKFLOW: Message Handler
 *
 * Pipeline para processar mensagens recebidas via webhook.
 *
 * Fluxo:
 * START -> loadContext -> agent -> saveAndSend -> END
 *
 * CUSTOMIZE:
 * - Adapte loadContextNode para carregar contexto do seu dominio
 * - Modifique saveAndSendNode para sua integracao de saida
 */

import { StateGraph, END, Annotation } from '@langchain/langgraph';
import type { MessageState, ConversationContext } from '../types.js';
import { invokeAgent } from '../agents/assistant/index.js';
import { WorkflowExecution } from '../nodes/executions.js';
import { sendMessage } from '../nodes/integration.js';
import * as db from '../db/index.js';

// =============================================================================
// STATE
// =============================================================================

const StateAnnotation = Annotation.Root({
  // Input data
  phone: Annotation<string>,
  name: Annotation<string>,
  message: Annotation<string>,
  timestamp: Annotation<string>,
  startTime: Annotation<number>,
  runId: Annotation<string>,

  // Context loaded
  context: Annotation<ConversationContext | undefined>,
  conversationId: Annotation<string | undefined>,

  // Agent results
  responseText: Annotation<string | undefined>,
  toolsUsed: Annotation<string[] | undefined>,
  iterationCount: Annotation<number | undefined>,

  // Control flow
  error: Annotation<string | undefined>,
});

type State = typeof StateAnnotation.State;

// Mapa de execucoes ativas
const activeExecutions = new Map<string, WorkflowExecution>();

// =============================================================================
// NODES
// =============================================================================

/**
 * Node 1: Carrega contexto da conversa
 *
 * CUSTOMIZE: Implemente a logica para carregar contexto do seu banco
 */
async function loadContextNode(state: State): Promise<Partial<State>> {
  const execution = activeExecutions.get(state.runId);
  const startTime = Date.now();

  try {
    // TODO: Implemente a logica para carregar contexto
    // Exemplo:
    // const conversation = await conversationService.findOrCreate(state.phone);
    // const user = await userService.findByPhone(state.phone);
    // const messages = await messageService.getRecent(conversation.id);

    // Placeholder - substitua pela sua implementacao
    const conversationId = crypto.randomUUID();
    const context: ConversationContext = {
      conversationId,
      currentDatetime: new Date().toISOString(),
      user: {
        id: crypto.randomUUID(),
        name: state.name,
      },
      lastMessages: [],
    };

    // Salvar mensagem recebida (se tiver tabela de mensagens)
    // await db.insert('messages', {
    //   conversation_id: conversationId,
    //   direction: 'in',
    //   content: state.message,
    // });

    if (execution) {
      execution.stepSuccess('loadContext', { phone: state.phone }, {
        conversationId,
        userName: context.user?.name,
      }, Date.now() - startTime);
    }

    return {
      context,
      conversationId,
    };
  } catch (error) {
    console.error('[loadContext] Failed:', error);

    if (execution) {
      execution.stepFailed('loadContext', error instanceof Error ? error.message : 'Unknown error', {
        phone: state.phone,
      }, Date.now() - startTime);
    }

    return {
      error: 'Failed to load context',
    };
  }
}

/**
 * Node 2: Invoca o agente ReAct
 */
async function agentNode(state: State): Promise<Partial<State>> {
  const execution = activeExecutions.get(state.runId);
  const startTime = Date.now();

  // Se houve erro no loadContext, gerar resposta de fallback
  if (state.error || !state.context) {
    return {
      responseText: 'Desculpe, estou com dificuldades no momento. Tente novamente mais tarde.',
    };
  }

  try {
    // Preparar historico da conversa
    const conversationHistory = (state.context.lastMessages || [])
      .slice(-10)
      .map(msg => ({
        role: msg.direction === 'in' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

    // Invocar o agente ReAct
    const result = await invokeAgent({
      message: state.message,
      userId: state.context.userId,
      userName: state.context.user?.name || state.name,
      currentDatetime: state.context.currentDatetime,
      conversationHistory,
    });

    if (execution) {
      execution.stepSuccess('agent', {
        message: state.message.substring(0, 100),
        historyLength: conversationHistory.length,
      }, {
        toolsUsed: result.toolsUsed,
        iterationCount: result.iterationCount,
        responsePreview: result.response.substring(0, 200),
      }, Date.now() - startTime);
    }

    return {
      responseText: result.response,
      toolsUsed: result.toolsUsed,
      iterationCount: result.iterationCount,
    };
  } catch (error) {
    console.error('[agent] Failed:', error);

    if (execution) {
      execution.stepFailed('agent', error instanceof Error ? error.message : 'Unknown error', {
        message: state.message.substring(0, 100),
      }, Date.now() - startTime);
    }

    return {
      responseText: 'Desculpe, tive um problema ao processar sua mensagem. Pode repetir?',
    };
  }
}

/**
 * Node 3: Salva mensagem e envia resposta
 *
 * CUSTOMIZE: Adapte para sua integracao de saida (WhatsApp, Telegram, etc)
 */
async function saveAndSendNode(state: State): Promise<Partial<State>> {
  const execution = activeExecutions.get(state.runId);
  const startTime = Date.now();

  if (!state.responseText) {
    return {};
  }

  try {
    // Salvar resposta no banco (se tiver tabela de mensagens)
    // if (state.conversationId) {
    //   await db.insert('messages', {
    //     conversation_id: state.conversationId,
    //     direction: 'out',
    //     content: state.responseText,
    //   });
    // }

    // Enviar via integracao
    await sendMessage({
      to: state.phone,
      message: state.responseText,
    });

    if (execution) {
      execution.stepSuccess('saveAndSend', {
        conversationId: state.conversationId,
        responseLength: state.responseText.length,
      }, {
        sent: true,
      }, Date.now() - startTime);
    }
  } catch (error) {
    console.error('[saveAndSend] Failed:', error);

    if (execution) {
      execution.stepFailed('saveAndSend', error instanceof Error ? error.message : 'Unknown error', {
        conversationId: state.conversationId,
      }, Date.now() - startTime);
    }
  }

  return {};
}

// =============================================================================
// GRAPH
// =============================================================================

function buildMessageHandlerGraph() {
  const graph = new StateGraph(StateAnnotation)
    // Nodes
    .addNode('loadContext', loadContextNode)
    .addNode('agent', agentNode)
    .addNode('saveAndSend', saveAndSendNode)

    // Flow: START -> loadContext -> agent -> saveAndSend -> END
    .addEdge('__start__', 'loadContext')
    .addEdge('loadContext', 'agent')
    .addEdge('agent', 'saveAndSend')
    .addEdge('saveAndSend', END);

  return graph.compile();
}

let compiledGraph: ReturnType<typeof buildMessageHandlerGraph> | null = null;

function getGraph() {
  if (!compiledGraph) {
    compiledGraph = buildMessageHandlerGraph();
  }
  return compiledGraph;
}

// =============================================================================
// EXPORT
// =============================================================================

/**
 * Processa uma mensagem recebida
 *
 * @param input - Dados da mensagem (phone, name, message, timestamp)
 */
export async function handleMessage(input: MessageState): Promise<void> {
  const graph = getGraph();

  // Criar tracker de execucao
  const execution = new WorkflowExecution('message-handler', 'webhook');
  const runId = execution.getId();
  activeExecutions.set(runId, execution);

  try {
    const finalState = await graph.invoke({
      phone: input.phone,
      name: input.name,
      message: input.message,
      timestamp: input.timestamp,
      startTime: Date.now(),
      runId,
    });

    // Setar contexto apos carregar
    execution.setContext(finalState?.conversationId, input.phone);

    // Salvar execucao com sucesso
    await execution.save('success', {
      resultSummary: {
        toolsUsed: finalState?.toolsUsed,
        iterationCount: finalState?.iterationCount,
        responsePreview: finalState?.responseText?.substring(0, 200),
      },
    });
  } catch (error) {
    console.error('[handleMessage] Workflow failed:', error);

    // Salvar execucao com falha
    await execution.save('failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Enviar mensagem de fallback
    try {
      await sendMessage({
        to: input.phone,
        message: 'Desculpe, estou com dificuldades no momento. Tente novamente mais tarde.',
      });
    } catch {
      console.error('[handleMessage] Failed to send fallback message');
    }
  } finally {
    // Limpar mapa
    activeExecutions.delete(runId);
  }
}
