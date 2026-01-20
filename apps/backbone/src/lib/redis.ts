import Redis from 'ioredis';
import { config } from '../config.js';
import { incCounter, startTimer } from '../health/collector.js';

export const redis = new Redis(config.REDIS_URL);

export const redisSub = new Redis(config.REDIS_URL);

// Dedicated connection for BullMQ (requires maxRetriesPerRequest: null)
export const redisBullMQ = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Cache helpers with instrumentation
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const stopTimer = startTimer('redis.command.latency', { command: 'get' });
    incCounter('redis.commands.count', 1, { command: 'get' });

    try {
      const value = await redis.get(key);
      stopTimer();
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      stopTimer();
      incCounter('redis.commands.errors', 1, { command: 'get' });
      throw error;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const stopTimer = startTimer('redis.command.latency', { command: 'set' });
    incCounter('redis.commands.count', 1, { command: 'set' });

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
      stopTimer();
    } catch (error) {
      stopTimer();
      incCounter('redis.commands.errors', 1, { command: 'set' });
      throw error;
    }
  },

  async del(key: string): Promise<void> {
    const stopTimer = startTimer('redis.command.latency', { command: 'del' });
    incCounter('redis.commands.count', 1, { command: 'del' });

    try {
      await redis.del(key);
      stopTimer();
    } catch (error) {
      stopTimer();
      incCounter('redis.commands.errors', 1, { command: 'del' });
      throw error;
    }
  },

  async exists(key: string): Promise<boolean> {
    const stopTimer = startTimer('redis.command.latency', { command: 'exists' });
    incCounter('redis.commands.count', 1, { command: 'exists' });

    try {
      const result = await redis.exists(key);
      stopTimer();
      return result === 1;
    } catch (error) {
      stopTimer();
      incCounter('redis.commands.errors', 1, { command: 'exists' });
      throw error;
    }
  },
};
