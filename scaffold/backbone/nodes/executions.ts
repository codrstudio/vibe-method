/**
 * EXECUTIONS NODE - Tracking de Execucoes
 *
 * Registra execucoes de workflows para auditoria e debug.
 * Cada execucao tem ID unico, steps, duracao e resultado.
 */

import type { ExecutionStep, ExecutionStatus } from '../types.js';
import * as db from '../db/index.js';

// =============================================================================
// WORKFLOW EXECUTION TRACKER
// =============================================================================

/**
 * Classe para rastrear execucao de um workflow
 */
export class WorkflowExecution {
  private id: string;
  private workflow: string;
  private trigger: string;
  private steps: ExecutionStep[] = [];
  private startedAt: Date;
  private conversationId?: string;
  private userId?: string;
  private metadata: Record<string, unknown>;

  constructor(
    workflow: string,
    trigger: string,
    metadata: Record<string, unknown> = {}
  ) {
    this.id = crypto.randomUUID();
    this.workflow = workflow;
    this.trigger = trigger;
    this.startedAt = new Date();
    this.metadata = metadata;
  }

  /**
   * Retorna o ID da execucao
   */
  getId(): string {
    return this.id;
  }

  /**
   * Define o contexto da execucao
   */
  setContext(conversationId?: string, userId?: string): void {
    this.conversationId = conversationId;
    this.userId = userId;
  }

  /**
   * Registra um step bem-sucedido
   */
  stepSuccess(
    name: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>,
    durationMs: number = 0
  ): void {
    this.steps.push({
      name,
      status: 'success',
      input,
      output,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Registra um step que falhou
   */
  stepFailed(
    name: string,
    error: string,
    input?: Record<string, unknown>,
    durationMs: number = 0
  ): void {
    this.steps.push({
      name,
      status: 'failed',
      input,
      error,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Salva a execucao no banco de dados
   */
  async save(
    status: ExecutionStatus,
    result?: {
      error?: string;
      resultSummary?: Record<string, unknown>;
    }
  ): Promise<void> {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - this.startedAt.getTime();

    try {
      await db.insert('workflow_executions', {
        id: this.id,
        workflow: this.workflow,
        trigger: this.trigger,
        status,
        conversation_id: this.conversationId,
        user_id: this.userId,
        steps: JSON.stringify(this.steps),
        metadata: JSON.stringify({
          ...this.metadata,
          resultSummary: result?.resultSummary,
        }),
        duration_ms: durationMs,
        error: result?.error,
        started_at: this.startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
      });
    } catch (error) {
      // Log mas nao falha - tracking e secundario
      console.error('[Execution] Failed to save:', error);
    }
  }
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Busca execucoes recentes de um workflow
 */
export async function findRecentExecutions(
  workflow: string,
  limit: number = 10
): Promise<unknown[]> {
  return db.query(
    `SELECT * FROM workflow_executions
     WHERE workflow = $1
     ORDER BY started_at DESC
     LIMIT $2`,
    [workflow, limit]
  );
}

/**
 * Busca execucao por ID
 */
export async function findExecutionById(id: string): Promise<unknown | null> {
  return db.queryOne(
    'SELECT * FROM workflow_executions WHERE id = $1',
    [id]
  );
}

/**
 * Conta execucoes por status (para metricas)
 */
export async function countByStatus(
  workflow: string,
  since: Date
): Promise<{ status: string; count: number }[]> {
  return db.query(
    `SELECT status, COUNT(*)::int as count
     FROM workflow_executions
     WHERE workflow = $1 AND started_at >= $2
     GROUP BY status`,
    [workflow, since.toISOString()]
  );
}
