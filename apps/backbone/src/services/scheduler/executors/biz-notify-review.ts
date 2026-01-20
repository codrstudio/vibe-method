/**
 * biz-notify-review.ts
 * Executor for sending review notifications via WhatsApp
 *
 * Target: biz:notify-review
 *
 * Sends WhatsApp notifications to reviewers when new reports are pending.
 * Uses the WhatsApp service to send messages via the configured operation.
 */

import { registerExecutor, type ExecutorResult } from '../executor.js';
import { db } from '../../../lib/db.js';
import { whatsappService } from '../../whatsapp/service.js';

// Environment configuration
const REVIEW_PHONE = process.env.BIZ_REVIEW_PHONE;
const WHATSAPP_OPERATION = process.env.BIZ_WHATSAPP_OPERATION || 'alerts';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:8000';

interface PendingReport {
  id: string;
  title: string;
  source: string;
  priority: number;
  ai_confidence: number | null;
  created_at: string;
  review_deadline: string | null;
}

/**
 * Get reports pending notification
 */
async function getPendingNotifications(): Promise<PendingReport[]> {
  return db.query<PendingReport>(
    `SELECT id, title, source, priority, ai_confidence, created_at, review_deadline
     FROM biz.reports
     WHERE status = 'pending'
       AND notification_sent_at IS NULL
     ORDER BY priority DESC, created_at ASC
     LIMIT 10`
  );
}

/**
 * Mark reports as notified
 */
async function markNotified(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  await db.execute(
    `UPDATE biz.reports
     SET notification_sent_at = NOW(),
         notification_count = notification_count + 1,
         updated_at = NOW()
     WHERE id = ANY($1::uuid[])`,
    [ids]
  );
}

/**
 * Build notification message
 */
function buildMessage(reports: PendingReport[]): string {
  const lines: string[] = [
    `*REVISAO PENDENTE*`,
    ``,
    `${reports.length} relatorio(s) aguardando revisao:`,
    ``,
  ];

  for (const report of reports.slice(0, 5)) {
    const priorityIcon = report.priority >= 5 ? '!!!' : report.priority >= 3 ? '!!' : '';
    const confidence = report.ai_confidence !== null
      ? ` (${report.ai_confidence.toFixed(0)}% conf)`
      : '';

    lines.push(`${priorityIcon} *${report.title}*${confidence}`);
    lines.push(`   Fonte: ${report.source}`);

    if (report.review_deadline) {
      const deadline = new Date(report.review_deadline);
      const now = new Date();
      const isOverdue = deadline < now;
      const deadlineText = isOverdue
        ? `VENCIDO ${formatTimeDiff(deadline)}`
        : `Prazo: ${formatTimeDiff(deadline)}`;
      lines.push(`   ${deadlineText}`);
    }

    lines.push(``);
  }

  if (reports.length > 5) {
    lines.push(`... e mais ${reports.length - 5} relatorio(s)`);
    lines.push(``);
  }

  lines.push(`Acesse: ${DASHBOARD_URL}/app/revisao`);

  return lines.join('\n');
}

/**
 * Format time difference for display
 */
function formatTimeDiff(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.abs(Math.round(diffMs / 60000));

  if (diffMins < 60) {
    return `${diffMins}min`;
  }

  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
}

/**
 * Executor function
 */
async function execute(
  params: Record<string, unknown>,
  context: { jobId: string; runId: string; attempt: number }
): Promise<ExecutorResult> {
  console.log(`[biz:notify-review] Starting notification job (attempt ${context.attempt})`);

  // Check if WhatsApp is configured
  if (!REVIEW_PHONE) {
    console.log('[biz:notify-review] BIZ_REVIEW_PHONE not configured, skipping');
    return {
      success: true,
      output: { skipped: true, reason: 'No review phone configured' },
    };
  }

  try {
    // Get pending reports that need notification
    const reports = await getPendingNotifications();

    if (reports.length === 0) {
      console.log('[biz:notify-review] No pending reports to notify');
      return {
        success: true,
        output: { notified: 0, message: 'No pending reports' },
      };
    }

    // Build and send message
    const message = buildMessage(reports);

    try {
      await whatsappService.sendMessage(
        WHATSAPP_OPERATION,
        REVIEW_PHONE,
        message
      );

      // Mark reports as notified
      await markNotified(reports.map((r) => r.id));

      console.log(`[biz:notify-review] Notified ${reports.length} reports`);

      return {
        success: true,
        output: {
          notified: reports.length,
          reportIds: reports.map((r) => r.id),
        },
      };
    } catch (whatsappError) {
      // WhatsApp send failed, but don't fail the job
      console.error('[biz:notify-review] WhatsApp send failed:', whatsappError);

      return {
        success: true,
        output: {
          notified: 0,
          whatsappError: whatsappError instanceof Error ? whatsappError.message : 'Unknown error',
          pendingCount: reports.length,
        },
      };
    }
  } catch (error) {
    console.error('[biz:notify-review] Error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Register the executor
registerExecutor('biz:notify-review', execute);

console.log('[Scheduler] Registered executor: biz:notify-review');

export { execute as bizNotifyReviewExecutor };
