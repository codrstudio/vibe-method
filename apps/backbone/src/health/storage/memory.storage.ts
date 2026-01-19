import type { MetricsSnapshot, TimeSeriesPoint, ErrorSummary } from '../types.js';

const MAX_SNAPSHOTS = 1000;
const MAX_POINTS = 3600;

class InMemoryStorage {
  private snapshots = new Map<string, MetricsSnapshot[]>();
  private timeSeries = new Map<string, TimeSeriesPoint[]>();
  private errors = new Map<string, Map<string, ErrorSummary>>();

  async storeSnapshot(snapshot: MetricsSnapshot): Promise<void> {
    const key = snapshot.period;
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, []);
    }

    const list = this.snapshots.get(key)!;
    list.push(snapshot);

    if (list.length > MAX_SNAPSHOTS) {
      list.shift();
    }
  }

  async getSnapshots(period: string, from: Date, to: Date): Promise<MetricsSnapshot[]> {
    const list = this.snapshots.get(period) ?? [];
    return list.filter((s) => {
      const time = new Date(s.timestamp).getTime();
      return time >= from.getTime() && time <= to.getTime();
    });
  }

  async storePoint(metricName: string, value: number, timestamp = Date.now()): Promise<void> {
    if (!this.timeSeries.has(metricName)) {
      this.timeSeries.set(metricName, []);
    }

    const points = this.timeSeries.get(metricName)!;
    points.push({ timestamp: new Date(timestamp).toISOString(), value });

    if (points.length > MAX_POINTS) {
      points.shift();
    }
  }

  async getPoints(metricName: string, from: Date, to: Date): Promise<TimeSeriesPoint[]> {
    const points = this.timeSeries.get(metricName) ?? [];
    return points.filter((p) => {
      const time = new Date(p.timestamp).getTime();
      return time >= from.getTime() && time <= to.getTime();
    });
  }

  async recordError(module: string, errorType: string, message: string): Promise<void> {
    if (!this.errors.has(module)) {
      this.errors.set(module, new Map());
    }

    const moduleErrors = this.errors.get(module)!;
    const current = moduleErrors.get(errorType);

    moduleErrors.set(errorType, {
      type: errorType,
      count: (current?.count ?? 0) + 1,
      lastOccurred: new Date().toISOString(),
      lastMessage: message,
    });
  }

  async getErrors(module: string): Promise<ErrorSummary[]> {
    const moduleErrors = this.errors.get(module);
    if (!moduleErrors) return [];
    return Array.from(moduleErrors.values());
  }

  clear(): void {
    this.snapshots.clear();
    this.timeSeries.clear();
    this.errors.clear();
  }
}

export const memoryStorage = new InMemoryStorage();
