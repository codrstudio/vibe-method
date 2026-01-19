import { redis } from './redis.js';

/**
 * Emit event to specific user via Socket.io (through Redis pub/sub)
 */
export async function emitToUser(userId: string, event: string, data: unknown): Promise<void> {
  await redis.publish(
    'socket:user',
    JSON.stringify({
      userId,
      event,
      data,
    })
  );
}

/**
 * Emit event to a room via Socket.io (through Redis pub/sub)
 */
export async function emitToRoom(room: string, event: string, data: unknown): Promise<void> {
  await redis.publish(
    'socket:room',
    JSON.stringify({
      room,
      event,
      data,
    })
  );
}

/**
 * Broadcast event to all connected clients
 */
export async function broadcast(event: string, data: unknown): Promise<void> {
  await redis.publish(
    'socket:broadcast',
    JSON.stringify({
      event,
      data,
    })
  );
}

/**
 * Internal event bus for backbone modules
 */
type EventHandler = (data: unknown) => void | Promise<void>;
const handlers = new Map<string, Set<EventHandler>>();

export const internalBus = {
  on(event: string, handler: EventHandler): void {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)!.add(handler);
  },

  off(event: string, handler: EventHandler): void {
    handlers.get(event)?.delete(handler);
  },

  async emit(event: string, data: unknown): Promise<void> {
    const eventHandlers = handlers.get(event);
    if (!eventHandlers) return;

    await Promise.all(
      Array.from(eventHandlers).map((handler) => handler(data))
    );
  },
};
