import { redis } from '../../lib/redis.js';
import type { MetricsSnapshot, TimeSeriesPoint, ErrorSummary } from '../types.js';

const PREFIX = 'pulse:metrics';
const MAX_SNAPSHOTS = 1000;
const MAX_POINTS = 3600;

const RETENTION = {
  '1m': 60 * 60,
  '5m': 60 * 60 * 6,
  '1h': 60 * 60 * 24 * 7,
  '24h': 60 * 60 * 24 * 30,
};

// ============================================================
// IN-MEMORY STORAGE (fallback)
// ============================================================

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

const memoryStorage = new InMemoryStorage();

// ============================================================
// REDIS STORAGE
// ============================================================

const redisStorage = {
  async storeSnapshot(snapshot: MetricsSnapshot): Promise<void> {
    const key = `${PREFIX}:snapshot:${snapshot.period}`;
    const timestamp = Date.now();

    await redis.zadd(key, timestamp, JSON.stringify(snapshot));

    const retention = RETENTION[snapshot.period as keyof typeof RETENTION] ?? 3600;
    const cutoff = timestamp - retention * 1000;
    await redis.zremrangebyscore(key, 0, cutoff);
  },

  async getSnapshots(period: string, from: Date, to: Date): Promise<MetricsSnapshot[]> {
    const key = `${PREFIX}:snapshot:${period}`;
    const results = await redis.zrangebyscore(key, from.getTime(), to.getTime());
    return results.map((r) => JSON.parse(r) as MetricsSnapshot);
  },

  async storePoint(metricName: string, value: number, timestamp = Date.now()): Promise<void> {
    const key = `${PREFIX}:ts:${metricName}`;
    await redis.zadd(key, timestamp, JSON.stringify({ timestamp: new Date(timestamp).toISOString(), value }));

    const cutoff = timestamp - 60 * 60 * 1000;
    await redis.zremrangebyscore(key, 0, cutoff);
  },

  async getPoints(metricName: string, from: Date, to: Date): Promise<TimeSeriesPoint[]> {
    const key = `${PREFIX}:ts:${metricName}`;
    const results = await redis.zrangebyscore(key, from.getTime(), to.getTime());
    return results.map((r) => JSON.parse(r) as TimeSeriesPoint);
  },

  async recordError(module: string, errorType: string, message: string): Promise<void> {
    const key = `${PREFIX}:errors:${module}`;
    const countKey = `${PREFIX}:error_count:${module}:${errorType}`;

    const count = await redis.incr(countKey);

    await redis.hset(
      key,
      errorType,
      JSON.stringify({
        type: errorType,
        count,
        lastOccurred: new Date().toISOString(),
        lastMessage: message,
      })
    );

    await redis.expire(key, 60 * 60 * 24);
    await redis.expire(countKey, 60 * 60 * 24);
  },

  async getErrors(module: string): Promise<ErrorSummary[]> {
    const key = `${PREFIX}:errors:${module}`;
    const errors = await redis.hgetall(key);

    return Object.values(errors).map((e) => JSON.parse(e) as ErrorSummary);
  },
};

// ============================================================
// HYBRID STORAGE (Redis with memory fallback)
// ============================================================

let useRedis = true;

export const storage = {
  async storeSnapshot(snapshot: MetricsSnapshot): Promise<void> {
    try {
      if (useRedis) {
        await redisStorage.storeSnapshot(snapshot);
      }
    } catch {
      useRedis = false;
    }
    await memoryStorage.storeSnapshot(snapshot);
  },

  async getSnapshots(period: string, from: Date, to: Date): Promise<MetricsSnapshot[]> {
    try {
      if (useRedis) {
        return await redisStorage.getSnapshots(period, from, to);
      }
    } catch {
      useRedis = false;
    }
    return memoryStorage.getSnapshots(period, from, to);
  },

  async storePoint(metricName: string, value: number, timestamp?: number): Promise<void> {
    try {
      if (useRedis) {
        await redisStorage.storePoint(metricName, value, timestamp);
      }
    } catch {
      useRedis = false;
    }
    await memoryStorage.storePoint(metricName, value, timestamp);
  },

  async getPoints(metricName: string, from: Date, to: Date): Promise<TimeSeriesPoint[]> {
    try {
      if (useRedis) {
        return await redisStorage.getPoints(metricName, from, to);
      }
    } catch {
      useRedis = false;
    }
    return memoryStorage.getPoints(metricName, from, to);
  },

  async recordError(module: string, errorType: string, message: string): Promise<void> {
    try {
      if (useRedis) {
        await redisStorage.recordError(module, errorType, message);
      }
    } catch {
      useRedis = false;
    }
    await memoryStorage.recordError(module, errorType, message);
  },

  async getErrors(module: string): Promise<ErrorSummary[]> {
    try {
      if (useRedis) {
        return await redisStorage.getErrors(module);
      }
    } catch {
      useRedis = false;
    }
    return memoryStorage.getErrors(module);
  },
};
