/**
 * Metrics Middleware
 *
 * Motor: instrumenta eventos para coleta de métricas.
 */

import type { Socket } from 'socket.io';
import { getRegistry } from '../../health/collectors/index.js';

/**
 * Middleware que instrumenta socket para coleta de métricas
 */
export function metricsMiddleware(socket: Socket, next: (err?: Error) => void): void {
  try {
    const registry = getRegistry();
    const eventsCollector = registry.getEventsCollector();
    const connectionsCollector = registry.getConnectionsCollector();

    // Registrar conexão
    connectionsCollector.recordConnect();

    // Instrumentar eventos de entrada
    socket.onAny((event: string, ...args: unknown[]) => {
      const start = performance.now();

      // Usar process.nextTick para medir após o handler
      process.nextTick(() => {
        const duration = performance.now() - start;
        eventsCollector.recordInbound(event, duration);
      });
    });

    // Wrap emit para contar eventos de saída
    const originalEmit = socket.emit.bind(socket);
    socket.emit = function (event: string, ...args: unknown[]): boolean {
      // Não contar eventos internos do socket.io
      if (!event.startsWith('socket.')) {
        eventsCollector.recordOutbound(event);
      }
      return originalEmit(event, ...args);
    } as typeof socket.emit;

    // Registrar desconexão
    socket.on('disconnect', () => {
      connectionsCollector.recordDisconnect();
    });

    next();
  } catch (error) {
    // Se o registry não estiver inicializado, continuar sem métricas
    console.warn('[Metrics] Registry not ready, skipping metrics middleware');
    next();
  }
}
