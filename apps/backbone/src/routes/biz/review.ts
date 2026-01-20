/**
 * biz-review.ts
 * API routes for human review system (TASK-5)
 *
 * Endpoints:
 * - GET /pending - List pending reviews
 * - GET /:id - Get single report
 * - POST /:id/approve - Approve a report
 * - POST /:id/reject - Reject a report
 * - POST /:id/fallback - Apply fallback to a report
 * - GET /stats - Get review statistics
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../lib/db.js';

// ============ Types ============

interface Report {
  id: string;
  external_id: string | null;
  source: string;
  title: string;
  content: string | null;
  original_data: Record<string, unknown> | null;
  status: string;
  review_deadline: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  decision: string | null;
  decision_reason: string | null;
  fallback_text: string | null;
  ai_confidence: number | null;
  ai_suggestion: string | null;
  ai_analysis: Record<string, unknown> | null;
  notification_sent_at: string | null;
  notification_count: number;
  priority: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ReviewStats {
  pending: number;
  approved_today: number;
  rejected_today: number;
  fallback_today: number;
  timeout_today: number;
  avg_review_time_ms: number | null;
  overdue: number;
}

// ============ Schemas ============

const ApproveSchema = z.object({
  reason: z.string().optional(),
});

const RejectSchema = z.object({
  reason: z.string().min(1, 'Motivo e obrigatorio'),
});

const FallbackSchema = z.object({
  fallback_text: z.string().min(1, 'Texto de fallback e obrigatorio'),
  reason: z.string().optional(),
});

// ============ Repository ============

const reviewRepository = {
  async findPending(limit = 50, offset = 0): Promise<Report[]> {
    return db.query<Report>(
      `SELECT * FROM biz.reports
       WHERE status = 'pending'
       ORDER BY priority DESC, created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
  },

  async findById(id: string): Promise<Report | null> {
    return db.queryOne<Report>(
      `SELECT * FROM biz.reports WHERE id = $1`,
      [id]
    );
  },

  async countPending(): Promise<number> {
    const result = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM biz.reports WHERE status = 'pending'`
    );
    return parseInt(result?.count || '0', 10);
  },

  async countOverdue(): Promise<number> {
    const result = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM biz.reports
       WHERE status = 'pending' AND review_deadline < NOW()`
    );
    return parseInt(result?.count || '0', 10);
  },

  async getStats(): Promise<ReviewStats> {
    const result = await db.queryOne<{
      pending: string;
      approved_today: string;
      rejected_today: string;
      fallback_today: string;
      timeout_today: string;
      overdue: string;
      avg_review_time_ms: string | null;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'pending') as pending,
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'approved' AND DATE(reviewed_at) = CURRENT_DATE) as approved_today,
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'rejected' AND DATE(reviewed_at) = CURRENT_DATE) as rejected_today,
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'fallback' AND DATE(reviewed_at) = CURRENT_DATE) as fallback_today,
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'timeout' AND DATE(updated_at) = CURRENT_DATE) as timeout_today,
        (SELECT COUNT(*) FROM biz.reports WHERE status = 'pending' AND review_deadline < NOW()) as overdue,
        (SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) * 1000)::INT
         FROM biz.reports WHERE reviewed_at IS NOT NULL AND DATE(reviewed_at) = CURRENT_DATE) as avg_review_time_ms
    `);

    return {
      pending: parseInt(result?.pending || '0', 10),
      approved_today: parseInt(result?.approved_today || '0', 10),
      rejected_today: parseInt(result?.rejected_today || '0', 10),
      fallback_today: parseInt(result?.fallback_today || '0', 10),
      timeout_today: parseInt(result?.timeout_today || '0', 10),
      overdue: parseInt(result?.overdue || '0', 10),
      avg_review_time_ms: result?.avg_review_time_ms ? parseInt(result.avg_review_time_ms, 10) : null,
    };
  },

  async approve(
    id: string,
    userId: string | null,
    reason?: string
  ): Promise<Report | null> {
    const result = await db.queryOne<Report>(
      `UPDATE biz.reports
       SET status = 'approved',
           decision = 'approve',
           decision_reason = $2,
           reviewed_at = NOW(),
           reviewed_by = $3,
           updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id, reason || null, userId]
    );

    if (result) {
      await this.addHistory(id, 'approved', 'pending', 'approved', userId, reason);
    }

    return result;
  },

  async reject(
    id: string,
    userId: string | null,
    reason: string
  ): Promise<Report | null> {
    const result = await db.queryOne<Report>(
      `UPDATE biz.reports
       SET status = 'rejected',
           decision = 'reject',
           decision_reason = $2,
           reviewed_at = NOW(),
           reviewed_by = $3,
           updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id, reason, userId]
    );

    if (result) {
      await this.addHistory(id, 'rejected', 'pending', 'rejected', userId, reason);
    }

    return result;
  },

  async fallback(
    id: string,
    userId: string | null,
    fallbackText: string,
    reason?: string
  ): Promise<Report | null> {
    const result = await db.queryOne<Report>(
      `UPDATE biz.reports
       SET status = 'fallback',
           decision = 'fallback',
           decision_reason = $3,
           fallback_text = $2,
           reviewed_at = NOW(),
           reviewed_by = $4,
           updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id, fallbackText, reason || null, userId]
    );

    if (result) {
      await this.addHistory(id, 'fallback', 'pending', 'fallback', userId, reason);
    }

    return result;
  },

  async addHistory(
    reportId: string,
    action: string,
    previousStatus: string,
    newStatus: string,
    userId: string | null,
    reason?: string
  ): Promise<void> {
    await db.execute(
      `INSERT INTO biz.review_history (report_id, action, previous_status, new_status, performed_by, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [reportId, action, previousStatus, newStatus, userId, reason || null]
    );
  },
};

// ============ Routes ============

export const bizReviewRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user ID from request (placeholder - implement auth middleware)
  const getUserId = (request: { headers: { 'x-user-id'?: string } }) => {
    return request.headers['x-user-id'] || null;
  };

  // GET /pending - List pending reviews
  fastify.get<{
    Querystring: { limit?: string; offset?: string };
  }>('/pending', async (request, reply) => {
    const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
    const offset = parseInt(request.query.offset || '0', 10);

    const [reports, total] = await Promise.all([
      reviewRepository.findPending(limit, offset),
      reviewRepository.countPending(),
    ]);

    return reply.send({
      data: reports,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + reports.length < total,
      },
    });
  });

  // GET /stats - Get review statistics
  fastify.get('/stats', async (_request, reply) => {
    const stats = await reviewRepository.getStats();
    return reply.send({ data: stats });
  });

  // GET /:id - Get single report
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const report = await reviewRepository.findById(request.params.id);

    if (!report) {
      return reply.notFound('Report not found');
    }

    return reply.send({ data: report });
  });

  // POST /:id/approve - Approve a report
  fastify.post<{ Params: { id: string }; Body: unknown }>(
    '/:id/approve',
    async (request, reply) => {
      const result = ApproveSchema.safeParse(request.body);

      if (!result.success) {
        return reply.badRequest(result.error.message);
      }

      const userId = getUserId(request);
      const report = await reviewRepository.approve(
        request.params.id,
        userId,
        result.data.reason
      );

      if (!report) {
        return reply.notFound('Report not found or already processed');
      }

      return reply.send({ data: report });
    }
  );

  // POST /:id/reject - Reject a report
  fastify.post<{ Params: { id: string }; Body: unknown }>(
    '/:id/reject',
    async (request, reply) => {
      const result = RejectSchema.safeParse(request.body);

      if (!result.success) {
        return reply.badRequest(result.error.message);
      }

      const userId = getUserId(request);
      const report = await reviewRepository.reject(
        request.params.id,
        userId,
        result.data.reason
      );

      if (!report) {
        return reply.notFound('Report not found or already processed');
      }

      return reply.send({ data: report });
    }
  );

  // POST /:id/fallback - Apply fallback
  fastify.post<{ Params: { id: string }; Body: unknown }>(
    '/:id/fallback',
    async (request, reply) => {
      const result = FallbackSchema.safeParse(request.body);

      if (!result.success) {
        return reply.badRequest(result.error.message);
      }

      const userId = getUserId(request);
      const report = await reviewRepository.fallback(
        request.params.id,
        userId,
        result.data.fallback_text,
        result.data.reason
      );

      if (!report) {
        return reply.notFound('Report not found or already processed');
      }

      return reply.send({ data: report });
    }
  );
};

// Export repository for use in executors
export { reviewRepository };
