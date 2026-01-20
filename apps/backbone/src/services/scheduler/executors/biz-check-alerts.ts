/**
 * biz-check-alerts.ts
 * Executor for checking system health and creating alerts
 *
 * Target: biz:check-alerts
 *
 * Monitors system metrics and creates alerts for:
 * - Low approval rates
 * - High fallback/timeout rates
 * - Pipeline failures
 * - Pattern anomalies
 */

import { registerExecutor, type ExecutorResult } from '../executor.js';
import { db } from '../../../lib/db.js';
import { metricsRepository } from '../../../routes/biz/metrics.js';
import { bizPatterns, type DailyStats, type PatternResult } from '../../../lib/biz-patterns.js';
import { whatsappService } from '../../whatsapp/service.js';

// Environment configuration
const ALERT_PHONE = process.env.BIZ_ALERT_PHONE;
const WHATSAPP_OPERATION = process.env.BIZ_WHATSAPP_OPERATION || 'alerts';

/**
 * Get today's stats for pattern detection
 */
async function getTodayStats(): Promise<DailyStats> {
  return metricsRepository.getTodayStats();
}

/**
 * Check if similar alert already exists
 */
async function alertExists(type: string, hoursBack = 4): Promise<boolean> {
  const result = await db.queryOne<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM biz.alerts
     WHERE type = $1
       AND status IN ('active', 'acknowledged')
       AND created_at > NOW() - INTERVAL '${hoursBack} hours'`
  );

  return parseInt(result?.count || '0', 10) > 0;
}

/**
 * Create alert from pattern
 */
async function createAlertFromPattern(pattern: PatternResult): Promise<void> {
  // Check if similar alert already exists
  const exists = await alertExists(pattern.type);
  if (exists) {
    console.log(`[biz:check-alerts] Alert ${pattern.type} already exists, skipping`);
    return;
  }

  // Create the alert
  const alert = await metricsRepository.createAlert({
    type: pattern.type,
    severity: pattern.severity,
    title: pattern.title,
    message: pattern.description,
    source: 'biz:check-alerts',
    relatedData: {
      value: pattern.value,
      threshold: pattern.threshold,
      ...(pattern.metadata || {}),
    },
  });

  console.log(`[biz:check-alerts] Created alert: ${alert.type} (${alert.severity})`);

  // Update daily metrics
  const today = new Date().toISOString().split('T')[0];
  await db.execute(
    `INSERT INTO biz.daily_metrics (date, alerts_triggered, alerts_critical, alerts_warning)
     VALUES ($1, 1, $2, $3)
     ON CONFLICT (date) DO UPDATE
     SET alerts_triggered = COALESCE(biz.daily_metrics.alerts_triggered, 0) + 1,
         alerts_critical = COALESCE(biz.daily_metrics.alerts_critical, 0) + $2,
         alerts_warning = COALESCE(biz.daily_metrics.alerts_warning, 0) + $3,
         updated_at = NOW()`,
    [today, pattern.severity === 'critical' ? 1 : 0, pattern.severity === 'warning' ? 1 : 0]
  );
}

/**
 * Send critical alert notification via WhatsApp
 */
async function sendCriticalAlertNotification(patterns: PatternResult[]): Promise<boolean> {
  if (!ALERT_PHONE) {
    console.log('[biz:check-alerts] BIZ_ALERT_PHONE not configured, skipping notification');
    return false;
  }

  const criticalPatterns = patterns.filter((p) => p.severity === 'critical');
  if (criticalPatterns.length === 0) {
    return false;
  }

  // Build alert message
  const lines: string[] = [
    `*ALERTA CRITICO*`,
    ``,
    `${criticalPatterns.length} problema(s) critico(s) detectado(s):`,
    ``,
  ];

  for (const pattern of criticalPatterns) {
    lines.push(`*${pattern.title}*`);
    lines.push(`${pattern.description}`);
    lines.push(``);
  }

  lines.push(`Verifique o dashboard para mais detalhes.`);

  try {
    await whatsappService.sendMessage(
      WHATSAPP_OPERATION,
      ALERT_PHONE,
      lines.join('\n')
    );

    console.log('[biz:check-alerts] Critical alert notification sent');
    return true;
  } catch (error) {
    console.error('[biz:check-alerts] Failed to send notification:', error);
    return false;
  }
}

/**
 * Check for stuck pipeline runs
 */
async function checkStuckPipelines(): Promise<PatternResult[]> {
  const patterns: PatternResult[] = [];

  // Check for running pipelines that started more than 30 minutes ago
  const stuckPipelines = await db.query<{ id: string; pipeline_name: string; started_at: string }>(
    `SELECT id, pipeline_name, started_at
     FROM biz.pipeline_runs
     WHERE status = 'running'
       AND started_at < NOW() - INTERVAL '30 minutes'`
  );

  if (stuckPipelines.length > 0) {
    patterns.push({
      type: 'stuck_pipeline',
      severity: 'critical',
      title: 'Pipeline travado detectado',
      description: `${stuckPipelines.length} pipeline(s) em execucao ha mais de 30 minutos`,
      value: stuckPipelines.length,
      threshold: 0,
      metadata: {
        pipelineIds: stuckPipelines.map((p) => p.id),
      },
    });

    // Force fail stuck pipelines
    for (const pipeline of stuckPipelines) {
      await metricsRepository.updatePipelineRun(pipeline.id, {
        status: 'failed',
        errorMessage: 'Pipeline travado - forçado como falha',
      });
    }
  }

  return patterns;
}

/**
 * Check for overdue reviews
 */
async function checkOverdueReviews(): Promise<PatternResult[]> {
  const patterns: PatternResult[] = [];

  const result = await db.queryOne<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM biz.reports
     WHERE status = 'pending'
       AND review_deadline < NOW()`
  );

  const overdueCount = parseInt(result?.count || '0', 10);

  if (overdueCount > 10) {
    patterns.push({
      type: 'many_overdue_reviews',
      severity: overdueCount > 20 ? 'critical' : 'warning',
      title: 'Muitas revisoes atrasadas',
      description: `${overdueCount} relatorios com prazo vencido aguardando revisao`,
      value: overdueCount,
      threshold: 10,
    });
  }

  return patterns;
}

/**
 * Executor function
 */
async function execute(
  params: Record<string, unknown>,
  context: { jobId: string; runId: string; attempt: number }
): Promise<ExecutorResult> {
  console.log(`[biz:check-alerts] Starting alert check (attempt ${context.attempt})`);

  try {
    const allPatterns: PatternResult[] = [];

    // 1. Get today's stats and detect patterns
    const stats = await getTodayStats();

    if (stats.total > 0) {
      const todayPatterns = bizPatterns.detectPatterns(stats);
      allPatterns.push(...todayPatterns);
    }

    // 2. Get historical data and analyze trends
    const history = await metricsRepository.getHistoryForAnalysis(14);

    if (history.length >= 3) {
      const historyPatterns = bizPatterns.analyzeHistory(history);
      allPatterns.push(...historyPatterns);
    }

    // 3. Check for stuck pipelines
    const stuckPatterns = await checkStuckPipelines();
    allPatterns.push(...stuckPatterns);

    // 4. Check for overdue reviews
    const overduePatterns = await checkOverdueReviews();
    allPatterns.push(...overduePatterns);

    // 5. Create alerts for detected patterns
    for (const pattern of allPatterns) {
      await createAlertFromPattern(pattern);
    }

    // 6. Send notification for critical alerts
    const notificationSent = await sendCriticalAlertNotification(allPatterns);

    // 7. Auto-resolve old alerts that no longer apply
    await autoResolveAlerts();

    console.log(`[biz:check-alerts] Check completed: ${allPatterns.length} patterns detected`);

    return {
      success: true,
      output: {
        patternsDetected: allPatterns.length,
        patterns: allPatterns.map((p) => ({ type: p.type, severity: p.severity })),
        criticalCount: allPatterns.filter((p) => p.severity === 'critical').length,
        warningCount: allPatterns.filter((p) => p.severity === 'warning').length,
        notificationSent,
        stats: {
          approved: stats.approved,
          rejected: stats.rejected,
          fallback: stats.fallback,
          timeout: stats.timeout,
          total: stats.total,
        },
      },
    };
  } catch (error) {
    console.error('[biz:check-alerts] Error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Auto-resolve alerts that are no longer applicable
 */
async function autoResolveAlerts(): Promise<void> {
  // Get current stats
  const stats = await getTodayStats();
  const patterns = stats.total > 0 ? bizPatterns.detectPatterns(stats) : [];
  const activePatternTypes = new Set(patterns.map((p) => p.type));

  // Get active alerts
  const activeAlerts = await metricsRepository.getActiveAlerts();

  // Resolve alerts whose patterns are no longer detected
  const alertTypesToAutoResolve = [
    'low_approval_rate',
    'high_fallback_rate',
    'high_timeout_rate',
    'many_overdue_reviews',
  ];

  for (const alert of activeAlerts) {
    // Only auto-resolve certain alert types
    if (!alertTypesToAutoResolve.includes(alert.type)) continue;

    // If pattern is no longer detected, resolve the alert
    if (!activePatternTypes.has(alert.type)) {
      await metricsRepository.resolveAlert(alert.id, null, 'Auto-resolvido - metricas normalizadas');
      console.log(`[biz:check-alerts] Auto-resolved alert: ${alert.type}`);
    }
  }
}

// Register the executor
registerExecutor('biz:check-alerts', execute);

console.log('[Scheduler] Registered executor: biz:check-alerts');

export { execute as bizCheckAlertsExecutor };
