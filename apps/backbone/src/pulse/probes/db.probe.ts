import { pool } from '../../lib/db.js';
import type { HealthProbe, ProbeResult } from '../types.js';

export const dbShallowProbe: HealthProbe = {
  name: 'database',
  isDeep: false,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    try {
      const { totalCount, idleCount, waitingCount } = pool;

      return {
        name: 'database',
        healthy: idleCount > 0 || waitingCount === 0,
        latency: performance.now() - start,
        details: { total: totalCount, idle: idleCount, waiting: waitingCount },
      };
    } catch (error) {
      return {
        name: 'database',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const dbDeepProbe: HealthProbe = {
  name: 'database',
  isDeep: true,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    try {
      const result = await pool.query('SELECT 1 as health_check');
      const latency = performance.now() - start;

      return {
        name: 'database',
        healthy: result.rows.length === 1,
        latency,
        details: {
          queryTime: latency,
          pool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
          },
        },
      };
    } catch (error) {
      return {
        name: 'database',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
