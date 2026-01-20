import { incCounter, setGauge, observeHistogram, startTimer } from '../../pulse/index.js';
import { repository } from './repository.js';
import { getQueue } from './queue.js';
import { getWorker } from './worker.js';

// ============ Counters ============

export function incJobRun(status: 'success' | 'failed' | 'timeout', triggerType: string, jobSlug?: string) {
  incCounter('scheduler.runs.total', 1, { status, trigger: triggerType });
  if (jobSlug) {
    incCounter(`scheduler.runs.by_job`, 1, { slug: jobSlug, status });
  }
}

export function incJobCreated() {
  incCounter('scheduler.jobs.created', 1);
}

export function incJobDeleted() {
  incCounter('scheduler.jobs.deleted', 1);
}

// ============ Histograms ============

export function observeRunDuration(durationMs: number, jobSlug: string) {
  observeHistogram('scheduler.runs.duration_ms', durationMs, { slug: jobSlug });
}

export function observeQueueLatency(latencyMs: number) {
  observeHistogram('scheduler.queue.latency_ms', latencyMs);
}

// ============ Timer Helper ============

export function startRunTimer() {
  return startTimer('scheduler.runs.duration_ms');
}

// ============ Gauge Updates ============

export async function updateGauges() {
  try {
    // Job counts from database
    const allJobs = await repository.findJobs({ limit: 1000 });
    const enabledJobs = allJobs.filter(j => j.enabled);
    const pausedJobs = allJobs.filter(j => !j.enabled);

    setGauge('scheduler.jobs.total', allJobs.length);
    setGauge('scheduler.jobs.enabled', enabledJobs.length);
    setGauge('scheduler.jobs.paused', pausedJobs.length);

    // Queue stats from BullMQ
    const queue = getQueue();
    const [waiting, active, delayed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getDelayedCount(),
      queue.getFailedCount(),
    ]);

    setGauge('scheduler.queue.waiting', waiting);
    setGauge('scheduler.queue.active', active);
    setGauge('scheduler.queue.delayed', delayed);
    setGauge('scheduler.queue.failed', failed);

    // Worker status
    const worker = getWorker();
    setGauge('scheduler.worker.running', worker ? 1 : 0);

  } catch (error) {
    console.error('[Scheduler] Failed to update gauges:', error);
  }
}

// ============ Metrics Snapshot ============

export interface SchedulerMetricsSnapshot {
  jobs: {
    total: number;
    enabled: number;
    paused: number;
  };
  queue: {
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
  };
  worker: {
    running: boolean;
  };
  recentRuns: {
    total: number;
    success: number;
    failed: number;
    successRate: number;
  };
}

export async function getMetricsSnapshot(): Promise<SchedulerMetricsSnapshot> {
  const allJobs = await repository.findJobs({ limit: 1000 });
  const enabledJobs = allJobs.filter(j => j.enabled);

  const queue = getQueue();
  const [waiting, active, delayed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getDelayedCount(),
    queue.getFailedCount(),
  ]);

  const worker = getWorker();

  // Get recent runs (last hour)
  const recentRuns = await repository.findRuns({ limit: 100 });
  const successRuns = recentRuns.filter(r => r.status === 'completed').length;
  const failedRuns = recentRuns.filter(r => r.status === 'failed' || r.status === 'timeout').length;
  const totalRuns = recentRuns.length;
  const successRate = totalRuns > 0 ? (successRuns / totalRuns) * 100 : 100;

  return {
    jobs: {
      total: allJobs.length,
      enabled: enabledJobs.length,
      paused: allJobs.length - enabledJobs.length,
    },
    queue: {
      waiting,
      active,
      delayed,
      failed,
    },
    worker: {
      running: !!worker,
    },
    recentRuns: {
      total: totalRuns,
      success: successRuns,
      failed: failedRuns,
      successRate: Math.round(successRate * 100) / 100,
    },
  };
}
