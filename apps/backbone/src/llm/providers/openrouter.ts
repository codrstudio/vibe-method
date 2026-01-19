import { ChatOpenAI } from '@langchain/openai';
import { config } from '../../config.js';
import { incCounter, startTimer } from '../../health/collector.js';

export interface OpenRouterConfig {
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Create OpenRouter LLM instance with instrumentation
 */
export function createOpenRouterLLM(options: OpenRouterConfig) {
  const {
    model,
    baseUrl = config.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  const llm = new ChatOpenAI({
    modelName: model,
    temperature,
    maxTokens,
    configuration: {
      baseURL: baseUrl,
      apiKey: config.OPENROUTER_API_KEY,
    },
  });

  // Wrap invoke to track metrics
  const originalInvoke = llm.invoke.bind(llm);
  llm.invoke = async (...args: Parameters<typeof originalInvoke>) => {
    const stopTimer = startTimer('llm.request.latency', { provider: 'openrouter', model });
    incCounter('llm.request.count', 1, { provider: 'openrouter', model });

    try {
      const result = await originalInvoke(...args);

      // Track token usage if available
      const metadata = result.response_metadata as Record<string, unknown> | undefined;
      const usage = metadata?.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;

      if (usage) {
        incCounter('llm.tokens.input', usage.prompt_tokens ?? 0, { provider: 'openrouter', model });
        incCounter('llm.tokens.output', usage.completion_tokens ?? 0, { provider: 'openrouter', model });
      }

      stopTimer();
      return result;
    } catch (error) {
      stopTimer();
      incCounter('llm.request.errors', 1, { provider: 'openrouter', model });
      throw error;
    }
  };

  return llm;
}
