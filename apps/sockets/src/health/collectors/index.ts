/**
 * Metrics Collectors Registry
 *
 * Motor: orquestra a coleta de métricas de todos os collectors.
 */

import type { Server } from 'socket.io';
import type { MetricsSnapshot } from '../types.js';
import { ConnectionsCollector } from './connections.js';
import { EventsCollector } from './events.js';
import { RoomsCollector } from './rooms.js';
import { InfrastructureCollector, type RedisLike } from './infrastructure.js';

export class MetricsRegistry {
  private connectionsCollector: ConnectionsCollector;
  private eventsCollector: EventsCollector;
  private roomsCollector: RoomsCollector;
  private infrastructureCollector: InfrastructureCollector;

  constructor(io: Server, redisClient: RedisLike) {
    this.connectionsCollector = new ConnectionsCollector(io);
    this.eventsCollector = new EventsCollector();
    this.roomsCollector = new RoomsCollector(io);
    this.infrastructureCollector = new InfrastructureCollector(redisClient);
  }

  /**
   * Coleta todas as métricas de uma vez
   */
  async collectAll(): Promise<MetricsSnapshot> {
    const [connections, events, rooms, infrastructure] = await Promise.all([
      this.connectionsCollector.collect(),
      this.eventsCollector.collect(),
      this.roomsCollector.collect(),
      this.infrastructureCollector.collect(),
    ]);

    return {
      timestamp: Date.now(),
      connections,
      events,
      rooms,
      presence: {
        online: 0, // TODO: integrar com sistema de presença do backbone
        away: 0,
        staleClients: 0,
      },
      infrastructure,
    };
  }

  /**
   * Acesso direto ao collector de eventos para o middleware
   */
  getEventsCollector(): EventsCollector {
    return this.eventsCollector;
  }

  /**
   * Acesso direto ao collector de conexões
   */
  getConnectionsCollector(): ConnectionsCollector {
    return this.connectionsCollector;
  }

  /**
   * Reset de métricas acumulativas
   */
  reset(): void {
    this.eventsCollector.reset();
    this.connectionsCollector.reset();
  }
}

// Singleton para acesso global (inicializado no startup)
let registry: MetricsRegistry | null = null;

export function initializeRegistry(io: Server, redisClient: RedisLike): MetricsRegistry {
  registry = new MetricsRegistry(io, redisClient);
  return registry;
}

export function getRegistry(): MetricsRegistry {
  if (!registry) {
    throw new Error('MetricsRegistry not initialized. Call initializeRegistry first.');
  }
  return registry;
}
