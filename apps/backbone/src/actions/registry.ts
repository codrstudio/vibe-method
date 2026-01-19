import { z } from 'zod';
import { incCounter, setGauge, startTimer } from '../health/collector.js';
import type {
  ActionDefinition,
  ActionContext,
  ActionCatalogEntry,
  ActionResult,
} from './types.js';

/**
 * Singleton action registry
 */
class ActionRegistry {
  private actions = new Map<string, ActionDefinition>();

  /**
   * Register an action
   */
  register<TInput extends z.ZodType, TOutput extends z.ZodType>(
    action: ActionDefinition<TInput, TOutput>
  ): void {
    if (this.actions.has(action.name)) {
      throw new Error(`Action "${action.name}" already registered`);
    }

    if (action.keywords.length < 3) {
      throw new Error(`Action "${action.name}" must have at least 3 keywords`);
    }

    this.actions.set(action.name, action as ActionDefinition);
    setGauge('actions.registered', this.actions.size);
  }

  /**
   * Get action by name
   */
  get(name: string): ActionDefinition | undefined {
    return this.actions.get(name);
  }

  /**
   * Check if action exists
   */
  has(name: string): boolean {
    return this.actions.has(name);
  }

  /**
   * Execute an action by name
   */
  async execute<T = unknown>(
    name: string,
    input: unknown,
    context: ActionContext
  ): Promise<ActionResult<T>> {
    const stopTimer = startTimer('actions.latency', { action: name });
    incCounter('actions.executed', 1, { action: name });

    const action = this.actions.get(name);

    if (!action) {
      stopTimer();
      return { success: false, error: `Action "${name}" not found` };
    }

    // Check permissions
    const hasPermission = action.permissions.every((p) =>
      context.permissions.includes(p) || context.permissions.includes('*')
    );

    if (!hasPermission) {
      stopTimer();
      incCounter('actions.permission_denied', 1, { action: name });
      return { success: false, error: 'Insufficient permissions' };
    }

    // Validate input
    const inputResult = action.inputSchema.safeParse(input);
    if (!inputResult.success) {
      stopTimer();
      incCounter('actions.validation_errors', 1, { action: name });
      return {
        success: false,
        error: `Invalid input: ${inputResult.error.message}`,
      };
    }

    // Execute
    try {
      const result = await action.execute(inputResult.data, context);

      // Validate output
      const outputResult = action.outputSchema.safeParse(result);
      if (!outputResult.success) {
        stopTimer();
        incCounter('actions.errors', 1, { action: name });
        return {
          success: false,
          error: `Invalid output: ${outputResult.error.message}`,
        };
      }

      stopTimer();
      incCounter('actions.success', 1, { action: name });
      return { success: true, data: outputResult.data as T };
    } catch (error) {
      stopTimer();
      incCounter('actions.errors', 1, { action: name });
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Get catalog for AI discovery
   */
  getCatalog(): ActionCatalogEntry[] {
    return Array.from(this.actions.values()).map((action) => ({
      name: action.name,
      description: action.description,
      keywords: action.keywords,
      permissions: action.permissions,
      inputSchema: this.zodToJsonSchema(action.inputSchema),
      outputSchema: this.zodToJsonSchema(action.outputSchema),
    }));
  }

  /**
   * Search actions by keyword
   */
  search(query: string): ActionCatalogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getCatalog().filter(
      (action) =>
        action.name.toLowerCase().includes(lowerQuery) ||
        action.description.toLowerCase().includes(lowerQuery) ||
        action.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Convert Zod schema to JSON schema (simplified)
   */
  private zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
    return { type: 'object', description: schema.description ?? '' };
  }
}

// Singleton instance
export const registry = new ActionRegistry();

// Convenience function
export async function executeAction<T = unknown>(
  name: string,
  input: unknown,
  context: ActionContext
): Promise<ActionResult<T>> {
  return registry.execute<T>(name, input, context);
}
