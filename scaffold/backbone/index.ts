/**
 * BACKBONE - Main Server
 *
 * Servidor Fastify que expoe endpoints para webhooks e health check.
 * Customize os endpoints conforme seu projeto.
 */

import Fastify from 'fastify';
import { config } from './config.js';
import { WebhookMessageSchema } from './types.js';
import { handleMessage } from './workflows/message-handler.js';
import { startScheduler, getSchedulerStatus } from './jobs/scheduler.js';
import { healthCheck as dbHealthCheck } from './db/index.js';

// =============================================================================
// SERVER SETUP
// =============================================================================

const server = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: config.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

server.get('/health', async (_request, reply) => {
  const dbHealth = await dbHealthCheck();
  const scheduler = getSchedulerStatus();

  const healthy = dbHealth.ok && scheduler.jobsRunning;

  return reply
    .status(healthy ? 200 : 503)
    .send({
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth,
        scheduler,
      },
    });
});

// =============================================================================
// WEBHOOK ENDPOINT
// =============================================================================

/**
 * POST /webhook/message
 *
 * Endpoint exemplo para receber mensagens.
 * Customize conforme seu gateway (WhatsApp, Telegram, etc).
 */
server.post('/webhook/message', async (request, reply) => {
  // Validar payload
  const parsed = WebhookMessageSchema.safeParse(request.body);

  if (!parsed.success) {
    server.log.warn({ errors: parsed.error.flatten() }, 'Invalid webhook payload');
    return reply.status(400).send({
      code: 400,
      message: 'Invalid payload',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { phone, name, message, timestamp } = parsed.data;

  server.log.info({ phone, name, messagePreview: message.substring(0, 50) }, 'Message received');

  // Processar em background (nao bloqueia a resposta)
  handleMessage({ phone, name, message, timestamp }).catch((error) => {
    server.log.error({ error, phone }, 'Failed to handle message');
  });

  // Resposta imediata
  return reply.status(200).send({
    code: 200,
    data: { accepted: true },
  });
});

// =============================================================================
// START SERVER
// =============================================================================

async function start() {
  try {
    // Iniciar scheduler de jobs
    startScheduler();

    // Iniciar servidor
    await server.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });

    console.log(`Backbone running on port ${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`LLM Model: ${config.OPENROUTER_DEFAULT_MODEL}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await server.close();
  process.exit(0);
});

start();
