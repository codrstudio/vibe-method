/**
 * Portal Namespace (/portal)
 *
 * External client namespace: customers, visitors.
 * Limited access - only their own chat threads.
 */

import type { Namespace } from 'socket.io';
import { authMiddleware } from '../server/middleware/auth.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../server/types.js';

type PortalNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Configures the /portal namespace for external clients
 */
export function setupPortalNamespace(portal: PortalNamespace): void {
  // Authentication middleware
  portal.use(authMiddleware);

  portal.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`[Portal] Client connected: ${user.id}`);

    // ==========================================================================
    // Thread Events (Limited to own threads)
    // ==========================================================================

    socket.on('join:thread', ({ threadId }) => {
      // In production: verify user has access to this thread via Backbone API
      // For now, trust the client (should be validated)
      const room = `thread:${threadId}`;
      socket.join(room);
      socket.data.joinedRooms.add(room);
      console.log(`[Portal] Client ${user.id} joined thread ${threadId}`);
    });

    socket.on('leave:thread', ({ threadId }) => {
      const room = `thread:${threadId}`;
      socket.leave(room);
      socket.data.joinedRooms.delete(room);
      console.log(`[Portal] Client ${user.id} left thread ${threadId}`);
    });

    // ==========================================================================
    // Typing Events (Ephemeral)
    // ==========================================================================

    socket.on('typing:start', ({ threadId }) => {
      // Only emit if user is in the thread
      if (socket.data.joinedRooms.has(`thread:${threadId}`)) {
        socket.to(`thread:${threadId}`).emit('thread:typing', {
          threadId,
          userId: user.id,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', ({ threadId }) => {
      if (socket.data.joinedRooms.has(`thread:${threadId}`)) {
        socket.to(`thread:${threadId}`).emit('thread:typing', {
          threadId,
          userId: user.id,
          isTyping: false,
        });
      }
    });

    // ==========================================================================
    // Heartbeat (simpler for portal clients)
    // ==========================================================================

    socket.on('heartbeat', () => {
      // Just acknowledge the client is still connected
      // Portal clients don't have presence status like attendants
    });

    // ==========================================================================
    // Disconnection
    // ==========================================================================

    socket.on('disconnect', (reason) => {
      console.log(`[Portal] Client ${user.id} disconnected: ${reason}`);
    });
  });

  console.log('[Portal] Namespace configured');
}
