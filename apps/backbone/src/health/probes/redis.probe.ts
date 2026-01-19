import { redis } from '../../lib/redis.js';
import type { HealthProbe, ProbeResult } from '../types.js';

export const redisShallowProbe: HealthProbe = {
  name: 'redis',
  isDeep: false,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    try {
      const status = redis.status;

      return {
        name: 'redis',
        healthy: status === 'ready',
        latency: performance.now() - start,
        details: { status },
      };
    } catch (error) {
      return {
        name: 'redis',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const redisDeepProbe: HealthProbe = {
  name: 'redis',
  isDeep: true,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    try {
      const pong = await redis.ping();
      const latency = performance.now() - start;

      let usedMemory = 0;
      try {
        const info = await redis.info('memory');
        const match = info.match(/used_memory:(\d+)/);
        usedMemory = match ? parseInt(match[1], 10) : 0;
      } catch {
        // Ignore memory info errors
      }

      return {
        name: 'redis',
        healthy: pong === 'PONG',
        latency,
        details: {
          ping: pong,
          usedMemory,
          status: redis.status,
        },
      };
    } catch (error) {
      return {
        name: 'redis',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
