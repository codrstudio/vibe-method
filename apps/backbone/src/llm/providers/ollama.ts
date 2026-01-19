import { ChatOpenAI } from '@langchain/openai';
import { incCounter, startTimer } from '../../health/collector.js';

export interface OllamaConfig {
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Create Ollama LLM instance with instrumentation
 *
 * Usa ChatOpenAI com endpoint customizado, pois Ollama expõe API compatível com OpenAI
 */
export function createOllamaLLM(options: OllamaConfig) {
  const {
    model,
    baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    temperature = 0.7,
    maxTokens,
  } = options;

  // Ollama expõe endpoint compatível com OpenAI em /v1
  const ollamaOpenAIUrl = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;

  const llm = new ChatOpenAI({
    modelName: model,
    temperature,
    maxTokens,
    configuration: {
      baseURL: ollamaOpenAIUrl,
      apiKey: 'ollama', // Ollama não precisa de API key, mas o SDK exige algo
    },
  });

  // Wrap invoke to track metrics
  const originalInvoke = llm.invoke.bind(llm);
  llm.invoke = async (...args: Parameters<typeof originalInvoke>) => {
    const stopTimer = startTimer('llm.request.latency', { provider: 'ollama', model });
    incCounter('llm.request.count', 1, { provider: 'ollama', model });

    try {
      const result = await originalInvoke(...args);

      // Ollama may include usage info in response metadata
      const metadata = result.response_metadata as Record<string, unknown> | undefined;
      const usage = metadata as { prompt_eval_count?: number; eval_count?: number } | undefined;

      if (usage) {
        incCounter('llm.tokens.input', usage.prompt_eval_count ?? 0, { provider: 'ollama', model });
        incCounter('llm.tokens.output', usage.eval_count ?? 0, { provider: 'ollama', model });
      }

      stopTimer();
      return result;
    } catch (error) {
      stopTimer();
      incCounter('llm.request.errors', 1, { provider: 'ollama', model });
      throw error;
    }
  };

  return llm;
}
