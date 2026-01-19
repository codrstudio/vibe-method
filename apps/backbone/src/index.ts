import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { config } from './config.js';

// Routes
import { healthRoutes } from './routes/health.js';
import { pulseRoutes } from './routes/pulse.js';
import { servicesRoutes } from './routes/services/index.js';
import { actionsRoutes } from './routes/actions.js';
import { agentsRoutes } from './routes/agents.js';
import { knowledgeRoutes } from './routes/knowledge.js';
import { authRoutes } from './routes/auth.js';
import { webhooksRoutes } from './routes/webhooks/index.js';
import { whatsappRoutes } from './routes/whatsapp.js';

const app = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? 'info' : 'warn',
  },
});

async function main() {
  // Plugins
  await app.register(cors, { origin: config.CORS_ORIGIN });
  await app.register(sensible);

  // Routes
  await app.register(healthRoutes, { prefix: '/backbone' });
  await app.register(pulseRoutes, { prefix: '/backbone' });
  await app.register(servicesRoutes, { prefix: '/backbone' });
  await app.register(actionsRoutes, { prefix: '/backbone/act' });
  await app.register(agentsRoutes, { prefix: '/backbone/agents' });
  await app.register(knowledgeRoutes, { prefix: '/backbone/kb' });
  await app.register(authRoutes, { prefix: '/backbone/auth' });
  await app.register(webhooksRoutes, { prefix: '/backbone/webhooks' });
  await app.register(whatsappRoutes, { prefix: '/backbone/whatsapp' });

  // Start server
  try {
    await app.listen({ port: config.BACKBONE_PORT, host: config.HOST });
    console.log(`Backbone running at http://${config.HOST}:${config.BACKBONE_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
