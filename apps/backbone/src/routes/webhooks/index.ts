import type { FastifyPluginAsync } from 'fastify';
import { evolutionWebhookRoutes } from './evolution.js';

export const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(evolutionWebhookRoutes);
};
