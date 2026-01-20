import cronParser from 'cron-parser';
import { repository } from './repository.js';
import {
  getQueue,
  addRepeatableJob,
  removeRepeatableJob,
  addImmediateJob,
  getRepeatableJobs,
} from './queue.js';
import type {
  ScheduledJob,
  ScheduledJobInput,
  ScheduledJobUpdate,
  JobRun,
  JobListOptions,
  JobRunListOptions,
  SchedulerJobData,
  TriggerType,
} from './types.js';

// ============ Job Management ============

/**
 * Create a new scheduled job
 */
export async function createJob(
  data: ScheduledJobInput,
  createdBy?: string
): Promise<ScheduledJob> {
  // Create in database
  const job = await repository.createJob(data, createdBy);

  // Calculate next run time
  const nextRun = calculateNextRun(job);

  // Update next run time
  await repository.updateJobNextRun(job.id, nextRun);

  // If enabled, add to BullMQ
  if (job.enabled) {
    await syncJobToQueue(job);
  }

  console.log(`[Scheduler] Created job: ${job.slug}`);

  return { ...job, nextRunAt: nextRun?.toISOString() ?? null };
}

/**
 * Get a job by ID
 */
export async function getJob(id: string): Promise<ScheduledJob | null> {
  return repository.findJobById(id);
}

/**
 * Get a job by slug
 */
export async function getJobBySlug(slug: string): Promise<ScheduledJob | null> {
  return repository.findJobBySlug(slug);
}

/**
 * List all jobs
 */
export async function listJobs(options?: JobListOptions): Promise<ScheduledJob[]> {
  return repository.findJobs(options);
}

/**
 * Update a scheduled job
 */
export async function updateJob(
  id: string,
  data: ScheduledJobUpdate
): Promise<ScheduledJob | null> {
  const existingJob = await repository.findJobById(id);
  if (!existingJob) {
    return null;
  }

  // Remove from queue if schedule is changing
  const scheduleChanged =
    data.cronExpression !== undefined || data.repeatEveryMs !== undefined || data.timezone !== undefined;

  if (scheduleChanged && existingJob.enabled) {
    await removeRepeatableJob(existingJob.slug, {
      cronExpression: existingJob.cronExpression,
      repeatEveryMs: existingJob.repeatEveryMs,
      timezone: existingJob.timezone,
    });
  }

  // Update in database
  const updatedJob = await repository.updateJob(id, data);
  if (!updatedJob) {
    return null;
  }

  // Recalculate next run if schedule changed
  if (scheduleChanged) {
    const nextRun = calculateNextRun(updatedJob);
    await repository.updateJobNextRun(id, nextRun);
  }

  // Re-sync to queue
  if (updatedJob.enabled) {
    await syncJobToQueue(updatedJob);
  }

  console.log(`[Scheduler] Updated job: ${updatedJob.slug}`);

  return updatedJob;
}

/**
 * Delete a scheduled job
 */
export async function deleteJob(id: string): Promise<boolean> {
  const job = await repository.findJobById(id);
  if (!job) {
    return false;
  }

  // Remove from queue
  if (job.enabled) {
    await removeRepeatableJob(job.slug, {
      cronExpression: job.cronExpression,
      repeatEveryMs: job.repeatEveryMs,
      timezone: job.timezone,
    });
  }

  // Delete from database (cascades to job_runs)
  const deleted = await repository.deleteJob(id);

  if (deleted) {
    console.log(`[Scheduler] Deleted job: ${job.slug}`);
  }

  return deleted;
}

/**
 * Pause a scheduled job
 */
export async function pauseJob(id: string): Promise<ScheduledJob | null> {
  const job = await repository.findJobById(id);
  if (!job) {
    return null;
  }

  // Remove from queue
  if (job.enabled) {
    await removeRepeatableJob(job.slug, {
      cronExpression: job.cronExpression,
      repeatEveryMs: job.repeatEveryMs,
      timezone: job.timezone,
    });
  }

  // Update database
  const updated = await repository.setJobEnabled(id, false);

  if (updated) {
    console.log(`[Scheduler] Paused job: ${job.slug}`);
  }

  return updated;
}

/**
 * Resume a scheduled job
 */
export async function resumeJob(id: string): Promise<ScheduledJob | null> {
  const job = await repository.findJobById(id);
  if (!job) {
    return null;
  }

  // Update database
  const updated = await repository.setJobEnabled(id, true);
  if (!updated) {
    return null;
  }

  // Calculate next run
  const nextRun = calculateNextRun(updated);
  await repository.updateJobNextRun(id, nextRun);

  // Add to queue
  await syncJobToQueue(updated);

  console.log(`[Scheduler] Resumed job: ${job.slug}`);

  return updated;
}

/**
 * Run a job immediately (manual trigger)
 */
export async function runJobNow(
  id: string,
  triggeredBy?: string
): Promise<JobRun> {
  const job = await repository.findJobById(id);
  if (!job) {
    throw new Error('Job not found');
  }

  // Create a run record
  const run = await repository.createRun(job.id, 'manual', triggeredBy);

  // Build job data
  const jobData: SchedulerJobData = {
    jobId: job.id,
    slug: job.slug,
    target: job.jobTarget,
    params: job.jobParams,
    runId: run.id,
    triggerType: 'manual',
    triggeredBy,
  };

  // Add to queue for immediate execution
  const bullmqJobId = await addImmediateJob(job.slug, jobData);

  // Update run with BullMQ job ID
  await repository.updateRunStart(run.id, bullmqJobId);

  console.log(`[Scheduler] Manual run triggered: ${job.slug} (run: ${run.id})`);

  return run;
}

// ============ Job Runs ============

/**
 * Get job runs (execution history)
 */
export async function getJobRuns(options?: JobRunListOptions): Promise<JobRun[]> {
  return repository.findRuns(options);
}

/**
 * Get a specific run by ID
 */
export async function getRun(id: string): Promise<JobRun | null> {
  return repository.findRunById(id);
}

/**
 * Clean up old runs for a job
 */
export async function cleanupRuns(jobId: string, keepCount = 100): Promise<number> {
  return repository.deleteOldRuns(jobId, keepCount);
}

// ============ Sync & Initialization ============

/**
 * Sync a job to the BullMQ queue
 */
async function syncJobToQueue(job: ScheduledJob): Promise<void> {
  // First remove any existing repeatable job
  await removeRepeatableJob(job.slug, {
    cronExpression: job.cronExpression,
    repeatEveryMs: job.repeatEveryMs,
    timezone: job.timezone,
  }).catch(() => {});

  // Create a placeholder run for the next scheduled execution
  // Note: This is created when the job actually runs, not here
  const jobData: SchedulerJobData = {
    jobId: job.id,
    slug: job.slug,
    target: job.jobTarget,
    params: job.jobParams,
    runId: '', // Will be set when job runs
    triggerType: 'scheduled',
  };

  await addRepeatableJob(job.slug, {
    cronExpression: job.cronExpression,
    repeatEveryMs: job.repeatEveryMs,
    timezone: job.timezone,
  }, jobData);
}

/**
 * Sync all enabled jobs to BullMQ on startup
 */
export async function syncAllJobs(): Promise<void> {
  const jobs = await repository.findEnabledJobs();
  console.log(`[Scheduler] Syncing ${jobs.length} jobs to queue...`);

  for (const job of jobs) {
    try {
      // Calculate and update next run
      const nextRun = calculateNextRun(job);
      await repository.updateJobNextRun(job.id, nextRun);

      // Sync to queue
      await syncJobToQueue(job);
    } catch (error) {
      console.error(`[Scheduler] Failed to sync job ${job.slug}:`, error);
    }
  }

  console.log('[Scheduler] Jobs synced');
}

/**
 * Calculate the next run time for a job
 */
function calculateNextRun(job: ScheduledJob): Date | null {
  if (job.repeatEveryMs) {
    // For interval-based jobs, next run is now + interval
    return new Date(Date.now() + job.repeatEveryMs);
  }

  if (job.cronExpression) {
    try {
      const interval = cronParser.parseExpression(job.cronExpression, {
        tz: job.timezone,
        currentDate: new Date(),
      });
      return interval.next().toDate();
    } catch {
      console.error(`[Scheduler] Invalid cron expression: ${job.cronExpression}`);
      return null;
    }
  }

  return null;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  repeatableJobs: number;
}> {
  const queue = getQueue();
  const [waiting, active, completed, failed, delayed, repeatableJobs] =
    await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      getRepeatableJobs().then((jobs) => jobs.length),
    ]);

  return { waiting, active, completed, failed, delayed, repeatableJobs };
}
