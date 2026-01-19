/**
 * Admin Namespace (/admin)
 *
 * Namespace para dashboard de monitoramento.
 * Streaming de métricas em tempo real para clientes autorizados.
 */

import type { Namespace } from 'socket.io';
import { authMiddleware, requireRole } from '../server/middleware/auth.js';
import { getRegistry } from '../health/collectors/index.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../server/types.js';

// Extend events for admin namespace
interface AdminClientToServerEvents extends ClientToServerEvents {
  'metrics:request': () => void;
}

interface AdminServerToClientEvents extends ServerToClientEvents {
  'metrics:snapshot': (metrics: unknown) => void;
  'metrics:update': (metrics: unknown) => void;
}

type AdminNamespace = Namespace<
  AdminClientToServerEvents,
  AdminServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Intervalo de streaming de métricas (5 segundos)
const METRICS_INTERVAL = 5000;

/**
 * Configura o namespace /admin para dashboard de monitoramento
 */
export function setupAdminNamespace(admin: AdminNamespace): void {
  // Autenticação obrigatória
  admin.use(authMiddleware);

  // Requer role admin (comentado para desenvolvimento, descomentar em produção)
  // admin.use(requireRole(['admin']));

  admin.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`[Admin] Dashboard connected: ${user.id} (${user.role})`);

    // Intervalo de streaming de métricas
    const metricsInterval = setInterval(async () => {
      try {
        const registry = getRegistry();
        const metrics = await registry.collectAll();
        socket.emit('metrics:update', metrics);
      } catch (error) {
        console.error('[Admin] Error collecting metrics:', error);
      }
    }, METRICS_INTERVAL);

    // Enviar snapshot inicial
    socket.on('metrics:request', async () => {
      try {
        const registry = getRegistry();
        const metrics = await registry.collectAll();
        socket.emit('metrics:snapshot', metrics);
      } catch (error) {
        console.error('[Admin] Error on metrics request:', error);
      }
    });

    // Heartbeat
    socket.on('heartbeat', () => {
      socket.data.lastHeartbeat = new Date().toISOString();
    });

    // Cleanup no disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[Admin] Dashboard disconnected: ${user.id} (${reason})`);
      clearInterval(metricsInterval);
    });

    // Enviar snapshot inicial automaticamente
    (async () => {
      try {
        const registry = getRegistry();
        const metrics = await registry.collectAll();
        socket.emit('metrics:snapshot', metrics);
      } catch (error) {
        console.error('[Admin] Error sending initial snapshot:', error);
      }
    })();
  });

  console.log('[Admin] Namespace configured');
}
