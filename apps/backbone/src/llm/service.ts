import { intentsRepository, bindingsRepository } from './repository.js';
import { catalogLoader } from './catalog-loader.js';
import { resolveLLM, clearResolveCache } from './resolver.js';
import { createLLMFromResolved, type LLMInstance } from './providers/index.js';
import type {
  LLMIntent,
  LLMBinding,
  LLMIntentWithBinding,
  CreateBindingInput,
  UpdateBindingInput,
  ModelsCatalog,
  CatalogModelWithProvider,
} from './types.js';

// =============================================================================
// Service
// =============================================================================

export const llmService = {
  // ---------------------------------------------------------------------------
  // Intents
  // ---------------------------------------------------------------------------

  /**
   * Get all intents
   */
  async getIntents(): Promise<LLMIntent[]> {
    return intentsRepository.findAll();
  },

  /**
   * Get all intents with their active bindings
   */
  async getIntentsWithBindings(): Promise<LLMIntentWithBinding[]> {
    return intentsRepository.findAllWithBindings();
  },

  /**
   * Get intent by slug
   */
  async getIntent(slug: string): Promise<LLMIntent | null> {
    return intentsRepository.findBySlug(slug);
  },

  /**
   * Get intent by ID
   */
  async getIntentById(id: string): Promise<LLMIntent | null> {
    return intentsRepository.findById(id);
  },

  // ---------------------------------------------------------------------------
  // Catalog
  // ---------------------------------------------------------------------------

  /**
   * Get models catalog
   */
  getCatalog(): ModelsCatalog | null {
    return catalogLoader.getCatalog();
  },

  /**
   * Get all available models with provider info
   */
  getAllModels(): CatalogModelWithProvider[] {
    return catalogLoader.getAllModels();
  },

  /**
   * Get models compatible with intent profile
   */
  async getModelsForIntent(slug: string): Promise<CatalogModelWithProvider[]> {
    const intent = await intentsRepository.findBySlug(slug);
    if (!intent) {
      return [];
    }

    return catalogLoader.getModelsForProfile(intent.profile);
  },

  /**
   * Get models compatible with intent by ID
   */
  async getModelsForIntentById(id: string): Promise<CatalogModelWithProvider[]> {
    const intent = await intentsRepository.findById(id);
    if (!intent) {
      return [];
    }

    return catalogLoader.getModelsForProfile(intent.profile);
  },

  // ---------------------------------------------------------------------------
  // Bindings
  // ---------------------------------------------------------------------------

  /**
   * Get binding by ID
   */
  async getBinding(id: string): Promise<LLMBinding | null> {
    return bindingsRepository.findById(id);
  },

  /**
   * Get bindings for intent
   */
  async getBindingsForIntent(intentId: string): Promise<LLMBinding[]> {
    return bindingsRepository.findByIntent(intentId, false);
  },

  /**
   * Create binding
   */
  async createBinding(input: CreateBindingInput): Promise<LLMBinding> {
    const binding = await bindingsRepository.create(input);
    clearResolveCache();
    return binding;
  },

  /**
   * Update binding
   */
  async updateBinding(id: string, updates: UpdateBindingInput): Promise<LLMBinding | null> {
    const binding = await bindingsRepository.update(id, updates);
    clearResolveCache();
    return binding;
  },

  /**
   * Delete binding
   */
  async deleteBinding(id: string): Promise<boolean> {
    const result = await bindingsRepository.delete(id);
    clearResolveCache();
    return result;
  },

  /**
   * Set binding as active (deactivates others for same intent)
   */
  async setBindingActive(id: string, intentId: string): Promise<LLMBinding | null> {
    const binding = await bindingsRepository.setActive(id, intentId);
    clearResolveCache();
    return binding;
  },

  // ---------------------------------------------------------------------------
  // Resolution
  // ---------------------------------------------------------------------------

  /**
   * Resolve intent to LLM configuration
   */
  async resolve(intentSlug: string) {
    return resolveLLM(intentSlug);
  },

  /**
   * Resolve and create LLM instance
   */
  async createLLM(intentSlug: string): Promise<LLMInstance> {
    const resolved = await resolveLLM(intentSlug);
    return createLLMFromResolved(resolved);
  },

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initialize LLM service (load catalog, start watcher)
   */
  async initialize(enableWatch = true): Promise<void> {
    await catalogLoader.load();

    if (enableWatch) {
      catalogLoader.watch();
    }
  },

  /**
   * Shutdown LLM service
   */
  shutdown(): void {
    catalogLoader.unwatch();
  },
};
