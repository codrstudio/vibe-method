// Import catalog to register all actions
import './catalog/index.js';

export { registry, executeAction } from './registry.js';
export type {
  ActionDefinition,
  ActionContext,
  ActionCatalogEntry,
  ActionResult,
} from './types.js';
