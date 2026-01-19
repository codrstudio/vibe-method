// Main exports
export { llmService } from './service.js';
export { catalogLoader } from './catalog-loader.js';
export { resolveLLM, resolveMultipleLLM, hasBinding, clearResolveCache } from './resolver.js';

// Providers
export {
  createLLM,
  createLLMFromResolved,
  createOpenRouterLLM,
  createOllamaLLM,
  type LLMInstance,
  type CreateLLMOptions,
} from './providers/index.js';

// Types
export type {
  LLMIntent,
  LLMBinding,
  LLMIntentWithBinding,
  IntentProfile,
  ModelsCatalog,
  CatalogProvider,
  CatalogModel,
  CatalogModelWithProvider,
  ResolvedLLM,
  CreateBindingInput,
  UpdateBindingInput,
} from './types.js';

export {
  LLMIntentSchema,
  LLMBindingSchema,
  IntentProfileSchema,
} from './types.js';

// Repository (for advanced use)
export { intentsRepository, bindingsRepository } from './repository.js';
