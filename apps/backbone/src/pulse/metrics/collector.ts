import type {
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  Metric,
} from '../types.js';

const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

interface HistogramState {
  values: number[];
  buckets: Map<number, number>;
}

/**
 * Singleton metrics collector
 */
class MetricsCollector {
  private counters = new Map<string, Map<string, number>>();
  private gauges = new Map<string, Map<string, number>>();
  private histograms = new Map<string, Map<string, HistogramState>>();
  private startTime = Date.now();
  private buckets: number[];

  constructor(buckets = DEFAULT_BUCKETS) {
    this.buckets = buckets.sort((a, b) => a - b);
  }

  // ============================================================
  // COUNTER
  // ============================================================

  incCounter(name: string, value = 1, labels?: Record<string, string>): void {
    const key = this.labelsToKey(labels);
    if (!this.counters.has(name)) {
      this.counters.set(name, new Map());
    }
    const current = this.counters.get(name)!.get(key) ?? 0;
    this.counters.get(name)!.set(key, current + value);
  }

  getCounter(name: string, labels?: Record<string, string>): CounterMetric {
    const key = this.labelsToKey(labels);
    const value = this.counters.get(name)?.get(key) ?? 0;
    return { type: 'counter', value, labels };
  }

  // ============================================================
  // GAUGE
  // ============================================================

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.labelsToKey(labels);
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Map());
    }
    this.gauges.get(name)!.set(key, value);
  }

  incGauge(name: string, value = 1, labels?: Record<string, string>): void {
    const current = this.getGauge(name, labels).value;
    this.setGauge(name, current + value, labels);
  }

  decGauge(name: string, value = 1, labels?: Record<string, string>): void {
    const current = this.getGauge(name, labels).value;
    this.setGauge(name, Math.max(0, current - value), labels);
  }

  getGauge(name: string, labels?: Record<string, string>): GaugeMetric {
    const key = this.labelsToKey(labels);
    const value = this.gauges.get(name)?.get(key) ?? 0;
    return { type: 'gauge', value, labels };
  }

  // ============================================================
  // HISTOGRAM
  // ============================================================

  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.labelsToKey(labels);
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new Map());
    }

    const metricMap = this.histograms.get(name)!;
    if (!metricMap.has(key)) {
      metricMap.set(key, {
        values: [],
        buckets: new Map(this.buckets.map((b) => [b, 0])),
      });
    }

    const state = metricMap.get(key)!;

    // Keep last 10000 values to limit memory
    if (state.values.length >= 10000) {
      state.values.shift();
    }
    state.values.push(value);

    for (const bucket of this.buckets) {
      if (value <= bucket) {
        state.buckets.set(bucket, (state.buckets.get(bucket) ?? 0) + 1);
      }
    }
  }

  getHistogram(name: string, labels?: Record<string, string>): HistogramMetric {
    const key = this.labelsToKey(labels);
    const state = this.histograms.get(name)?.get(key);

    if (!state || state.values.length === 0) {
      return {
        type: 'histogram',
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        buckets: Object.fromEntries(this.buckets.map((b) => [b.toString(), 0])),
        labels,
      };
    }

    const sorted = [...state.values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, v) => acc + v, 0);

    return {
      type: 'histogram',
      count,
      sum,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sum / count,
      p50: this.percentile(sorted, 50),
      p90: this.percentile(sorted, 90),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      buckets: Object.fromEntries(
        Array.from(state.buckets.entries()).map(([k, v]) => [k.toString(), v])
      ),
      labels,
    };
  }

  // ============================================================
  // TIMING HELPERS
  // ============================================================

  async time<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      this.observeHistogram(name, performance.now() - start, labels);
    }
  }

  startTimer(name: string, labels?: Record<string, string>): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.observeHistogram(name, duration, labels);
      return duration;
    };
  }

  // ============================================================
  // SNAPSHOT & UTILITIES
  // ============================================================

  getSnapshot(): Record<string, Metric[]> {
    const result: Record<string, Metric[]> = {};

    for (const [name, labelMap] of this.counters) {
      result[name] = Array.from(labelMap.entries()).map(([key, value]) => ({
        type: 'counter' as const,
        value,
        labels: this.keyToLabels(key),
      }));
    }

    for (const [name, labelMap] of this.gauges) {
      result[name] = Array.from(labelMap.entries()).map(([key, value]) => ({
        type: 'gauge' as const,
        value,
        labels: this.keyToLabels(key),
      }));
    }

    for (const [name] of this.histograms) {
      result[name] = [this.getHistogram(name)];
    }

    return result;
  }

  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.startTime = Date.now();
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  private labelsToKey(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return '__default__';
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
  }

  private keyToLabels(key: string): Record<string, string> | undefined {
    if (key === '__default__') return undefined;
    return Object.fromEntries(key.split(',').map((pair) => pair.split('=')));
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Singleton
export const metrics = new MetricsCollector();

// Convenience exports
export const incCounter = metrics.incCounter.bind(metrics);
export const setGauge = metrics.setGauge.bind(metrics);
export const incGauge = metrics.incGauge.bind(metrics);
export const decGauge = metrics.decGauge.bind(metrics);
export const observeHistogram = metrics.observeHistogram.bind(metrics);
export const timeAsync = metrics.time.bind(metrics);
export const startTimer = metrics.startTimer.bind(metrics);
