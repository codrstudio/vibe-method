/**
 * Hub Namespace (/hub)
 *
 * Internal team namespace: attendants, admins, supervisors.
 * Full access to presence, queue, and chat events.
 */

import type { Namespace } from 'socket.io';
import { authMiddleware, requireRole } from '../server/middleware/auth.js';
import { config } from '../config.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../server/types.js';

type HubNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Configures the /hub namespace for internal team
 */
export function setupHubNamespace(hub: HubNamespace): void {
  // Authentication middleware
  hub.use(authMiddleware);

  // Optional: Role restriction (uncomment to enforce)
  // hub.use(requireRole(['admin', 'attendant', 'supervisor']));

  hub.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`[Hub] User connected: ${user.id} (${user.role})`);

    // Join presence room for attendants
    socket.join('presence:attendants');
    socket.data.joinedRooms.add('presence:attendants');

    // Join queue watchers room
    socket.join('queue:watchers');
    socket.data.joinedRooms.add('queue:watchers');

    // ==========================================================================
    // Presence Events
    // ==========================================================================

    socket.on('presence:online', () => {
      console.log(`[Hub] User ${user.id} is online`);
      // Note: Actual presence change should go through Backbone -> Redis
      // This is just for UI feedback, real state managed by Backbone
    });

    socket.on('presence:away', () => {
      console.log(`[Hub] User ${user.id} is away`);
    });

    socket.on('heartbeat', () => {
      // Renew presence TTL
      // In production, this would update Redis TTL via Backbone
      socket.data.joinedRooms.forEach((room) => {
        // Keep rooms active
      });
    });

    // ==========================================================================
    // Thread Events
    // ==========================================================================

    socket.on('join:thread', ({ threadId }) => {
      const room = `thread:${threadId}`;
      socket.join(room);
      socket.data.joinedRooms.add(room);
      console.log(`[Hub] User ${user.id} joined thread ${threadId}`);
    });

    socket.on('leave:thread', ({ threadId }) => {
      const room = `thread:${threadId}`;
      socket.leave(room);
      socket.data.joinedRooms.delete(room);
      console.log(`[Hub] User ${user.id} left thread ${threadId}`);
    });

    // ==========================================================================
    // Typing Events (Ephemeral - direct socket, no Redis)
    // ==========================================================================

    socket.on('typing:start', ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit('thread:typing', {
        threadId,
        userId: user.id,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit('thread:typing', {
        threadId,
        userId: user.id,
        isTyping: false,
      });
    });

    // ==========================================================================
    // WhatsApp Events
    // ==========================================================================

    // Join a specific channel's room to receive updates
    socket.on('join:whatsapp', ({ channelId }) => {
      const room = `whatsapp:${channelId}`;
      socket.join(room);
      socket.data.joinedRooms.add(room);
      console.log(`[Hub] User ${user.id} joined WhatsApp channel ${channelId}`);
    });

    // Leave a channel's room
    socket.on('leave:whatsapp', ({ channelId }) => {
      const room = `whatsapp:${channelId}`;
      socket.leave(room);
      socket.data.joinedRooms.delete(room);
      console.log(`[Hub] User ${user.id} left WhatsApp channel ${channelId}`);
    });

    // Join global WhatsApp watchers room (for alerts)
    socket.on('join:whatsapp:watchers', () => {
      socket.join('whatsapp:watchers');
      socket.data.joinedRooms.add('whatsapp:watchers');
      console.log(`[Hub] User ${user.id} joined WhatsApp watchers`);
    });

    // Leave global WhatsApp watchers room
    socket.on('leave:whatsapp:watchers', () => {
      socket.leave('whatsapp:watchers');
      socket.data.joinedRooms.delete('whatsapp:watchers');
      console.log(`[Hub] User ${user.id} left WhatsApp watchers`);
    });

    // ==========================================================================
    // Disconnection
    // ==========================================================================

    socket.on('disconnect', (reason) => {
      console.log(`[Hub] User ${user.id} disconnected: ${reason}`);

      // Grace period handling would be managed by Backbone
      // After grace period, Backbone publishes presence:changed to Redis
    });
  });

  console.log('[Hub] Namespace configured');
}
