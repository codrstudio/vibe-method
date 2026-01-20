/**
 * Socket.io Server Setup
 *
 * Initializes Socket.io with Redis adapter for horizontal scaling.
 * Following REALTIME.md architecture principles.
 */

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, type RedisClientType } from 'redis';
import { config } from '../config.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  RedisEvent,
} from './types.js';

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

interface ServerContext {
  io: TypedServer;
  pubClient: RedisClientType | MockRedisClient;
  subClient: RedisClientType | MockRedisClient;
}

/**
 * Mock Redis client for development without Redis
 */
export class MockRedisClient {
  async connect() { return this; }
  async quit() { return; }
  async ping() { return 'PONG'; }
  duplicate() { return new MockRedisClient(); }
  async subscribe(_channel: string, _callback: (message: string) => void) { return; }
}

/**
 * Creates and configures the Socket.io server
 */
export async function createSocketServer(): Promise<ServerContext> {
  // Create Socket.io server
  const io: TypedServer = new Server({
    cors: config.cors,
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  let pubClient: RedisClientType | MockRedisClient;
  let subClient: RedisClientType | MockRedisClient;

  try {
    // Setup Redis clients for adapter
    const redisPub = createClient({
      url: config.redis.url,
      password: config.redis.password,
    });

    const redisSub = redisPub.duplicate();

    // Connect Redis clients
    await Promise.all([redisPub.connect(), redisSub.connect()]);

    // Configure Redis adapter for horizontal scaling
    io.adapter(createAdapter(redisPub, redisSub));

    pubClient = redisPub;
    subClient = redisSub;

    console.log('[Socket] Redis adapter configured');
  } catch (error) {
    console.warn('[Socket] Redis not available, running in standalone mode');
    console.warn('[Socket] Error:', (error as Error).message);
    pubClient = new MockRedisClient();
    subClient = new MockRedisClient();
  }

  return { io, pubClient, subClient };
}

/**
 * Subscribes to Redis Pub/Sub for business events from Backbone
 *
 * Business events flow: Backbone -> Redis Pub/Sub -> Socket Server -> Clients
 */
export function subscribeToRedisEvents(
  subClient: RedisClientType,
  io: TypedServer,
  channel: string = 'socket:events'
): void {
  const subscriber = subClient.duplicate();

  subscriber.connect().then(() => {
    subscriber.subscribe(channel, (message) => {
      try {
        const event = JSON.parse(message) as RedisEvent;
        handleRedisEvent(io, event);
      } catch (error) {
        console.error('[Socket] Failed to parse Redis event:', error);
      }
    });

    console.log(`[Socket] Subscribed to Redis channel: ${channel}`);
  });
}

/**
 * Handles business events from Redis and broadcasts to appropriate rooms
 */
function handleRedisEvent(io: TypedServer, event: RedisEvent): void {
  const { type, payload } = event;

  switch (type) {
    case 'presence:changed': {
      const data = payload as { userId: string; status: string; group?: string };
      const room = data.group ? `presence:${data.group}` : 'presence:all';

      if (data.status === 'online') {
        io.to(room).emit('attendant:online', {
          userId: data.userId,
          status: 'online',
          timestamp: event.timestamp,
        });
      } else if (data.status === 'offline') {
        io.to(room).emit('attendant:offline', {
          userId: data.userId,
          status: 'offline',
          timestamp: event.timestamp,
        });
      } else if (data.status === 'away') {
        io.to(room).emit('attendant:away', {
          userId: data.userId,
          status: 'away',
          timestamp: event.timestamp,
        });
      }
      break;
    }

    case 'thread:message': {
      const data = payload as {
        threadId: string;
        messageId: string;
        senderId: string;
        content: string;
      };
      io.to(`thread:${data.threadId}`).emit('thread:message', {
        ...data,
        timestamp: event.timestamp,
      });
      break;
    }

    case 'chat:accepted': {
      const data = payload as { threadId: string; attendantId: string };
      io.to(`thread:${data.threadId}`).emit('chat:accepted', data);
      break;
    }

    case 'chat:ended': {
      const data = payload as { threadId: string; reason: string };
      io.to(`thread:${data.threadId}`).emit('chat:ended', data);
      break;
    }

    case 'queue:updated': {
      const data = payload as { items: unknown[]; targetRoom?: string };
      const room = data.targetRoom || 'queue:watchers';
      io.to(room).emit('queue:updated', data.items as never);
      break;
    }

    default:
      console.warn(`[Socket] Unknown Redis event type: ${type}`);
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownServer(context: ServerContext): Promise<void> {
  console.log('[Socket] Shutting down...');

  // Close all connections
  context.io.close();

  // Disconnect Redis clients
  await Promise.all([
    context.pubClient.quit(),
    context.subClient.quit(),
  ]);

  console.log('[Socket] Shutdown complete');
}
