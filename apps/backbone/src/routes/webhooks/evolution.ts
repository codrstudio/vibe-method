import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../../config.js';
import { handleEvolutionWebhook } from '../../services/whatsapp/index.js';
import type { EvolutionWebhookPayload } from '../../services/whatsapp/types.js';

// =============================================================================
// Schema Validation
// =============================================================================

const webhookPayloadSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: z.record(z.unknown()),
  date_time: z.string().optional(),
  sender: z.string().optional(),
  server_url: z.string().optional(),
  apikey: z.string().optional(),
});

// =============================================================================
// Routes
// =============================================================================

export const evolutionWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Evolution API Webhook Endpoint
   * Receives events from Evolution API (QR code, connection status, messages)
   */
  fastify.post<{
    Body: unknown;
    Headers: { 'x-api-key'?: string; apikey?: string };
  }>('/evolution', async (request, reply) => {
    // Validate webhook secret (Evolution sends it as apikey header or in body)
    const apiKey =
      request.headers['x-api-key'] ||
      request.headers['apikey'] ||
      (request.body as Record<string, unknown>)?.apikey;

    if (config.EVOLUTION_API_KEY && apiKey !== config.EVOLUTION_API_KEY) {
      fastify.log.warn('Invalid webhook API key received');
      return reply.unauthorized('Invalid API key');
    }

    // Validate payload
    const result = webhookPayloadSchema.safeParse(request.body);

    if (!result.success) {
      fastify.log.error('Invalid webhook payload:', result.error.format());
      return reply.badRequest('Invalid webhook payload');
    }

    const payload = result.data as EvolutionWebhookPayload;

    fastify.log.info(`[Evolution Webhook] Event: ${payload.event}, Instance: ${payload.instance}`);

    // Process webhook asynchronously
    handleEvolutionWebhook(payload).catch((error) => {
      fastify.log.error('Error processing webhook:', error);
    });

    // Return immediately to acknowledge receipt
    return reply.send({ received: true });
  });

  /**
   * Health check for webhook endpoint
   */
  fastify.get('/evolution/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      evolutionConfigured: Boolean(config.EVOLUTION_API_URL && config.EVOLUTION_API_KEY),
    });
  });
};
