import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { llmService } from '../../llm/index.js';
import { buildSanityPrompt } from './prompt.js';
import type { SanityInput, SanityResult } from './types.js';

const SanityAnnotation = Annotation.Root({
  input: Annotation<SanityInput>(),
  result: Annotation<SanityResult>(),
});

async function invokeNode(state: typeof SanityAnnotation.State) {
  const intent = state.input?.intent ?? 'classify';
  const start = performance.now();

  try {
    const resolved = await llmService.resolve(intent);
    const llm = await llmService.createLLM(intent);
    const prompt = buildSanityPrompt();

    const response = await llm.invoke(prompt);
    const content = typeof response.content === 'string' ? response.content : '';
    const latencyMs = performance.now() - start;

    return {
      result: {
        success: content.toLowerCase().includes('ok'),
        response: content.trim(),
        model: resolved.model,
        provider: resolved.provider,
        latencyMs,
      },
    };
  } catch (error) {
    return {
      result: {
        success: false,
        model: 'unknown',
        provider: 'unknown',
        latencyMs: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

const graph = new StateGraph(SanityAnnotation)
  .addNode('invoke', invokeNode)
  .addEdge('__start__', 'invoke')
  .addEdge('invoke', END);

const compiledGraph = graph.compile();

export async function invokeSanity(input: SanityInput = {}): Promise<SanityResult> {
  const result = await compiledGraph.invoke({ input });
  return result.result;
}
