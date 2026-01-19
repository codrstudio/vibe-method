import { memoryStorage } from './memory.storage.js';
import { redisStorage } from './redis.storage.js';
import type { MetricsSnapshot, TimeSeriesPoint, ErrorSummary } from '../types.js';

// Use Redis when available, fallback to memory
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
