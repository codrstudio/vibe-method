import { Queue } from 'bullmq';
import { redisBullMQ } from '../../lib/index.js';
import type { SchedulerJobData } from './types.js';

export const SCHEDULER_QUEUE_NAME = 'scheduler';

let schedulerQueue: Queue<SchedulerJobData> | null = null;

export function getQueue(): Queue<SchedulerJobData> {
  if (!schedulerQueue) {
    schedulerQueue = new Queue<SchedulerJobData>(SCHEDULER_QUEUE_NAME, {
      connection: redisBullMQ,
      defaultJobOptions: {
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 500, // Keep max 500 failed jobs
        },
      },
    });
  }

  return schedulerQueue;
}

export async function addRepeatableJob(
  slug: string,
  options: { cronExpression?: string | null; repeatEveryMs?: number | null; timezone?: string },
  data: SchedulerJobData
): Promise<void> {
  const queue = getQueue();

  if (options.repeatEveryMs) {
    // Interval-based scheduling (supports sub-minute)
    await queue.add(slug, data, {
      repeat: {
        every: options.repeatEveryMs,
      },
      jobId: `repeat:${slug}`,
    });
  } else if (options.cronExpression) {
    // Cron-based scheduling
    await queue.add(slug, data, {
      repeat: {
        pattern: options.cronExpression,
        tz: options.timezone,
      },
      jobId: `repeat:${slug}`,
    });
  }
}

export async function removeRepeatableJob(
  slug: string,
  options: { cronExpression?: string | null; repeatEveryMs?: number | null; timezone?: string }
): Promise<boolean> {
  const queue = getQueue();

  // Try to remove by different key formats
  const keys = [];
  if (options.repeatEveryMs) {
    keys.push(`${slug}::${options.repeatEveryMs}`);
  }
  if (options.cronExpression && options.timezone) {
    keys.push(`${slug}:${options.cronExpression}:${options.timezone}`);
  }

  for (const key of keys) {
    try {
      const removed = await queue.removeRepeatableByKey(key);
      if (removed) return true;
    } catch {
      // Key format might not match, try next
    }
  }

  // Fallback: remove all repeatable jobs with this name
  const repeatableJobs = await queue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === slug) {
      await queue.removeRepeatableByKey(job.key);
      return true;
    }
  }

  return false;
}

export async function addImmediateJob(
  slug: string,
  data: SchedulerJobData
): Promise<string> {
  const queue = getQueue();

  const job = await queue.add(slug, data, {
    jobId: `manual:${slug}:${Date.now()}`,
  });

  return job.id ?? '';
}

export async function getRepeatableJobs(): Promise<
  Array<{
    key: string;
    name: string;
    id: string | null;
    endDate: number | null;
    tz: string | null;
    pattern: string | null;
    next: number;
  }>
> {
  const queue = getQueue();
  return queue.getRepeatableJobs();
}

export async function obliterateQueue(): Promise<void> {
  const queue = getQueue();
  await queue.obliterate({ force: true });
}

export async function closeQueue(): Promise<void> {
  if (schedulerQueue) {
    await schedulerQueue.close();
    schedulerQueue = null;
  }
}
