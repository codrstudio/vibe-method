import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { llmService } from '../../llm/index.js';
import { executeAction } from '../../actions/index.js';
import { incCounter, startTimer, observeHistogram } from '../../health/collector.js';
import { buildClassifyPrompt, buildPlanPrompt } from './prompt.js';
import type { TriagerState, TriagerInput, AgentContext, AgentResult } from '../types.js';

// State annotation for LangGraph
const TriagerAnnotation = Annotation.Root({
  messages: Annotation<TriagerState['messages']>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
  context: Annotation<AgentContext>(),
  classification: Annotation<TriagerState['classification']>(),
  plannedActions: Annotation<TriagerState['plannedActions']>(),
  error: Annotation<string>(),
});

/**
 * Classify node - analyze message intent and urgency
 */
async function classifyNode(state: typeof TriagerAnnotation.State) {
  const stopTimer = startTimer('agent.triager.node.classify.latency');

  try {
    const llm = await llmService.createLLM('classify');
    const prompt = buildClassifyPrompt(state as TriagerState);

    const response = await llm.invoke(prompt);
    const content = typeof response.content === 'string' ? response.content : '';

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      stopTimer();
      return { error: 'Failed to parse classification response' };
    }

    const classification = JSON.parse(jsonMatch[0]);

    // Track confidence
    if (classification.confidence !== undefined) {
      observeHistogram('agent.triager.confidence', classification.confidence);
    }

    stopTimer();
    return { classification };
  } catch (error) {
    stopTimer();
    return { error: `Classification failed: ${error}` };
  }
}

/**
 * Plan node - determine actions to take
 */
async function planNode(state: typeof TriagerAnnotation.State) {
  if (state.error) return {};

  const stopTimer = startTimer('agent.triager.node.plan.latency');

  try {
    const llm = await llmService.createLLM('plan');
    const prompt = buildPlanPrompt(state as TriagerState);

    const response = await llm.invoke(prompt);
    const content = typeof response.content === 'string' ? response.content : '';

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      stopTimer();
      return { plannedActions: [] };
    }

    const plannedActions = JSON.parse(jsonMatch[0]);
    stopTimer();
    return { plannedActions };
  } catch (error) {
    stopTimer();
    return { error: `Planning failed: ${error}` };
  }
}

/**
 * Act node - execute planned actions
 */
async function actNode(state: typeof TriagerAnnotation.State) {
  if (state.error || !state.plannedActions?.length) return {};

  const stopTimer = startTimer('agent.triager.node.act.latency');

  try {
    for (const action of state.plannedActions) {
      await executeAction(action.name, action.params, {
        userId: state.context.userId,
        userRole: 'system',
        permissions: ['*'],
      });
      incCounter('agent.triager.actions.executed', 1, { action: action.name });
    }
    stopTimer();
    return {};
  } catch (error) {
    stopTimer();
    return { error: `Action execution failed: ${error}` };
  }
}

/**
 * Router - decide next step based on state
 */
function router(state: typeof TriagerAnnotation.State): string {
  if (state.error) return END;
  if (!state.classification) return 'classify';
  if (!state.plannedActions) return 'plan';
  return 'act';
}

// Build the graph
const graph = new StateGraph(TriagerAnnotation)
  .addNode('classify', classifyNode)
  .addNode('plan', planNode)
  .addNode('act', actNode)
  .addEdge('classify', 'plan')
  .addEdge('plan', 'act')
  .addEdge('act', END)
  .addConditionalEdges('__start__', router);

const compiledGraph = graph.compile();

/**
 * Invoke triager agent
 */
export async function invokeTriager(
  input: TriagerInput,
  context: AgentContext
): Promise<AgentResult<TriagerState['classification']>> {
  const stopTimer = startTimer('agent.triager.latency');
  incCounter('agent.triager.invocations');

  try {
    const initialState = {
      messages: [{ role: 'user' as const, content: input.body }],
      context,
    };

    const result = await compiledGraph.invoke(initialState);

    if (result.error) {
      stopTimer();
      incCounter('agent.triager.errors');
      return { success: false, error: result.error };
    }

    stopTimer();
    incCounter('agent.triager.success');
    return { success: true, data: result.classification };
  } catch (error) {
    stopTimer();
    incCounter('agent.triager.errors');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
