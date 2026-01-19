import { redis } from '../../lib/redis.js';
import { randomUUID } from 'crypto';
import type { AlertConfig, CreateAlertInput, UpdateAlertInput, AlertEvent } from './types.js';

const PREFIX = 'pulse:alerts';

// In-memory fallback
const memoryAlerts = new Map<string, AlertConfig>();
const memoryEvents = new Map<string, AlertEvent[]>();
let useRedis = true;

export const alertRepository = {
  // ============================================================
  // ALERT CONFIGS
  // ============================================================

  async create(input: CreateAlertInput): Promise<AlertConfig> {
    const now = new Date().toISOString();
    const alert: AlertConfig = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (useRedis) {
        await redis.hset(`${PREFIX}:configs`, alert.id, JSON.stringify(alert));
      }
    } catch {
      useRedis = false;
    }

    memoryAlerts.set(alert.id, alert);
    return alert;
  },

  async update(id: string, input: UpdateAlertInput): Promise<AlertConfig | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated: AlertConfig = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (useRedis) {
        await redis.hset(`${PREFIX}:configs`, id, JSON.stringify(updated));
      }
    } catch {
      useRedis = false;
    }

    memoryAlerts.set(id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    try {
      if (useRedis) {
        await redis.hdel(`${PREFIX}:configs`, id);
      }
    } catch {
      useRedis = false;
    }

    return memoryAlerts.delete(id);
  },

  async getById(id: string): Promise<AlertConfig | null> {
    try {
      if (useRedis) {
        const data = await redis.hget(`${PREFIX}:configs`, id);
        if (data) return JSON.parse(data) as AlertConfig;
      }
    } catch {
      useRedis = false;
    }

    return memoryAlerts.get(id) ?? null;
  },

  async getAll(): Promise<AlertConfig[]> {
    try {
      if (useRedis) {
        const data = await redis.hgetall(`${PREFIX}:configs`);
        return Object.values(data).map((d) => JSON.parse(d) as AlertConfig);
      }
    } catch {
      useRedis = false;
    }

    return Array.from(memoryAlerts.values());
  },

  async getEnabled(): Promise<AlertConfig[]> {
    const all = await this.getAll();
    return all.filter((a) => a.enabled);
  },

  // ============================================================
  // ALERT EVENTS
  // ============================================================

  async recordEvent(event: AlertEvent): Promise<void> {
    const key = `${PREFIX}:events:${event.alertId}`;

    try {
      if (useRedis) {
        await redis.zadd(key, Date.now(), JSON.stringify(event));
        // Keep last 100 events per alert
        await redis.zremrangebyrank(key, 0, -101);
        await redis.expire(key, 60 * 60 * 24 * 7); // 7 days
      }
    } catch {
      useRedis = false;
    }

    if (!memoryEvents.has(event.alertId)) {
      memoryEvents.set(event.alertId, []);
    }
    const events = memoryEvents.get(event.alertId)!;
    events.push(event);
    if (events.length > 100) events.shift();
  },

  async getEvents(alertId: string, limit = 50): Promise<AlertEvent[]> {
    try {
      if (useRedis) {
        const key = `${PREFIX}:events:${alertId}`;
        const data = await redis.zrevrange(key, 0, limit - 1);
        return data.map((d) => JSON.parse(d) as AlertEvent);
      }
    } catch {
      useRedis = false;
    }

    const events = memoryEvents.get(alertId) ?? [];
    return events.slice(-limit).reverse();
  },

  async getRecentEvents(limit = 50): Promise<AlertEvent[]> {
    const allAlerts = await this.getAll();
    const allEvents: AlertEvent[] = [];

    for (const alert of allAlerts) {
      const events = await this.getEvents(alert.id, 10);
      allEvents.push(...events);
    }

    return allEvents
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
      .slice(0, limit);
  },

  // ============================================================
  // COOLDOWN TRACKING
  // ============================================================

  async isOnCooldown(alertId: string): Promise<boolean> {
    const key = `${PREFIX}:cooldown:${alertId}`;

    try {
      if (useRedis) {
        const exists = await redis.exists(key);
        return exists === 1;
      }
    } catch {
      useRedis = false;
    }

    return false;
  },

  async setCooldown(alertId: string, seconds: number): Promise<void> {
    const key = `${PREFIX}:cooldown:${alertId}`;

    try {
      if (useRedis) {
        await redis.setex(key, seconds, '1');
      }
    } catch {
      useRedis = false;
    }
  },
};
