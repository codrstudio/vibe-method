import type { FastifyPluginAsync } from 'fastify';
import { registry, executeAction } from '../actions/index.js';

export const actionsRoutes: FastifyPluginAsync = async (fastify) => {
  // TODO: Add auth middleware to get context from token
  const getContext = (request: { headers: { 'x-user-id'?: string } }) => ({
    userId: request.headers['x-user-id'] ?? 'anonymous',
    userRole: 'user',
    permissions: ['*'], // TODO: Get from auth
  });

  // Get action catalog
  fastify.get('/catalog', async (_request, reply) => {
    const catalog = registry.getCatalog();
    return reply.send({ data: catalog });
  });

  // Search actions
  fastify.get<{ Querystring: { q: string } }>('/search', async (request, reply) => {
    const { q } = request.query;

    if (!q) {
      return reply.badRequest('Query parameter "q" is required');
    }

    const results = registry.search(q);
    return reply.send({ data: results });
  });

  // Execute action
  fastify.post<{
    Body: { action: string; params: Record<string, unknown> };
  }>('/execute', async (request, reply) => {
    const { action, params } = request.body;

    if (!action) {
      return reply.badRequest('Action name is required');
    }

    const context = getContext(request);
    const result = await executeAction(action, params, context);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send({ data: result.data });
  });
};
