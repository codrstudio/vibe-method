import type { FastifyPluginAsync } from 'fastify';
import { notificationsRoutes } from './notifications.js';
import { messagesRoutes } from './messages.js';
import { tasksRoutes } from './tasks.js';

export const servicesRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(notificationsRoutes);
  await fastify.register(messagesRoutes);
  await fastify.register(tasksRoutes);
};
