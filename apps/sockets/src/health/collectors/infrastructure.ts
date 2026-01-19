/**
 * Infrastructure Metrics Collector
 *
 * Motor: coleta métricas de Redis e servidor.
 */

import type { InfrastructureMetrics, MetricsCollector } from '../types.js';

// Interface para cliente Redis (real ou mock)
export interface RedisLike {
  ping(): Promise<string>;
}

// Timestamp de início do servidor
const startTime = Date.now();

export class InfrastructureCollector implements MetricsCollector<InfrastructureMetrics> {
  readonly name = 'infrastructure';
  private redisClient: RedisLike;

  constructor(redisClient: RedisLike) {
    this.redisClient = redisClient;
  }

  async collect(): Promise<InfrastructureMetrics> {
    // Redis health check com latência
    let redisConnected = false;
    let redisLatency = 0;

    try {
      const start = performance.now();
      await this.redisClient.ping();
      redisLatency = Math.round((performance.now() - start) * 100) / 100;
      redisConnected = true;
    } catch {
      redisConnected = false;
      redisLatency = -1;
    }

    // Memória do processo
    const memUsage = process.memoryUsage();

    return {
      redis: {
        connected: redisConnected,
        latency: redisLatency,
      },
      server: {
        uptime: Math.floor((Date.now() - startTime) / 1000),
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
          rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
        },
      },
    };
  }
}
