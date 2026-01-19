/**
 * Events Metrics Collector
 *
 * Motor: coleta métricas de throughput e latência de eventos.
 */

import type { EventMetrics, MetricsCollector } from '../types.js';

/**
 * Histogram simples para calcular percentis
 */
class LatencyHistogram {
  private values: number[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  record(value: number): void {
    this.values.push(value);
    if (this.values.length > this.maxSize) {
      this.values.shift();
    }
  }

  getAvg(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  getPercentile(p: number): number {
    if (this.values.length === 0) return 0;
    const sorted = [...this.values].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  reset(): void {
    this.values = [];
  }
}

/**
 * Rate counter para throughput
 */
class ThroughputCounter {
  private timestamps: number[] = [];
  private windowMs: number;

  constructor(windowMs: number = 60000) {
    this.windowMs = windowMs;
  }

  record(): void {
    this.timestamps.push(Date.now());
    this.cleanup();
  }

  getRate(): number {
    this.cleanup();
    // Eventos por segundo (média do último minuto)
    return this.timestamps.length / (this.windowMs / 1000);
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }

  reset(): void {
    this.timestamps = [];
  }
}

export class EventsCollector implements MetricsCollector<EventMetrics> {
  readonly name = 'events';

  private inboundCount = 0;
  private outboundCount = 0;
  private latencyHistogram = new LatencyHistogram();
  private throughputCounter = new ThroughputCounter();
  private eventCounts = new Map<string, number>();

  /**
   * Registra evento de entrada
   */
  recordInbound(eventType: string, latencyMs: number): void {
    this.inboundCount++;
    this.throughputCounter.record();
    this.latencyHistogram.record(latencyMs);

    const current = this.eventCounts.get(eventType) || 0;
    this.eventCounts.set(eventType, current + 1);
  }

  /**
   * Registra evento de saída
   */
  recordOutbound(eventType: string): void {
    this.outboundCount++;
    this.throughputCounter.record();

    const key = `out:${eventType}`;
    const current = this.eventCounts.get(key) || 0;
    this.eventCounts.set(key, current + 1);
  }

  async collect(): Promise<EventMetrics> {
    return {
      total: {
        inbound: this.inboundCount,
        outbound: this.outboundCount,
      },
      throughput1m: Math.round(this.throughputCounter.getRate() * 100) / 100,
      latency: {
        avg: Math.round(this.latencyHistogram.getAvg() * 100) / 100,
        p95: Math.round(this.latencyHistogram.getPercentile(95) * 100) / 100,
      },
      byType: Object.fromEntries(this.eventCounts),
    };
  }

  reset(): void {
    this.inboundCount = 0;
    this.outboundCount = 0;
    this.latencyHistogram.reset();
    this.throughputCounter.reset();
    this.eventCounts.clear();
  }
}
