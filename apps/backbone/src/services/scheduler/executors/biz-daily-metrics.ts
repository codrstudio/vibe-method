/**
 * biz-daily-metrics.ts
 * Executor for aggregating daily metrics
 *
 * Target: biz:daily-metrics
 *
 * Runs at midnight to aggregate the previous day's metrics
 * and detect patterns in historical data.
 */

import { registerExecutor, type ExecutorResult } from '../executor.js';
import { db } from '../../../lib/db.js';
import { bizPatterns, type HistoryEntry } from '../../../lib/biz-patterns.js';

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Aggregate metrics for a specific date
 */
async function aggregateMetricsForDate(date: string): Promise<void> {
  console.log(`[biz:daily-metrics] Aggregating metrics for ${date}`);

  // Get report counts
  const reportCounts = await db.queryOne<{
    created: string;
    approved: string;
    rejected: string;
    fallback: string;
    timeout: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM biz.reports WHERE DATE(created_at) = $1) as created,
      (SELECT COUNT(*) FROM biz.reports WHERE status = 'approved' AND DATE(reviewed_at) = $1) as approved,
      (SELECT COUNT(*) FROM biz.reports WHERE status = 'rejected' AND DATE(reviewed_at) = $1) as rejected,
      (SELECT COUNT(*) FROM biz.reports WHERE status = 'fallback' AND DATE(reviewed_at) = $1) as fallback,
      (SELECT COUNT(*) FROM biz.reports WHERE status = 'timeout' AND DATE(updated_at) = $1) as timeout
  `, [date]);

  // Get pipeline counts
  const pipelineCounts = await db.queryOne<{
    runs: string;
    successes: string;
    failures: string;
    avg_duration: string | null;
  }>(`
    SELECT
      COUNT(*) as runs,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successes,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures,
      AVG(duration_ms)::INT as avg_duration
    FROM biz.pipeline_runs
    WHERE DATE(started_at) = $1
  `, [date]);

  // Get review timing metrics
  const reviewMetrics = await db.queryOne<{
    avg_review_time: string | null;
    on_time: string;
    late: string;
  }>(`
    SELECT
      AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) * 1000)::INT as avg_review_time,
      SUM(CASE WHEN review_deadline IS NULL OR reviewed_at <= review_deadline THEN 1 ELSE 0 END) as on_time,
      SUM(CASE WHEN review_deadline IS NOT NULL AND reviewed_at > review_deadline THEN 1 ELSE 0 END) as late
    FROM biz.reports
    WHERE DATE(reviewed_at) = $1
  `, [date]);

  // Get alert counts
  const alertCounts = await db.queryOne<{
    triggered: string;
    critical: string;
    warning: string;
  }>(`
    SELECT
      COUNT(*) as triggered,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning
    FROM biz.alerts
    WHERE DATE(created_at) = $1
  `, [date]);

  // Detect patterns from historical data
  const history = await db.query<HistoryEntry>(`
    SELECT
      date::text,
      reports_approved,
      reports_rejected,
      reports_fallback,
      reports_timeout,
      avg_review_time_ms,
      pipeline_successes,
      pipeline_failures
    FROM biz.daily_metrics
    WHERE date >= $1::date - INTERVAL '14 days'
    ORDER BY date ASC
  `, [date]);

  const patterns = bizPatterns.analyzeHistory(history);

  // Upsert daily metrics
  await db.execute(`
    INSERT INTO biz.daily_metrics (
      date,
      reports_created,
      reports_approved,
      reports_rejected,
      reports_fallback,
      reports_timeout,
      pipeline_runs,
      pipeline_successes,
      pipeline_failures,
      avg_duration_ms,
      avg_review_time_ms,
      reviews_on_time,
      reviews_late,
      alerts_triggered,
      alerts_critical,
      alerts_warning,
      patterns_detected,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
    )
    ON CONFLICT (date) DO UPDATE SET
      reports_created = $2,
      reports_approved = $3,
      reports_rejected = $4,
      reports_fallback = $5,
      reports_timeout = $6,
      pipeline_runs = $7,
      pipeline_successes = $8,
      pipeline_failures = $9,
      avg_duration_ms = $10,
      avg_review_time_ms = $11,
      reviews_on_time = $12,
      reviews_late = $13,
      alerts_triggered = $14,
      alerts_critical = $15,
      alerts_warning = $16,
      patterns_detected = $17,
      updated_at = NOW()
  `, [
    date,
    parseInt(reportCounts?.created || '0', 10),
    parseInt(reportCounts?.approved || '0', 10),
    parseInt(reportCounts?.rejected || '0', 10),
    parseInt(reportCounts?.fallback || '0', 10),
    parseInt(reportCounts?.timeout || '0', 10),
    parseInt(pipelineCounts?.runs || '0', 10),
    parseInt(pipelineCounts?.successes || '0', 10),
    parseInt(pipelineCounts?.failures || '0', 10),
    pipelineCounts?.avg_duration ? parseInt(pipelineCounts.avg_duration, 10) : null,
    reviewMetrics?.avg_review_time ? parseInt(reviewMetrics.avg_review_time, 10) : null,
    parseInt(reviewMetrics?.on_time || '0', 10),
    parseInt(reviewMetrics?.late || '0', 10),
    parseInt(alertCounts?.triggered || '0', 10),
    parseInt(alertCounts?.critical || '0', 10),
    parseInt(alertCounts?.warning || '0', 10),
    JSON.stringify(patterns.map(p => ({ type: p.type, severity: p.severity, title: p.title }))),
  ]);
}

/**
 * Executor function
 */
async function execute(
  params: Record<string, unknown>,
  context: { jobId: string; runId: string; attempt: number }
): Promise<ExecutorResult> {
  console.log(`[biz:daily-metrics] Starting daily metrics aggregation (attempt ${context.attempt})`);

  try {
    // Get the date to aggregate (default: yesterday)
    const date = (params.date as string) || getYesterday();

    // Aggregate metrics
    await aggregateMetricsForDate(date);

    console.log(`[biz:daily-metrics] Metrics aggregated for ${date}`);

    return {
      success: true,
      output: {
        date,
        message: `Daily metrics aggregated for ${date}`,
      },
    };
  } catch (error) {
    console.error('[biz:daily-metrics] Error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Register the executor
registerExecutor('biz:daily-metrics', execute);

console.log('[Scheduler] Registered executor: biz:daily-metrics');

export { execute as bizDailyMetricsExecutor };
