import { db, pool } from './db.js';
import { metrics } from '../pulse/index.js';

// =============================================================================
// Types
// =============================================================================

interface WorkflowExecutionOptions {
  triggerType?: string;
  triggerId?: string;
  triggerData?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
}

interface NodeRecord {
  node: string;
  input: unknown;
  output: unknown;
  durationMs: number;
  tokensUsed?: number;
}

// Sensitive keys to sanitize from inputs/outputs
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Sanitize sensitive data from objects before storing in DB
 */
function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((k) => lowerKey.includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Check if database is available
 */
function isDbAvailable(): boolean {
  return pool !== null;
}

// =============================================================================
// WorkflowExecution Class
// =============================================================================

/**
 * Tracks workflow execution for observability and auditing.
 *
 * Uses SQL functions:
 * - start_workflow_execution()
 * - record_workflow_node()
 * - complete_workflow_execution()
 * - fail_workflow_execution()
 *
 * Graceful degradation: If DB is unavailable, logs to console and continues
 * without breaking execution.
 */
export class WorkflowExecution {
  private executionId: string | null = null;
  private workflowName: string;
  private options: WorkflowExecutionOptions;
  private startTime: number = 0;
  private nodeRecords: NodeRecord[] = [];

  constructor(workflowName: string, options: WorkflowExecutionOptions = {}) {
    this.workflowName = workflowName;
    this.options = {
      triggerType: options.triggerType ?? 'api',
      ...options,
    };
  }

  /**
   * Start workflow execution tracking
   */
  async start(input: unknown): Promise<void> {
    this.startTime = Date.now();

    if (!isDbAvailable()) {
      console.log(`[WorkflowExecution] DB unavailable, skipping audit for ${this.workflowName}`);
      return;
    }

    try {
      const sanitizedInput = sanitize(input);

      const result = await db.queryOne<{ start_workflow_execution: string }>(
        `SELECT start_workflow_execution($1, $2, $3, $4, $5, $6, $7)`,
        [
          this.workflowName,
          this.options.triggerType,
          this.options.triggerId ?? null,
          JSON.stringify(this.options.triggerData ?? {}),
          this.options.entityType ?? null,
          this.options.entityId ?? null,
          JSON.stringify(sanitizedInput),
        ]
      );

      if (result) {
        this.executionId = result.start_workflow_execution;
      }

      metrics.incCounter('workflow.execution.started', { workflow: this.workflowName });
    } catch (error) {
      // Graceful degradation: log error but don't break execution
      console.error(`[WorkflowExecution] Failed to start audit for ${this.workflowName}:`, error);
    }
  }

  /**
   * Record a node execution
   */
  async recordNode(
    node: string,
    input: unknown,
    output: unknown,
    durationMs: number,
    tokensUsed: number = 0
  ): Promise<void> {
    // Always track locally
    this.nodeRecords.push({ node, input, output, durationMs, tokensUsed });

    if (!isDbAvailable() || !this.executionId) {
      return;
    }

    try {
      const sanitizedInput = sanitize(input);
      const sanitizedOutput = sanitize(output);

      await db.execute(
        `SELECT record_workflow_node($1, $2, $3, $4, $5, $6)`,
        [
          this.executionId,
          node,
          JSON.stringify(sanitizedInput),
          JSON.stringify(sanitizedOutput),
          durationMs,
          tokensUsed,
        ]
      );
    } catch (error) {
      // Graceful degradation: log error but don't break execution
      console.error(`[WorkflowExecution] Failed to record node ${node}:`, error);
    }
  }

  /**
   * Complete workflow execution successfully
   */
  async complete(output: unknown): Promise<void> {
    const totalDuration = Date.now() - this.startTime;

    metrics.incCounter('workflow.execution.completed', { workflow: this.workflowName });
    metrics.observe('workflow.execution.duration', totalDuration, { workflow: this.workflowName });

    if (!isDbAvailable() || !this.executionId) {
      return;
    }

    try {
      const sanitizedOutput = sanitize(output);

      await db.execute(
        `SELECT complete_workflow_execution($1, $2)`,
        [this.executionId, JSON.stringify(sanitizedOutput)]
      );
    } catch (error) {
      // Graceful degradation: log error but don't break execution
      console.error(`[WorkflowExecution] Failed to complete audit for ${this.workflowName}:`, error);
    }
  }

  /**
   * Mark workflow execution as failed
   */
  async fail(node: string, error: Error): Promise<void> {
    const totalDuration = Date.now() - this.startTime;

    metrics.incCounter('workflow.execution.failed', { workflow: this.workflowName });
    metrics.observe('workflow.execution.duration', totalDuration, { workflow: this.workflowName });

    if (!isDbAvailable() || !this.executionId) {
      return;
    }

    try {
      await db.execute(
        `SELECT fail_workflow_execution($1, $2, $3, $4)`,
        [
          this.executionId,
          node,
          error.message,
          error.stack ?? null,
        ]
      );
    } catch (dbError) {
      // Graceful degradation: log error but don't break execution
      console.error(`[WorkflowExecution] Failed to record failure for ${this.workflowName}:`, dbError);
    }
  }

  /**
   * Get the execution ID (useful for linking to other records)
   */
  getExecutionId(): string | null {
    return this.executionId;
  }

  /**
   * Get locally tracked node records (useful when DB is unavailable)
   */
  getNodeRecords(): NodeRecord[] {
    return [...this.nodeRecords];
  }
}
