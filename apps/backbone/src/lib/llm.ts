import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config.js';
import { incCounter, startTimer } from '../health/collector.js';

/**
 * Get LLM instance configured for OpenRouter with instrumentation
 */
export function getLLM(options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const {
    model = 'anthropic/claude-3.5-sonnet',
    temperature = 0.7,
    maxTokens = 4096,
  } = options ?? {};

  const llm = new ChatOpenAI({
    modelName: model,
    temperature,
    maxTokens,
    configuration: {
      baseURL: config.OPENROUTER_BASE_URL,
      apiKey: config.OPENROUTER_API_KEY,
    },
  });

  // Wrap invoke to track metrics
  const originalInvoke = llm.invoke.bind(llm);
  llm.invoke = async (...args: Parameters<typeof originalInvoke>) => {
    const stopTimer = startTimer('llm.request.latency', { model });
    incCounter('llm.request.count', 1, { model });

    try {
      const result = await originalInvoke(...args);

      // Track token usage if available
      const metadata = result.response_metadata as Record<string, unknown> | undefined;
      const usage = metadata?.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;

      if (usage) {
        incCounter('llm.tokens.input', usage.prompt_tokens ?? 0, { model });
        incCounter('llm.tokens.output', usage.completion_tokens ?? 0, { model });
      }

      stopTimer();
      return result;
    } catch (error) {
      stopTimer();
      incCounter('llm.request.errors', 1, { model });
      throw error;
    }
  };

  return llm;
}

/**
 * Available models via OpenRouter
 */
export const MODELS = {
  CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
  CLAUDE_HAIKU: 'anthropic/claude-3-haiku',
  GPT4O: 'openai/gpt-4o',
  GPT4O_MINI: 'openai/gpt-4o-mini',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];
