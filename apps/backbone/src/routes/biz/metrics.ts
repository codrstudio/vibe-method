/**
 * biz-metrics.ts
 * API routes for pipeline metrics and monitoring (TASK-6)
 *
 * Endpoints:
 * - GET /today - Get today's metrics
 * - GET /history - Get metrics history
 * - GET /pipeline-runs - Get pipeline execution history
 * - GET /alerts - Get active alerts
 * - POST /alerts/:id/acknowledge - Acknowledge an alert
 * - POST /alerts/:id/resolve - Resolve an alert
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../lib/db.js';
import { bizPatterns, type HistoryEntry, type DailyStats } from '../../lib/biz-patterns.js';

// ============ Types ============

interface DailyMetrics {
  id: string;
  date: string;
  pipeline_runs: number;
  pipeline_successes: number;
  pipeline_failures: number;
  avg_duration_ms: number | null;
  reports_created: number;
  reports_approved: number;
  reports_rejected: number;
  reports_fallback: number;
  reports_timeout: number;
  avg_review_time_ms: number | null;
  reviews_on_time: number;
  reviews_late: number;
  alerts_triggered: number;
  alerts_critical: number;
  alerts_warning: number;
  patterns_detected: unknown[];
  created_at: string;
  updated_at: string;
}

interface PipelineRun {
  id: string;
  pipeline_name: string;
  trigger_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  current_stage: string | null;
  stages_completed: string[];
  stages_failed: string[];
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  items_skipped: number;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  triggered_by: string | null;
  parameters: Record<string, unknown>;
  output: Record<string, unknown>;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string | null;
  status: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  source: string | null;
  source_id: string | null;
  related_data: Record<string, unknown> | null;
  notification_sent_at: string | null;
  notification_channel: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============ Schemas ============

const AcknowledgeSchema = z.object({
  note: z.string().optional(),
});

const ResolveSchema = z.object({
  resolution: z.string().optional(),
});

// ============ Repository ============

export const metricsRepository = {
  async getToday(): Promise<DailyMetrics | null> {
    return db.queryOne<DailyMetrics>(
      `SELECT * FROM biz.daily_metrics WHERE date = CURRENT_DATE`
    );
  },

  async getTodayStats(): Promise<DailyStats> {
    const result = await db.queryOne<{
      approved: string;
      rejected: string;
      fallback: string;
      timeout: string;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'approved' AND DATE(reviewed_at) = CURRENT_DATE) as approved,
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'rejected' AND DATE(reviewed_at) = CURRENT_DATE) as rejected,
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'fallback' AND DATE(reviewed_at) = CURRENT_DATE) as fallback,
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'timeout' AND DATE(updated_at) = CURRENT_DATE) as timeout
    `);

    const approved = parseInt(result?.approved || '0', 10);
    const rejected = parseInt(result?.rejected || '0', 10);
    const fallback = parseInt(result?.fallback || '0', 10);
    const timeout = parseInt(result?.timeout || '0', 10);

    return {
      approved,
      rejected,
      fallback,
      timeout,
      total: approved + rejected + fallback + timeout,
    };
  },

  async getHistory(days = 30): Promise<DailyMetrics[]> {
    return db.query<DailyMetrics>(
      `SELECT * FROM biz.daily_metrics
       WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`
    );
  },

  async getHistoryForAnalysis(days = 30): Promise<HistoryEntry[]> {
    return db.query<HistoryEntry>(
      `SELECT
         date::text,
         reports_approved,
         reports_rejected,
         reports_fallback,
         reports_timeout,
         avg_review_time_ms,
         pipeline_successes,
         pipeline_failures
       FROM biz.daily_metrics
       WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date ASC`
    );
  },

  async getPipelineRuns(limit = 50, offset = 0): Promise<PipelineRun[]> {
    return db.query<PipelineRun>(
      `SELECT * FROM biz.pipeline_runs
       ORDER BY started_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
  },

  async getRecentPipelineRuns(hours = 24): Promise<PipelineRun[]> {
    return db.query<PipelineRun>(
      `SELECT * FROM biz.pipeline_runs
       WHERE started_at >= NOW() - INTERVAL '${hours} hours'
       ORDER BY started_at DESC`
    );
  },

  async getPipelineRunsCount(): Promise<number> {
    const result = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM biz.pipeline_runs`
    );
    return parseInt(result?.count || '0', 10);
  },

  async getActiveAlerts(): Promise<Alert[]> {
    return db.query<Alert>(
      `SELECT * FROM biz.alerts
       WHERE status IN ('active', 'acknowledged')
       ORDER BY
         CASE severity
           WHEN 'critical' THEN 1
           WHEN 'error' THEN 2
           WHEN 'warning' THEN 3
           ELSE 4
         END,
         created_at DESC`
    );
  },

  async getAlertById(id: string): Promise<Alert | null> {
    return db.queryOne<Alert>(
      `SELECT * FROM biz.alerts WHERE id = $1`,
      [id]
    );
  },

  async acknowledgeAlert(id: string, userId: string | null): Promise<Alert | null> {
    return db.queryOne<Alert>(
      `UPDATE biz.alerts
       SET status = 'acknowledged',
           acknowledged_at = NOW(),
           acknowledged_by = $2
       WHERE id = $1 AND status = 'active'
       RETURNING *`,
      [id, userId]
    );
  },

  async resolveAlert(id: string, userId: string | null, resolution?: string): Promise<Alert | null> {
    return db.queryOne<Alert>(
      `UPDATE biz.alerts
       SET status = 'resolved',
           resolved_at = NOW(),
           resolved_by = $2,
           metadata = metadata || jsonb_build_object('resolution', $3)
       WHERE id = $1 AND status IN ('active', 'acknowledged')
       RETURNING *`,
      [id, userId, resolution || null]
    );
  },

  async createAlert(data: {
    type: string;
    severity: string;
    title: string;
    message?: string;
    source?: string;
    sourceId?: string;
    relatedData?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<Alert> {
    const result = await db.queryOne<Alert>(
      `INSERT INTO biz.alerts (type, severity, title, message, source, source_id, related_data, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.type,
        data.severity,
        data.title,
        data.message || null,
        data.source || null,
        data.sourceId || null,
        data.relatedData ? JSON.stringify(data.relatedData) : null,
        data.metadata ? JSON.stringify(data.metadata) : '{}',
      ]
    );
    return result!;
  },

  async upsertDailyMetrics(date: string, updates: Partial<DailyMetrics>): Promise<DailyMetrics> {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [date];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    const result = await db.queryOne<DailyMetrics>(
      `INSERT INTO biz.daily_metrics (date)
       VALUES ($1)
       ON CONFLICT (date) DO UPDATE
       SET ${setClauses.join(', ')}, updated_at = NOW()
       RETURNING *`,
      values
    );

    return result!;
  },

  async incrementDailyMetric(date: string, field: string, amount = 1): Promise<void> {
    await db.execute(
      `INSERT INTO biz.daily_metrics (date, ${field})
       VALUES ($1, $2)
       ON CONFLICT (date) DO UPDATE
       SET ${field} = COALESCE(biz.daily_metrics.${field}, 0) + $2,
           updated_at = NOW()`,
      [date, amount]
    );
  },

  // Pipeline run management
  async startPipelineRun(
    pipelineName: string,
    triggerType: string,
    triggeredBy?: string,
    parameters?: Record<string, unknown>
  ): Promise<PipelineRun> {
    const result = await db.queryOne<PipelineRun>(
      `INSERT INTO biz.pipeline_runs (pipeline_name, trigger_type, triggered_by, parameters)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [pipelineName, triggerType, triggeredBy || null, parameters ? JSON.stringify(parameters) : '{}']
    );
    return result!;
  },

  async updatePipelineRun(
    id: string,
    updates: {
      status?: string;
      currentStage?: string;
      stagesCompleted?: string[];
      stagesFailed?: string[];
      itemsProcessed?: number;
      itemsSucceeded?: number;
      itemsFailed?: number;
      itemsSkipped?: number;
      errorMessage?: string;
      errorDetails?: Record<string, unknown>;
      output?: Record<string, unknown>;
    }
  ): Promise<PipelineRun | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [id];
    let paramIndex = 2;

    const fieldMap: Record<string, string> = {
      status: 'status',
      currentStage: 'current_stage',
      stagesCompleted: 'stages_completed',
      stagesFailed: 'stages_failed',
      itemsProcessed: 'items_processed',
      itemsSucceeded: 'items_succeeded',
      itemsFailed: 'items_failed',
      itemsSkipped: 'items_skipped',
      errorMessage: 'error_message',
      errorDetails: 'error_details',
      output: 'output',
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && fieldMap[key]) {
        setClauses.push(`${fieldMap[key]} = $${paramIndex}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (updates.status === 'completed' || updates.status === 'failed') {
      setClauses.push(`completed_at = NOW()`);
      setClauses.push(`duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000`);
    }

    if (setClauses.length === 0) return null;

    return db.queryOne<PipelineRun>(
      `UPDATE biz.pipeline_runs
       SET ${setClauses.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );
  },
};

// ============ Routes ============

export const bizMetricsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user ID from request (placeholder - implement auth middleware)
  const getUserId = (request: { headers: { 'x-user-id'?: string } }) => {
    return request.headers['x-user-id'] || null;
  };

  // GET /today - Get today's metrics with patterns
  fastify.get('/today', async (_request, reply) => {
    const [metrics, stats, history] = await Promise.all([
      metricsRepository.getToday(),
      metricsRepository.getTodayStats(),
      metricsRepository.getHistoryForAnalysis(14),
    ]);

    // Detect patterns
    const patterns = [
      ...bizPatterns.detectPatterns(stats),
      ...bizPatterns.analyzeHistory(history),
    ];

    return reply.send({
      data: {
        metrics,
        stats,
        patterns,
      },
    });
  });

  // GET /history - Get metrics history
  fastify.get<{
    Querystring: { days?: string };
  }>('/history', async (request, reply) => {
    const days = Math.min(parseInt(request.query.days || '30', 10), 90);
    const history = await metricsRepository.getHistory(days);

    return reply.send({ data: history });
  });

  // GET /pipeline-runs - Get pipeline execution history
  fastify.get<{
    Querystring: { limit?: string; offset?: string; recent?: string };
  }>('/pipeline-runs', async (request, reply) => {
    const { recent, limit, offset } = request.query;

    if (recent) {
      const hours = Math.min(parseInt(recent, 10), 168); // max 7 days
      const runs = await metricsRepository.getRecentPipelineRuns(hours);
      return reply.send({ data: runs });
    }

    const limitNum = Math.min(parseInt(limit || '50', 10), 100);
    const offsetNum = parseInt(offset || '0', 10);

    const [runs, total] = await Promise.all([
      metricsRepository.getPipelineRuns(limitNum, offsetNum),
      metricsRepository.getPipelineRunsCount(),
    ]);

    return reply.send({
      data: runs,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + runs.length < total,
      },
    });
  });

  // GET /alerts - Get active alerts
  fastify.get('/alerts', async (_request, reply) => {
    const alerts = await metricsRepository.getActiveAlerts();
    return reply.send({ data: alerts });
  });

  // POST /alerts/:id/acknowledge - Acknowledge an alert
  fastify.post<{ Params: { id: string }; Body: unknown }>(
    '/alerts/:id/acknowledge',
    async (request, reply) => {
      const result = AcknowledgeSchema.safeParse(request.body);

      if (!result.success) {
        return reply.badRequest(result.error.message);
      }

      const userId = getUserId(request);
      const alert = await metricsRepository.acknowledgeAlert(request.params.id, userId);

      if (!alert) {
        return reply.notFound('Alert not found or already acknowledged');
      }

      return reply.send({ data: alert });
    }
  );

  // POST /alerts/:id/resolve - Resolve an alert
  fastify.post<{ Params: { id: string }; Body: unknown }>(
    '/alerts/:id/resolve',
    async (request, reply) => {
      const result = ResolveSchema.safeParse(request.body);

      if (!result.success) {
        return reply.badRequest(result.error.message);
      }

      const userId = getUserId(request);
      const alert = await metricsRepository.resolveAlert(
        request.params.id,
        userId,
        result.data.resolution
      );

      if (!alert) {
        return reply.notFound('Alert not found or already resolved');
      }

      return reply.send({ data: alert });
    }
  );
};

// Export repository for use in executors
export { metricsRepository as bizMetricsRepository };
