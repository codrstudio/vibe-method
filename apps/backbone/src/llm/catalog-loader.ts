import { watch, type FSWatcher } from 'fs';
import { readFile } from 'fs/promises';
import { EventEmitter } from 'events';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ModelsCatalog, CatalogModel, CatalogModelWithProvider, IntentProfile } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CATALOG_PATH = resolve(__dirname, 'models-catalog.json');

/**
 * Catalog loader with hot reload support
 */
class CatalogLoader extends EventEmitter {
  private catalog: ModelsCatalog | null = null;
  private catalogPath: string;
  private watcher: FSWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(catalogPath?: string) {
    super();
    this.catalogPath = catalogPath ?? process.env.LLM_CATALOG_PATH ?? DEFAULT_CATALOG_PATH;
  }

  /**
   * Load catalog from file
   */
  async load(): Promise<ModelsCatalog> {
    try {
      const content = await readFile(this.catalogPath, 'utf-8');
      this.catalog = JSON.parse(content) as ModelsCatalog;
      console.log(`[CatalogLoader] Loaded catalog v${this.catalog.version} from ${this.catalogPath}`);
      return this.catalog;
    } catch (error) {
      console.error(`[CatalogLoader] Failed to load catalog:`, error);
      throw error;
    }
  }

  /**
   * Watch catalog file for changes (hot reload)
   */
  watch(): void {
    if (this.watcher) {
      return;
    }

    try {
      this.watcher = watch(this.catalogPath, (eventType) => {
        if (eventType === 'change') {
          // Debounce to avoid multiple reloads
          if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
          }

          this.debounceTimer = setTimeout(async () => {
            console.log('[CatalogLoader] Catalog file changed, reloading...');
            try {
              await this.load();
              this.emit('reload', this.catalog);
            } catch (error) {
              console.error('[CatalogLoader] Failed to reload catalog:', error);
              this.emit('error', error);
            }
          }, 500);
        }
      });

      console.log(`[CatalogLoader] Watching ${this.catalogPath} for changes`);
    } catch (error) {
      console.error(`[CatalogLoader] Failed to watch catalog:`, error);
    }
  }

  /**
   * Stop watching catalog file
   */
  unwatch(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Get current catalog
   */
  getCatalog(): ModelsCatalog | null {
    return this.catalog;
  }

  /**
   * Get all models with provider info
   */
  getAllModels(): CatalogModelWithProvider[] {
    if (!this.catalog) return [];

    const models: CatalogModelWithProvider[] = [];

    for (const [providerId, provider] of Object.entries(this.catalog.providers)) {
      for (const model of provider.models) {
        models.push({
          ...model,
          provider: providerId,
          providerName: provider.name,
          providerType: provider.type,
        });
      }
    }

    return models;
  }

  /**
   * Get models filtered by intent profile
   */
  getModelsForProfile(profile: IntentProfile): CatalogModelWithProvider[] {
    const allModels = this.getAllModels();

    return allModels.filter((model) => {
      // Filter by min params
      if (profile.minParams && !this.meetsMinParams(model.params, profile.minParams)) {
        return false;
      }

      // Filter by max params
      if (profile.maxParams && !this.meetsMaxParams(model.params, profile.maxParams)) {
        return false;
      }

      // Filter by capabilities
      if (profile.requiresJSON && !model.capabilities.includes('json')) {
        return false;
      }
      if (profile.requiresVision && !model.capabilities.includes('vision')) {
        return false;
      }
      if (profile.requiresTools && !model.capabilities.includes('tools')) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get provider base URL
   */
  getProviderBaseUrl(providerId: string): string | null {
    return this.catalog?.providers[providerId]?.baseUrl ?? null;
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string) {
    return this.catalog?.providers[providerId] ?? null;
  }

  /**
   * Check if model params meets minimum requirement
   */
  private meetsMinParams(modelParams: string, minParams: string): boolean {
    return this.parseParams(modelParams) >= this.parseParams(minParams);
  }

  /**
   * Check if model params meets maximum requirement
   */
  private meetsMaxParams(modelParams: string, maxParams: string): boolean {
    return this.parseParams(modelParams) <= this.parseParams(maxParams);
  }

  /**
   * Parse params string to number (e.g., "7b" -> 7, "70b" -> 70)
   */
  private parseParams(params: string): number {
    const match = params.match(/(\d+)b/i);
    return match ? parseInt(match[1], 10) : 0;
  }
}

// Singleton instance
export const catalogLoader = new CatalogLoader();
