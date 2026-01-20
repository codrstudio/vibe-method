import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { llmService } from '../../llm/index.js';
import { search } from '../../knowledge/index.js';
import { incCounter, startTimer, observeHistogram } from '../../health/collector.js';
import { buildQueryPrompt } from './prompt.js';
import type { CopilotState, CopilotInput, AgentContext, AgentResult } from '../types.js';

// State annotation for LangGraph
const CopilotAnnotation = Annotation.Root({
  messages: Annotation<CopilotState['messages']>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
  context: Annotation<AgentContext>(),
  query: Annotation<string>(),
  retrievedDocs: Annotation<CopilotState['retrievedDocs']>(),
  response: Annotation<string>(),
  error: Annotation<string>(),
});

/**
 * Retrieve node - fetch relevant documents
 */
async function retrieveNode(state: typeof CopilotAnnotation.State) {
  const stopTimer = startTimer('agent.copilot.node.retrieve.latency');

  try {
    const docs = await search(state.query, { limit: 5 });

    // Track docs retrieved
    observeHistogram('agent.copilot.docs.retrieved', docs.length);

    if (docs.length > 0) {
      const avgScore = docs.reduce((sum, d) => sum + d.score, 0) / docs.length;
      observeHistogram('agent.copilot.docs.relevance', avgScore);
    }

    stopTimer();
    return {
      retrievedDocs: docs.map((d) => ({
        id: d.id,
        content: d.content,
        score: d.score,
      })),
    };
  } catch (error) {
    stopTimer();
    console.warn('Retrieval failed:', error);
    return { retrievedDocs: [] };
  }
}

/**
 * Generate node - create response
 */
async function generateNode(state: typeof CopilotAnnotation.State) {
  const stopTimer = startTimer('agent.copilot.node.generate.latency');

  try {
    const llm = await llmService.createLLM('generate');
    const prompt = buildQueryPrompt(state as CopilotState);

    const response = await llm.invoke(prompt);
    const content = typeof response.content === 'string' ? response.content : '';

    stopTimer();
    return {
      response: content,
      messages: [{ role: 'assistant' as const, content }],
    };
  } catch (error) {
    stopTimer();
    return { error: `Generation failed: ${error}` };
  }
}

// Build the graph
const graph = new StateGraph(CopilotAnnotation)
  .addNode('retrieve', retrieveNode)
  .addNode('generate', generateNode)
  .addEdge('__start__', 'retrieve')
  .addEdge('retrieve', 'generate')
  .addEdge('generate', END);

const compiledGraph = graph.compile();

/**
 * Invoke copilot agent
 */
export async function invokeCopilot(
  input: CopilotInput,
  context: AgentContext
): Promise<AgentResult<{ response: string }>> {
  const stopTimer = startTimer('agent.copilot.latency');
  incCounter('agent.copilot.invocations');

  try {
    const initialState = {
      messages: [{ role: 'user' as const, content: input.query }],
      context,
      query: input.query,
    };

    const result = await compiledGraph.invoke(initialState);

    if (result.error) {
      stopTimer();
      incCounter('agent.copilot.errors');
      return { success: false, error: result.error };
    }

    stopTimer();
    incCounter('agent.copilot.success');
    return { success: true, data: { response: result.response } };
  } catch (error) {
    stopTimer();
    incCounter('agent.copilot.errors');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
