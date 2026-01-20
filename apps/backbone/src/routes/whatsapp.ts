import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { whatsappService } from '../services/whatsapp/service.js';
import { channelsRepository } from '../services/whatsapp/repository.js';
import { handleEvolutionWebhook } from '../services/whatsapp/index.js';
import { config } from '../config.js';
import type { EvolutionWebhookPayload } from '../services/whatsapp/types.js';

// =============================================================================
// Schemas
// =============================================================================

const CreateChannelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  provider: z.enum(['evolution', 'simulator']).optional(),
});

const CreateAssignmentSchema = z.object({
  channelId: z.string().uuid(),
  operationId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  priority: z.number().int().min(0).optional(),
  notificationEmail: z.string().email().optional(),
  notificationPhone: z.string().optional(),
});

const SendMessageSchema = z.object({
  operationSlug: z.string().min(1),
  to: z.string().min(1),
  text: z.string().min(1),
  userId: z.string().uuid().optional(),
});

const TestMessageSchema = z.object({
  channelId: z.string().uuid(),
  to: z.string().min(1),
  text: z.string().min(1),
});

const TestModesSchema = z.object({
  echoEnabled: z.boolean().optional(),
  echoToNumber: z.string().nullable().optional(),
  redirectToNumber: z.string().nullable().optional(),
});

const WebhookPayloadSchema = z.object({
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

export const whatsappRoutes: FastifyPluginAsync = async (fastify) => {
  // ===========================================================================
  // WEBHOOK (receives events from Evolution API or wa-sim)
  // ===========================================================================

  /**
   * POST /backbone/whatsapp/webhook
   * Unified webhook endpoint for Evolution API and wa-sim
   */
  fastify.post<{
    Body: unknown;
    Headers: { 'x-api-key'?: string; apikey?: string };
  }>('/webhook', async (request, reply) => {
    // Validate webhook secret
    const apiKey =
      request.headers['x-api-key'] ||
      request.headers['apikey'] ||
      (request.body as Record<string, unknown>)?.apikey;

    if (config.EVOLUTION_API_KEY && apiKey !== config.EVOLUTION_API_KEY) {
      fastify.log.warn('Invalid webhook API key received');
      return reply.unauthorized('Invalid API key');
    }

    // Validate payload
    const result = WebhookPayloadSchema.safeParse(request.body);

    if (!result.success) {
      fastify.log.error('Invalid webhook payload:', result.error.format());
      return reply.badRequest('Invalid webhook payload');
    }

    const payload = result.data as EvolutionWebhookPayload;

    fastify.log.info(`[WhatsApp Webhook] Event: ${payload.event}, Instance: ${payload.instance}`);

    // Process webhook asynchronously
    handleEvolutionWebhook(payload).catch((error) => {
      fastify.log.error('Error processing webhook:', error);
    });

    // Return immediately to acknowledge receipt
    return reply.send({ received: true });
  });

  // ===========================================================================
  // CHANNELS
  // ===========================================================================

  /**
   * GET /backbone/whatsapp/channels
   * List all WhatsApp channels
   */
  fastify.get('/channels', async (_request, reply) => {
    const channels = await whatsappService.listChannels();
    return reply.send({ data: { channels } });
  });

  /**
   * POST /backbone/whatsapp/channels
   * Create a new WhatsApp channel
   */
  fastify.post('/channels', async (request, reply) => {
    const result = CreateChannelSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Invalid input', details: result.error.format() });
    }

    const userId = request.headers['x-user-id'] as string | undefined;

    try {
      const channel = await whatsappService.createChannel({
        ...result.data,
        createdBy: userId,
      });
      return reply.status(201).send({ data: { channel } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create channel';
      return reply.status(500).send({ error: message });
    }
  });

  /**
   * GET /backbone/whatsapp/channels/:id
   * Get channel by ID with assignments
   */
  fastify.get<{ Params: { id: string } }>('/channels/:id', async (request, reply) => {
    const { id } = request.params;
    const channel = await whatsappService.getChannel(id);

    if (!channel) {
      return reply.status(404).send({ error: 'Channel not found' });
    }

    // Channel already includes assignments from service
    return reply.send({ data: channel });
  });

  /**
   * DELETE /backbone/whatsapp/channels/:id
   * Delete a channel
   */
  fastify.delete<{ Params: { id: string } }>('/channels/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      await whatsappService.deleteChannel(id);
      return reply.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete channel';
      if (message === 'Channel not found') {
        return reply.status(404).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  /**
   * POST /backbone/whatsapp/channels/:id/qr
   * Refresh QR code for a channel
   */
  fastify.post<{ Params: { id: string } }>('/channels/:id/qr', async (request, reply) => {
    const { id } = request.params;

    try {
      await whatsappService.refreshQrCode(id);
      return reply.send({ success: true, message: 'QR code refresh initiated' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh QR code';
      if (message === 'Channel not found') {
        return reply.status(404).send({ error: message });
      }
      if (message === 'Channel is already connected') {
        return reply.status(400).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  /**
   * POST /backbone/whatsapp/channels/:id/disconnect
   * Disconnect (logout) a channel without deleting
   */
  fastify.post<{ Params: { id: string } }>('/channels/:id/disconnect', async (request, reply) => {
    const { id } = request.params;

    try {
      await whatsappService.disconnectChannel(id);
      return reply.send({ success: true, message: 'Channel disconnected' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect channel';
      if (message === 'Channel not found') {
        return reply.status(404).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  /**
   * GET /backbone/whatsapp/channels/:id/qr
   * Get current QR code for a channel
   */
  fastify.get<{ Params: { id: string } }>('/channels/:id/qr', async (request, reply) => {
    const { id } = request.params;

    try {
      const qrData = await whatsappService.getQrCode(id);
      return reply.send({ data: qrData });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get QR code';
      if (message === 'Channel not found') {
        return reply.status(404).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  /**
   * GET /backbone/whatsapp/channels/:id/events
   * Get channel event history
   */
  fastify.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/channels/:id/events',
    async (request, reply) => {
      const { id } = request.params;
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;

      try {
        const events = await whatsappService.getChannelEvents(id, limit);
        return reply.send({ data: { events } });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get events';
        return reply.status(500).send({ error: message });
      }
    }
  );

  /**
   * PATCH /backbone/whatsapp/channels/:id/test-modes
   * Update channel test modes (echo, echo-to, redirect)
   */
  fastify.patch<{ Params: { id: string } }>('/channels/:id/test-modes', async (request, reply) => {
    const { id } = request.params;
    const result = TestModesSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({ error: 'Invalid input', details: result.error.format() });
    }

    try {
      const channel = await channelsRepository.updateTestModes(id, result.data);
      if (!channel) {
        return reply.status(404).send({ error: 'Channel not found' });
      }
      return reply.send({ data: { channel } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update test modes';
      return reply.status(500).send({ error: message });
    }
  });

  // ===========================================================================
  // OPERATIONS
  // ===========================================================================

  /**
   * GET /backbone/whatsapp/operations
   * List all operations
   */
  fastify.get('/operations', async (_request, reply) => {
    const operations = await whatsappService.listOperations();
    return reply.send({ data: { operations } });
  });

  /**
   * GET /backbone/whatsapp/operations/:slug
   * Get operation by slug with assigned channels
   */
  fastify.get<{ Params: { slug: string } }>('/operations/:slug', async (request, reply) => {
    const { slug } = request.params;
    const operation = await whatsappService.getOperationBySlug(slug);

    if (!operation) {
      return reply.status(404).send({ error: 'Operation not found' });
    }

    return reply.send({ data: operation });
  });

  // ===========================================================================
  // ASSIGNMENTS
  // ===========================================================================

  /**
   * POST /backbone/whatsapp/assignments
   * Assign a channel to an operation
   */
  fastify.post('/assignments', async (request, reply) => {
    const result = CreateAssignmentSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Invalid input', details: result.error.format() });
    }

    try {
      const assignment = await whatsappService.assignChannel(result.data);
      return reply.status(201).send({ data: { assignment } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create assignment';
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      return reply.status(400).send({ error: message });
    }
  });

  /**
   * DELETE /backbone/whatsapp/assignments/:id
   * Remove an assignment
   */
  fastify.delete<{ Params: { id: string } }>('/assignments/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      await whatsappService.unassignChannel(id);
      return reply.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete assignment';
      if (message === 'Assignment not found') {
        return reply.status(404).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  // ===========================================================================
  // MESSAGING
  // ===========================================================================

  /**
   * POST /backbone/whatsapp/send
   * Send message through operation's channel
   */
  fastify.post('/send', async (request, reply) => {
    const result = SendMessageSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Invalid input', details: result.error.format() });
    }

    try {
      const { operationSlug, to, text, userId } = result.data;
      const response = await whatsappService.sendMessage(operationSlug, to, text, userId);
      return reply.send({ data: response });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      return reply.status(500).send({ error: message });
    }
  });

  /**
   * POST /backbone/whatsapp/test
   * Send test message through a specific channel
   */
  fastify.post('/test', async (request, reply) => {
    const result = TestMessageSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Invalid input', details: result.error.format() });
    }

    try {
      const { channelId, to, text } = result.data;
      const response = await whatsappService.sendTestMessage(channelId, to, text);
      return reply.send({ data: response });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send test message';
      if (message === 'Channel not found') {
        return reply.status(404).send({ error: message });
      }
      if (message === 'Channel is not connected') {
        return reply.status(400).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  // ===========================================================================
  // HEALTH
  // ===========================================================================

  /**
   * GET /backbone/whatsapp/health
   * Check Evolution API health
   */
  fastify.get('/health', async (_request, reply) => {
    const healthy = await whatsappService.checkHealth();
    return reply.send({ healthy });
  });

  /**
   * POST /backbone/whatsapp/sync
   * Sync all channel statuses with Evolution
   */
  fastify.post('/sync', async (_request, reply) => {
    try {
      await whatsappService.syncAllChannels();
      return reply.send({ success: true, message: 'All channels synced' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync channels';
      return reply.status(500).send({ error: message });
    }
  });
};
