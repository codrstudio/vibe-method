import type { FastifyPluginAsync } from 'fastify';
import {
  createNotification,
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  CreateNotificationSchema,
} from '../../services/notifications/index.js';

export const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  // TODO: Add auth middleware to get userId from token
  const getUserId = (request: { headers: { 'x-user-id'?: string } }) => {
    return request.headers['x-user-id'] ?? 'anonymous';
  };

  // List notifications
  fastify.get<{
    Querystring: { status?: string; limit?: string; offset?: string };
  }>('/notifications', async (request, reply) => {
    const userId = getUserId(request);
    const { status, limit, offset } = request.query;

    const notifications = await getNotifications(userId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return reply.send({ data: notifications });
  });

  // Get unread count
  fastify.get('/notifications/count', async (request, reply) => {
    const userId = getUserId(request);
    const count = await getUnreadCount(userId);

    return reply.send({ data: { count } });
  });

  // Get single notification
  fastify.get<{ Params: { id: string } }>(
    '/notifications/:id',
    async (request, reply) => {
      const notification = await getNotification(request.params.id);

      if (!notification) {
        return reply.notFound('Notification not found');
      }

      return reply.send({ data: notification });
    }
  );

  // Create notification
  fastify.post<{ Body: unknown }>('/notifications', async (request, reply) => {
    const result = CreateNotificationSchema.safeParse(request.body);

    if (!result.success) {
      return reply.badRequest(result.error.message);
    }

    const notification = await createNotification(result.data);

    return reply.status(201).send({ data: notification });
  });

  // Mark as read
  fastify.patch<{ Params: { id: string } }>(
    '/notifications/:id/read',
    async (request, reply) => {
      const userId = getUserId(request);
      const notification = await markAsRead(request.params.id, userId);

      if (!notification) {
        return reply.notFound('Notification not found');
      }

      return reply.send({ data: notification });
    }
  );

  // Mark all as read
  fastify.post('/notifications/read-all', async (request, reply) => {
    const userId = getUserId(request);
    const count = await markAllAsRead(userId);

    return reply.send({ data: { count } });
  });

  // Delete notification
  fastify.delete<{ Params: { id: string } }>(
    '/notifications/:id',
    async (request, reply) => {
      const userId = getUserId(request);
      const deleted = await deleteNotification(request.params.id, userId);

      if (!deleted) {
        return reply.notFound('Notification not found');
      }

      return reply.send({ data: { success: true } });
    }
  );
};
