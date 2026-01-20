import { Worker, Job } from 'bullmq';
import { redisBullMQ } from '../../lib/index.js';
import { SCHEDULER_QUEUE_NAME } from './queue.js';
import { repository } from './repository.js';
import { executeTarget } from './executor.js';
import type { SchedulerJobData, JobRunStatus } from './types.js';

let schedulerWorker: Worker<SchedulerJobData> | null = null;

export function startWorker(): Worker<SchedulerJobData> {
  if (schedulerWorker) {
    return schedulerWorker;
  }

  schedulerWorker = new Worker<SchedulerJobData>(
    SCHEDULER_QUEUE_NAME,
    async (job: Job<SchedulerJobData>) => {
      const { jobId, slug, target, params, runId, triggerType, triggeredBy } = job.data;
      const startTime = Date.now();

      console.log(`[Scheduler] Starting job: ${slug} (run: ${runId})`);

      // Update run with BullMQ job ID
      await repository.updateRunStart(runId, job.id ?? '');

      try {
        // Execute the target
        const result = await executeTarget(target, params, {
          jobId,
          runId,
          attempt: job.attemptsMade + 1,
        });

        const durationMs = Date.now() - startTime;
        const status: JobRunStatus = result.success ? 'completed' : 'failed';

        // Update run record
        await repository.updateRunComplete(
          runId,
          status,
          durationMs,
          result.output,
          result.error,
          job.attemptsMade + 1
        );

        // Update job stats
        await repository.updateJobLastRun(jobId, runId, status, durationMs, result.error);

        if (result.success) {
          console.log(`[Scheduler] Job completed: ${slug} (${durationMs}ms)`);
          return result.output;
        } else {
          console.error(`[Scheduler] Job failed: ${slug} - ${result.error}`);
          throw new Error(result.error);
        }
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Update run record
        await repository.updateRunComplete(
          runId,
          'failed',
          durationMs,
          undefined,
          errorMessage,
          job.attemptsMade + 1
        );

        // Update job stats
        await repository.updateJobLastRun(jobId, runId, 'failed', durationMs, errorMessage);

        console.error(`[Scheduler] Job error: ${slug} - ${errorMessage}`);
        throw error;
      }
    },
    {
      connection: redisBullMQ,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  // Event handlers
  schedulerWorker.on('completed', (job) => {
    console.log(`[Scheduler] Worker: Job ${job.data.slug} completed`);
  });

  schedulerWorker.on('failed', (job, err) => {
    if (job) {
      console.error(`[Scheduler] Worker: Job ${job.data.slug} failed:`, err.message);
    }
  });

  schedulerWorker.on('error', (err) => {
    console.error('[Scheduler] Worker error:', err);
  });

  schedulerWorker.on('stalled', (jobId) => {
    console.warn(`[Scheduler] Worker: Job ${jobId} stalled`);
  });

  console.log('[Scheduler] Worker started');

  return schedulerWorker;
}

export async function stopWorker(): Promise<void> {
  if (schedulerWorker) {
    await schedulerWorker.close();
    schedulerWorker = null;
    console.log('[Scheduler] Worker stopped');
  }
}

export function getWorker(): Worker<SchedulerJobData> | null {
  return schedulerWorker;
}
