import { bindingsRepository, intentsRepository } from './repository.js';
import { catalogLoader } from './catalog-loader.js';
import type { ResolvedLLM } from './types.js';

// Default fallback configuration
const DEFAULT_PROVIDER = 'ollama';
const DEFAULT_MODEL = 'llama3:8b';

// In-memory cache for resolved bindings
const resolveCache = new Map<string, { resolved: ResolvedLLM; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Clear resolve cache (called on catalog reload)
 */
export function clearResolveCache(): void {
  resolveCache.clear();
}

// Clear cache when catalog reloads
catalogLoader.on('reload', clearResolveCache);

/**
 * Resolve intent slug to LLM configuration
 */
export async function resolveLLM(intentSlug: string): Promise<ResolvedLLM> {
  // Check cache
  const cached = resolveCache.get(intentSlug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.resolved;
  }

  // Lookup binding for intent
  const binding = await bindingsRepository.findByIntentSlug(intentSlug);

  let resolved: ResolvedLLM;

  if (binding) {
    // Use configured binding
    const baseUrl = catalogLoader.getProviderBaseUrl(binding.provider);

    resolved = {
      provider: binding.provider,
      model: binding.model,
      baseUrl: baseUrl ?? getDefaultBaseUrl(binding.provider),
      config: {
        temperature: binding.temperature ?? undefined,
        maxTokens: binding.maxTokens ?? undefined,
      },
    };
  } else {
    // Use fallback
    console.warn(`[LLM] No binding for intent "${intentSlug}", using fallback`);

    const baseUrl = catalogLoader.getProviderBaseUrl(DEFAULT_PROVIDER);

    resolved = {
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
      baseUrl: baseUrl ?? getDefaultBaseUrl(DEFAULT_PROVIDER),
      config: {},
    };
  }

  // Cache result
  resolveCache.set(intentSlug, { resolved, timestamp: Date.now() });

  return resolved;
}

/**
 * Resolve multiple intents at once
 */
export async function resolveMultipleLLM(intentSlugs: string[]): Promise<Map<string, ResolvedLLM>> {
  const results = new Map<string, ResolvedLLM>();

  await Promise.all(
    intentSlugs.map(async (slug) => {
      const resolved = await resolveLLM(slug);
      results.set(slug, resolved);
    })
  );

  return results;
}

/**
 * Check if intent has a configured binding
 */
export async function hasBinding(intentSlug: string): Promise<boolean> {
  const binding = await bindingsRepository.findByIntentSlug(intentSlug);
  return binding !== null;
}

/**
 * Get default base URL for provider
 */
function getDefaultBaseUrl(provider: string): string {
  switch (provider) {
    case 'openrouter':
      return 'https://openrouter.ai/api/v1';
    case 'ollama':
      return 'http://localhost:11434';
    default:
      return '';
  }
}
