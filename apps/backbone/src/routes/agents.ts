import type { FastifyPluginAsync } from 'fastify';
import { invokeTriager, invokeCopilot, TriagerInputSchema, CopilotInputSchema } from '../agents/index.js';

export const agentsRoutes: FastifyPluginAsync = async (fastify) => {
  // TODO: Add auth middleware to get context from token
  const getContext = (request: { headers: { 'x-user-id'?: string } }) => ({
    userId: request.headers['x-user-id'] ?? 'anonymous',
  });

  // Invoke triager
  fastify.post<{ Body: unknown }>('/triager/invoke', async (request, reply) => {
    const result = TriagerInputSchema.safeParse(request.body);

    if (!result.success) {
      return reply.badRequest(result.error.message);
    }

    const context = getContext(request);
    const response = await invokeTriager(result.data, context);

    if (!response.success) {
      return reply.status(500).send({ error: response.error });
    }

    return reply.send({ data: response.data });
  });

  // Invoke copilot
  fastify.post<{ Body: unknown }>('/copilot/invoke', async (request, reply) => {
    const result = CopilotInputSchema.safeParse(request.body);

    if (!result.success) {
      return reply.badRequest(result.error.message);
    }

    const context = getContext(request);
    const response = await invokeCopilot(result.data, context);

    if (!response.success) {
      return reply.status(500).send({ error: response.error });
    }

    return reply.send({ data: response.data });
  });

  // Webhook for external messages
  fastify.post<{
    Body: { source: string; body: string; metadata?: Record<string, unknown> };
  }>('/webhook/message', async (request, reply) => {
    const { source, body, metadata } = request.body;

    if (!source || !body) {
      return reply.badRequest('Source and body are required');
    }

    const context = { userId: `external:${source}` };
    const response = await invokeTriager(
      { body, authorType: 'external', metadata },
      context
    );

    if (!response.success) {
      return reply.status(500).send({ error: response.error });
    }

    return reply.send({ data: response.data });
  });
};
