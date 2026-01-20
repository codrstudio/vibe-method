import type { HealthProbe, ProbeResult } from '../types.js';
import { getMetricsSnapshot } from '../../services/scheduler/metrics.js';

export const schedulerShallowProbe: HealthProbe = {
  name: 'scheduler',
  isDeep: false,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    try {
      const { getWorker } = await import('../../services/scheduler/worker.js');
      const worker = getWorker();
      const running = !!worker;

      return {
        name: 'scheduler',
        healthy: running,
        latency: performance.now() - start,
        message: running ? 'Worker running' : 'Worker not running',
        details: { workerRunning: running },
      };
    } catch (error) {
      return {
        name: 'scheduler',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const schedulerDeepProbe: HealthProbe = {
  name: 'scheduler',
  isDeep: true,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    try {
      const snapshot = await getMetricsSnapshot();
      const latency = performance.now() - start;

      // Determine health status
      const { worker, queue, recentRuns } = snapshot;

      // Unhealthy conditions
      if (!worker.running) {
        return {
          name: 'scheduler',
          healthy: false,
          latency,
          message: 'Worker not running',
          details: snapshot,
        };
      }

      if (queue.waiting > 100) {
        return {
          name: 'scheduler',
          healthy: false,
          latency,
          message: `Queue backlog critical: ${queue.waiting} waiting`,
          details: snapshot,
        };
      }

      if (recentRuns.total > 10 && recentRuns.successRate < 80) {
        return {
          name: 'scheduler',
          healthy: false,
          latency,
          message: `Low success rate: ${recentRuns.successRate}%`,
          details: snapshot,
        };
      }

      // Degraded conditions
      if (queue.waiting > 50 || queue.failed > 10) {
        return {
          name: 'scheduler',
          healthy: true, // degraded but functional
          latency,
          message: `Queue degraded: ${queue.waiting} waiting, ${queue.failed} failed`,
          details: { ...snapshot, status: 'degraded' },
        };
      }

      if (recentRuns.total > 10 && recentRuns.successRate < 95) {
        return {
          name: 'scheduler',
          healthy: true,
          latency,
          message: `Success rate degraded: ${recentRuns.successRate}%`,
          details: { ...snapshot, status: 'degraded' },
        };
      }

      // Healthy
      return {
        name: 'scheduler',
        healthy: true,
        latency,
        message: `OK - ${snapshot.jobs.enabled} jobs, ${recentRuns.successRate}% success`,
        details: snapshot,
      };
    } catch (error) {
      return {
        name: 'scheduler',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
