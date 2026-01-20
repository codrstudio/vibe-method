import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

let redisInstance: Redis | null = null

function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(redisUrl)
  }
  return redisInstance
}

export const redis = {
  get instance() {
    return getRedis()
  },
  get: (key: string) => getRedis().get(key),
  set: (key: string, value: string) => getRedis().set(key, value),
  setex: (key: string, ttl: number, value: string) => getRedis().setex(key, ttl, value),
  del: (key: string) => getRedis().del(key),
  exists: (key: string) => getRedis().exists(key),
  ttl: (key: string) => getRedis().ttl(key),
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    if (!value) return null
    return JSON.parse(value) as T
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized)
    } else {
      await redis.set(key, serialized)
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key)
  },

  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key)
    return result === 1
  },

  async ttl(key: string): Promise<number> {
    return redis.ttl(key)
  },
}
