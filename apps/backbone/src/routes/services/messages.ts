import type { FastifyPluginAsync } from 'fastify';
import {
  templatesService,
  messagesService,
  UpdateTemplateSchema,
  PreviewTemplateSchema,
  SendMessageSchema,
} from '../../services/messages/index.js';

export const messagesRoutes: FastifyPluginAsync = async (fastify) => {
  // TODO: Add auth middleware to get userId from token
  const getUserId = (request: { headers: { 'x-user-id'?: string } }) => {
    return request.headers['x-user-id'];
  };

  // ==========================================================================
  // Templates Endpoints
  // ==========================================================================

  // List all templates
  fastify.get<{
    Querystring: { category?: string };
  }>('/messages/templates', async (request, reply) => {
    const { category } = request.query;

    const templates = category
      ? await templatesService.listByCategory(category)
      : await templatesService.list();

    return reply.send({ data: templates });
  });

  // Get single template
  fastify.get<{ Params: { id: string } }>(
    '/messages/templates/:id',
    async (request, reply) => {
      const template = await templatesService.get(request.params.id);

      if (!template) {
        return reply.notFound('Template not found');
      }

      return reply.send({ data: template });
    }
  );

  // Update template
  fastify.put<{ Params: { id: string }; Body: unknown }>(
    '/messages/templates/:id',
    async (request, reply) => {
      const result = UpdateTemplateSchema.safeParse(request.body);

      if (!result.success) {
        return reply.badRequest(result.error.message);
      }

      const userId = getUserId(request);
      const template = await templatesService.update(
        request.params.id,
        result.data,
        userId
      );

      if (!template) {
        return reply.notFound('Template not found');
      }

      return reply.send({ data: template });
    }
  );

  // Reset template to default
  fastify.post<{ Params: { id: string } }>(
    '/messages/templates/:id/reset',
    async (request, reply) => {
      const success = await templatesService.reset(request.params.id);

      if (!success) {
        return reply.notFound('Template not found');
      }

      return reply.send({ data: { success: true } });
    }
  );

  // Preview template
  fastify.post<{ Params: { id: string }; Body: unknown }>(
    '/messages/templates/:id/preview',
    async (request, reply) => {
      const body = request.body as Record<string, unknown>;

      const input = {
        templateId: request.params.id,
        channel: (body.channel as string) || 'email',
        variables: (body.variables as Record<string, string>) || {},
      };

      const result = PreviewTemplateSchema.safeParse(input);

      if (!result.success) {
        return reply.badRequest(result.error.message);
      }

      const preview = await templatesService.preview(result.data);

      if (!preview) {
        return reply.notFound('Template not found or channel not enabled');
      }

      return reply.send({ data: preview });
    }
  );

  // ==========================================================================
  // Send Message Endpoint
  // ==========================================================================

  // Send message using template
  fastify.post<{ Body: unknown }>('/messages/send', async (request, reply) => {
    const result = SendMessageSchema.safeParse(request.body);

    if (!result.success) {
      return reply.badRequest(result.error.message);
    }

    const sendResult = await messagesService.send(result.data);

    if (!sendResult.success) {
      return reply.status(500).send({
        error: sendResult.error,
        logId: sendResult.logId,
      });
    }

    return reply.send({
      data: {
        success: true,
        logId: sendResult.logId,
        messageId: sendResult.messageId,
      },
    });
  });
};
