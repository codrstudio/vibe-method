import { createOpenRouterLLM } from './openrouter.js';
import { createOllamaLLM } from './ollama.js';
import { catalogLoader } from '../catalog-loader.js';
import type { ResolvedLLM } from '../types.js';

export type LLMInstance = ReturnType<typeof createOpenRouterLLM> | ReturnType<typeof createOllamaLLM>;

export interface CreateLLMOptions {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Create LLM instance based on provider
 */
export function createLLM(options: CreateLLMOptions): LLMInstance {
  const { provider, model, temperature, maxTokens } = options;

  // Get base URL from catalog
  const baseUrl = catalogLoader.getProviderBaseUrl(provider);

  switch (provider) {
    case 'openrouter':
      return createOpenRouterLLM({
        model,
        baseUrl: baseUrl ?? undefined,
        temperature,
        maxTokens,
      });

    case 'ollama':
      return createOllamaLLM({
        model,
        baseUrl: baseUrl ?? undefined,
        temperature,
        maxTokens,
      });

    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Create LLM from resolved configuration
 */
export function createLLMFromResolved(resolved: ResolvedLLM): LLMInstance {
  // PostgreSQL returns DECIMAL as string, need to convert to number
  const temperature =
    resolved.config.temperature != null ? Number(resolved.config.temperature) : undefined;
  const maxTokens =
    resolved.config.maxTokens != null ? Number(resolved.config.maxTokens) : undefined;

  return createLLM({
    provider: resolved.provider,
    model: resolved.model,
    temperature,
    maxTokens,
  });
}
