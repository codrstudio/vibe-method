import { z } from 'zod';

/**
 * Context passed to every action execution
 */
export interface ActionContext {
  userId: string;
  userRole: string;
  permissions: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Base action definition
 */
export interface ActionDefinition<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
> {
  /** Unique action name: domain.verbNoun (e.g., thread.create) */
  name: string;

  /** Human-readable description */
  description: string;

  /** Keywords for AI discovery (minimum 3) */
  keywords: string[];

  /** Input validation schema */
  inputSchema: TInput;

  /** Output validation schema */
  outputSchema: TOutput;

  /** Required permissions to execute */
  permissions: string[];

  /** Execute the action */
  execute: (
    input: z.infer<TInput>,
    context: ActionContext
  ) => Promise<z.infer<TOutput>>;
}

/**
 * Catalog entry for action discovery
 */
export interface ActionCatalogEntry {
  name: string;
  description: string;
  keywords: string[];
  permissions: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

/**
 * Action execution result
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
