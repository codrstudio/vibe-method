import { redis } from '../../lib/redis.js';
import type { MetricsSnapshot, TimeSeriesPoint, ErrorSummary } from '../types.js';

const PREFIX = 'backbone:health';

const RETENTION = {
  '1m': 60 * 60,
  '5m': 60 * 60 * 6,
  '1h': 60 * 60 * 24 * 7,
  '24h': 60 * 60 * 24 * 30,
};

export const redisStorage = {
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
