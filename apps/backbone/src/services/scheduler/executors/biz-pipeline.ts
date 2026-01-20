/**
 * biz-pipeline.ts
 * Main pipeline executor for business operations
 *
 * Target: biz:pipeline
 *
 * Orchestrates the main business pipeline:
 * 1. Sync - Fetch new data from external sources
 * 2. Process - Analyze and categorize data
 * 3. Notify - Send notifications for pending reviews
 * 4. Send - Dispatch approved items
 */

import { registerExecutor, type ExecutorResult } from '../executor.js';
import { db } from '../../../lib/db.js';
import { metricsRepository } from '../../../routes/biz/metrics.js';

// Environment configuration
const PIPELINE_TIMEOUT_MS = parseInt(process.env.BIZ_PIPELINE_TIMEOUT_MS || '300000', 10);

// Pipeline stages
type PipelineStage = 'sync' | 'process' | 'notify' | 'send';

interface PipelineContext {
  runId: string;
  pipelineRunId: string;
  startedAt: Date;
  currentStage: PipelineStage | null;
  stagesCompleted: PipelineStage[];
  stagesFailed: PipelineStage[];
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  itemsSkipped: number;
  errors: Array<{ stage: string; error: string }>;
}

/**
 * Create a new pipeline context
 */
function createContext(runId: string, pipelineRunId: string): PipelineContext {
  return {
    runId,
    pipelineRunId,
    startedAt: new Date(),
    currentStage: null,
    stagesCompleted: [],
    stagesFailed: [],
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    itemsSkipped: 0,
    errors: [],
  };
}

/**
 * Update pipeline run in database
 */
async function updatePipelineRun(ctx: PipelineContext): Promise<void> {
  await metricsRepository.updatePipelineRun(ctx.pipelineRunId, {
    currentStage: ctx.currentStage || undefined,
    stagesCompleted: ctx.stagesCompleted,
    stagesFailed: ctx.stagesFailed,
    itemsProcessed: ctx.itemsProcessed,
    itemsSucceeded: ctx.itemsSucceeded,
    itemsFailed: ctx.itemsFailed,
    itemsSkipped: ctx.itemsSkipped,
  });
}

// ============ Stage: Sync ============

interface SyncResult {
  fetched: number;
  created: number;
  skipped: number;
  errors: number;
}

/**
 * Sync stage - fetch new data from external sources
 *
 * This is a placeholder that can be customized for specific data sources.
 * For now, it simulates checking for new data.
 */
async function stageSync(_ctx: PipelineContext): Promise<SyncResult> {
  console.log('[biz:pipeline] Stage: sync - Checking for new data');

  // Placeholder implementation
  // In a real scenario, this would:
  // 1. Connect to external APIs/databases
  // 2. Fetch new records since last sync
  // 3. Create reports for each item

  // For now, just check if there are any pending items to process
  const result = await db.queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM biz.reports WHERE status = 'pending'`
  );

  const pendingCount = parseInt(result?.count || '0', 10);

  return {
    fetched: 0,
    created: 0,
    skipped: 0,
    errors: 0,
  };
}

// ============ Stage: Process ============

interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
}

/**
 * Process stage - analyze and categorize pending reports
 *
 * This is a placeholder that can be customized for specific processing logic.
 */
async function stageProcess(ctx: PipelineContext): Promise<ProcessResult> {
  console.log('[biz:pipeline] Stage: process - Analyzing pending reports');

  // Get reports in 'processing' status or newly created
  const reports = await db.query<{ id: string; title: string; content: string | null }>(
    `SELECT id, title, content
     FROM biz.reports
     WHERE status = 'pending'
       AND ai_analysis IS NULL
     ORDER BY priority DESC, created_at ASC
     LIMIT 50`
  );

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const report of reports) {
    try {
      // Placeholder AI analysis
      // In a real scenario, this would call an LLM for analysis
      const analysis = {
        processedAt: new Date().toISOString(),
        contentLength: report.content?.length || 0,
        autoAnalysis: true,
      };

      // Placeholder confidence score
      const confidence = Math.random() * 40 + 60; // 60-100%

      // Update report with analysis
      await db.execute(
        `UPDATE biz.reports
         SET ai_analysis = $2,
             ai_confidence = $3,
             ai_suggestion = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [
          report.id,
          JSON.stringify(analysis),
          confidence,
          confidence > 80 ? 'approve' : 'review',
        ]
      );

      succeeded++;
    } catch (error) {
      console.error(`[biz:pipeline] Failed to process report ${report.id}:`, error);
      failed++;
    }

    processed++;
  }

  return { processed, succeeded, failed };
}

// ============ Stage: Notify ============

interface NotifyResult {
  notified: number;
  errors: number;
}

/**
 * Notify stage - send notifications for pending reviews
 */
async function stageNotify(_ctx: PipelineContext): Promise<NotifyResult> {
  console.log('[biz:pipeline] Stage: notify - Sending review notifications');

  // Count items needing notification
  const result = await db.queryOne<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM biz.reports
     WHERE status = 'pending'
       AND notification_sent_at IS NULL`
  );

  const pendingNotifications = parseInt(result?.count || '0', 10);

  // The actual notification sending is handled by the biz:notify-review executor
  // This stage just tracks that notifications need to be sent

  return {
    notified: pendingNotifications,
    errors: 0,
  };
}

// ============ Stage: Send ============

interface SendResult {
  sent: number;
  failed: number;
  skipped: number;
}

/**
 * Send stage - dispatch approved items
 *
 * This is a placeholder that can be customized for specific delivery logic.
 */
async function stageSend(_ctx: PipelineContext): Promise<SendResult> {
  console.log('[biz:pipeline] Stage: send - Dispatching approved items');

  // Get approved items that need to be sent
  const approved = await db.query<{ id: string }>(
    `SELECT id
     FROM biz.reports
     WHERE status = 'approved'
       AND (metadata->>'sent_at') IS NULL
     ORDER BY reviewed_at ASC
     LIMIT 50`
  );

  let sent = 0;
  let failed = 0;

  for (const item of approved) {
    try {
      // Placeholder sending logic
      // In a real scenario, this would send the item to its destination

      // Mark as sent
      await db.execute(
        `UPDATE biz.reports
         SET metadata = metadata || jsonb_build_object('sent_at', NOW()::text),
             updated_at = NOW()
         WHERE id = $1`,
        [item.id]
      );

      sent++;
    } catch (error) {
      console.error(`[biz:pipeline] Failed to send report ${item.id}:`, error);
      failed++;
    }
  }

  return {
    sent,
    failed,
    skipped: 0,
  };
}

// ============ Main Executor ============

/**
 * Executor function
 */
async function execute(
  params: Record<string, unknown>,
  context: { jobId: string; runId: string; attempt: number }
): Promise<ExecutorResult> {
  console.log(`[biz:pipeline] Starting pipeline (attempt ${context.attempt})`);

  // Get trigger type from params or default to scheduled
  const triggerType = (params.triggerType as string) || 'scheduled';

  // Create pipeline run record
  const pipelineRun = await metricsRepository.startPipelineRun(
    'biz-main',
    triggerType,
    params.triggeredBy as string | undefined,
    params
  );

  const ctx = createContext(context.runId, pipelineRun.id);

  // Timeout handling
  const timeout = setTimeout(async () => {
    console.error('[biz:pipeline] Pipeline timeout reached');
    await metricsRepository.updatePipelineRun(ctx.pipelineRunId, {
      status: 'failed',
      errorMessage: 'Pipeline timeout',
    });
  }, PIPELINE_TIMEOUT_MS);

  try {
    // Stage 1: Sync
    ctx.currentStage = 'sync';
    await updatePipelineRun(ctx);

    try {
      const syncResult = await stageSync(ctx);
      ctx.itemsProcessed += syncResult.fetched;
      ctx.itemsSucceeded += syncResult.created;
      ctx.itemsSkipped += syncResult.skipped;
      ctx.itemsFailed += syncResult.errors;
      ctx.stagesCompleted.push('sync');
    } catch (error) {
      ctx.stagesFailed.push('sync');
      ctx.errors.push({ stage: 'sync', error: error instanceof Error ? error.message : 'Unknown' });
      console.error('[biz:pipeline] Sync stage failed:', error);
    }

    // Stage 2: Process
    ctx.currentStage = 'process';
    await updatePipelineRun(ctx);

    try {
      const processResult = await stageProcess(ctx);
      ctx.itemsProcessed += processResult.processed;
      ctx.itemsSucceeded += processResult.succeeded;
      ctx.itemsFailed += processResult.failed;
      ctx.stagesCompleted.push('process');
    } catch (error) {
      ctx.stagesFailed.push('process');
      ctx.errors.push({ stage: 'process', error: error instanceof Error ? error.message : 'Unknown' });
      console.error('[biz:pipeline] Process stage failed:', error);
    }

    // Stage 3: Notify
    ctx.currentStage = 'notify';
    await updatePipelineRun(ctx);

    try {
      const notifyResult = await stageNotify(ctx);
      ctx.itemsProcessed += notifyResult.notified;
      ctx.stagesCompleted.push('notify');
    } catch (error) {
      ctx.stagesFailed.push('notify');
      ctx.errors.push({ stage: 'notify', error: error instanceof Error ? error.message : 'Unknown' });
      console.error('[biz:pipeline] Notify stage failed:', error);
    }

    // Stage 4: Send
    ctx.currentStage = 'send';
    await updatePipelineRun(ctx);

    try {
      const sendResult = await stageSend(ctx);
      ctx.itemsSucceeded += sendResult.sent;
      ctx.itemsFailed += sendResult.failed;
      ctx.itemsSkipped += sendResult.skipped;
      ctx.stagesCompleted.push('send');
    } catch (error) {
      ctx.stagesFailed.push('send');
      ctx.errors.push({ stage: 'send', error: error instanceof Error ? error.message : 'Unknown' });
      console.error('[biz:pipeline] Send stage failed:', error);
    }

    // Determine final status
    const hasFailures = ctx.stagesFailed.length > 0;
    const status = hasFailures ? 'failed' : 'completed';

    // Update final pipeline run status
    await metricsRepository.updatePipelineRun(ctx.pipelineRunId, {
      status,
      currentStage: undefined,
      stagesCompleted: ctx.stagesCompleted,
      stagesFailed: ctx.stagesFailed,
      itemsProcessed: ctx.itemsProcessed,
      itemsSucceeded: ctx.itemsSucceeded,
      itemsFailed: ctx.itemsFailed,
      itemsSkipped: ctx.itemsSkipped,
      errorMessage: hasFailures ? `Stages failed: ${ctx.stagesFailed.join(', ')}` : undefined,
      errorDetails: hasFailures ? { errors: ctx.errors } : undefined,
      output: {
        duration: Date.now() - ctx.startedAt.getTime(),
        stagesCompleted: ctx.stagesCompleted,
      },
    });

    // Update daily metrics
    const today = new Date().toISOString().split('T')[0];
    await db.execute(
      `INSERT INTO biz.daily_metrics (date, pipeline_runs, pipeline_successes, pipeline_failures)
       VALUES ($1, 1, $2, $3)
       ON CONFLICT (date) DO UPDATE
       SET pipeline_runs = COALESCE(biz.daily_metrics.pipeline_runs, 0) + 1,
           pipeline_successes = COALESCE(biz.daily_metrics.pipeline_successes, 0) + $2,
           pipeline_failures = COALESCE(biz.daily_metrics.pipeline_failures, 0) + $3,
           updated_at = NOW()`,
      [today, hasFailures ? 0 : 1, hasFailures ? 1 : 0]
    );

    clearTimeout(timeout);

    console.log(`[biz:pipeline] Pipeline completed (${status})`);

    return {
      success: !hasFailures,
      output: {
        pipelineRunId: ctx.pipelineRunId,
        status,
        stagesCompleted: ctx.stagesCompleted,
        stagesFailed: ctx.stagesFailed,
        itemsProcessed: ctx.itemsProcessed,
        itemsSucceeded: ctx.itemsSucceeded,
        itemsFailed: ctx.itemsFailed,
        itemsSkipped: ctx.itemsSkipped,
        durationMs: Date.now() - ctx.startedAt.getTime(),
        errors: ctx.errors.length > 0 ? ctx.errors : undefined,
      },
      error: hasFailures ? `Stages failed: ${ctx.stagesFailed.join(', ')}` : undefined,
    };
  } catch (error) {
    clearTimeout(timeout);

    // Update pipeline run with error
    await metricsRepository.updatePipelineRun(ctx.pipelineRunId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    console.error('[biz:pipeline] Pipeline error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Register the executor
registerExecutor('biz:pipeline', execute);

console.log('[Scheduler] Registered executor: biz:pipeline');

export { execute as bizPipelineExecutor };
