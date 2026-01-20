/**
 * biz-review-timeout.ts
 * Executor for handling review timeouts
 *
 * Target: biz:review-timeout
 *
 * Checks for reports that have exceeded their review deadline
 * and marks them as timed out.
 */

import { registerExecutor, type ExecutorResult } from '../executor.js';
import { db } from '../../../lib/db.js';

// Environment configuration
const DEFAULT_TIMEOUT_MINUTES = parseInt(process.env.BIZ_REVIEW_TIMEOUT_MINUTES || '30', 10);

interface OverdueReport {
  id: string;
  title: string;
  review_deadline: string;
  created_at: string;
}

/**
 * Get overdue reports
 */
async function getOverdueReports(): Promise<OverdueReport[]> {
  return db.query<OverdueReport>(
    `SELECT id, title, review_deadline, created_at
     FROM biz.reports
     WHERE status = 'pending'
       AND review_deadline IS NOT NULL
       AND review_deadline < NOW()
     ORDER BY review_deadline ASC
     LIMIT 100`
  );
}

/**
 * Get reports without deadline that have been pending too long
 */
async function getStaleReports(): Promise<OverdueReport[]> {
  return db.query<OverdueReport>(
    `SELECT id, title, review_deadline, created_at
     FROM biz.reports
     WHERE status = 'pending'
       AND review_deadline IS NULL
       AND created_at < NOW() - INTERVAL '${DEFAULT_TIMEOUT_MINUTES} minutes'
     ORDER BY created_at ASC
     LIMIT 100`
  );
}

/**
 * Mark reports as timed out
 */
async function markTimedOut(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await db.execute(
    `UPDATE biz.reports
     SET status = 'timeout',
         decision = 'timeout',
         decision_reason = 'Prazo de revisao excedido',
         updated_at = NOW()
     WHERE id = ANY($1::uuid[])
       AND status = 'pending'`,
    [ids]
  );

  // Add history entries
  for (const id of ids) {
    await db.execute(
      `INSERT INTO biz.review_history (report_id, action, previous_status, new_status, reason)
       VALUES ($1, 'timeout', 'pending', 'timeout', 'Timeout automatico - prazo excedido')`,
      [id]
    );
  }

  return result;
}

/**
 * Executor function
 */
async function execute(
  params: Record<string, unknown>,
  context: { jobId: string; runId: string; attempt: number }
): Promise<ExecutorResult> {
  console.log(`[biz:review-timeout] Starting timeout check (attempt ${context.attempt})`);

  try {
    // Get overdue reports (with explicit deadline)
    const overdueReports = await getOverdueReports();

    // Get stale reports (without deadline but too old)
    const staleReports = await getStaleReports();

    const allReports = [...overdueReports, ...staleReports];

    if (allReports.length === 0) {
      console.log('[biz:review-timeout] No overdue reports found');
      return {
        success: true,
        output: { timedOut: 0, message: 'No overdue reports' },
      };
    }

    // Mark reports as timed out
    const ids = allReports.map((r) => r.id);
    const timedOutCount = await markTimedOut(ids);

    console.log(`[biz:review-timeout] Timed out ${timedOutCount} reports`);

    // Update daily metrics
    const today = new Date().toISOString().split('T')[0];
    await db.execute(
      `INSERT INTO biz.daily_metrics (date, reports_timeout)
       VALUES ($1, $2)
       ON CONFLICT (date) DO UPDATE
       SET reports_timeout = COALESCE(biz.daily_metrics.reports_timeout, 0) + $2,
           updated_at = NOW()`,
      [today, timedOutCount]
    );

    return {
      success: true,
      output: {
        timedOut: timedOutCount,
        overdueWithDeadline: overdueReports.length,
        staleWithoutDeadline: staleReports.length,
        reportIds: ids,
      },
    };
  } catch (error) {
    console.error('[biz:review-timeout] Error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Register the executor
registerExecutor('biz:review-timeout', execute);

console.log('[Scheduler] Registered executor: biz:review-timeout');

export { execute as bizReviewTimeoutExecutor };
