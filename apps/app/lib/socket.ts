/**
 * Socket.io Client Configuration
 *
 * Cliente singleton para conexão com o socket server.
 */

import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8001';

/**
 * Cria conexão socket para um namespace específico
 * Usa HTTP-only cookies para autenticação (withCredentials: true)
 */
export function createSocketConnection(
  namespace: '/hub' | '/portal' | '/admin'
): Socket {
  return io(`${SOCKET_URL}${namespace}`, {
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    autoConnect: false,
  });
}

/**
 * Tipos de métricas recebidas do servidor
 */
export interface MetricsSnapshot {
  timestamp: number;
  connections: {
    total: number;
    byNamespace: {
      hub: number;
      portal: number;
      admin: number;
    };
    rates: {
      connects1m: number;
      disconnects1m: number;
    };
  };
  events: {
    total: {
      inbound: number;
      outbound: number;
    };
    throughput1m: number;
    latency: {
      avg: number;
      p95: number;
    };
    byType: Record<string, number>;
  };
  rooms: {
    total: number;
    byPrefix: Record<string, number>;
    avgSize: number;
    largest: {
      name: string;
      size: number;
    } | null;
  };
  presence: {
    online: number;
    away: number;
    staleClients: number;
  };
  infrastructure: {
    redis: {
      connected: boolean;
      latency: number;
    };
    server: {
      uptime: number;
      memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
      };
    };
  };
}

export interface ConnectionInfo {
  id: string;
  namespace: string;
  userId: string;
  connectedAt: string;
  rooms: string[];
  lastHeartbeat: string | null;
}

export interface RoomInfo {
  name: string;
  size: number;
  members: string[];
}
