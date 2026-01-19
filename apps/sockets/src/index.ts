/**
 * Socket Server Entry Point
 *
 * Standalone socket server following REALTIME.md architecture.
 * Receives business events via Redis Pub/Sub from Backbone.
 * Exposes health endpoints via HTTP server.
 */

import { createSocketServer, subscribeToRedisEvents, shutdownServer } from './server/index.js';
import { setupHubNamespace } from './namespaces/hub.js';
import { setupPortalNamespace } from './namespaces/portal.js';
import { setupAdminNamespace } from './namespaces/admin.js';
import { initializeRegistry, createHealthServer } from './health/index.js';
import { metricsMiddleware } from './server/middleware/metrics.js';
import { config } from './config.js';

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('[Socket] Starting server...');
  console.log(`[Socket] Environment: ${config.environment}`);
  console.log(`[Socket] Port: ${config.port}`);
  console.log(`[Socket] Health Port: ${config.port}`);
  console.log('='.repeat(60));

  // Create server with Redis adapter
  const context = await createSocketServer();
  const { io, pubClient, subClient } = context;

  // Initialize metrics registry
  initializeRegistry(io, pubClient);
  console.log('[Socket] Metrics registry initialized');

  // Setup namespaces
  const hubNamespace = io.of('/hub');
  const portalNamespace = io.of('/portal');
  const adminNamespace = io.of('/admin');

  // Apply metrics middleware to all namespaces
  hubNamespace.use(metricsMiddleware);
  portalNamespace.use(metricsMiddleware);
  adminNamespace.use(metricsMiddleware);

  setupHubNamespace(hubNamespace);
  setupPortalNamespace(portalNamespace);
  setupAdminNamespace(adminNamespace);

  // Subscribe to Redis events from Backbone
  subscribeToRedisEvents(subClient, io, 'socket:events');

  // Create and start health HTTP server
  const healthServer = createHealthServer(io);
  healthServer.listen(config.port, () => {
    console.log(`[Socket] Health endpoints available on port ${config.port}`);
    console.log(`[Socket]   GET /health - Basic health check`);
    console.log(`[Socket]   GET /health/ready - Readiness probe`);
    console.log(`[Socket]   GET /health/live - Liveness probe`);
    console.log(`[Socket]   GET /metrics - Full metrics`);
    console.log(`[Socket]   GET /admin/connections - Active connections`);
    console.log(`[Socket]   GET /admin/rooms - Room list`);
  });

  // Attach Socket.io to the HTTP server
  io.attach(healthServer);

  console.log(`[Socket] Server listening on port ${config.port}`);
  console.log(`[Socket] Namespaces: /hub, /portal, /admin`);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[Socket] Received ${signal}, shutting down gracefully...`);
    healthServer.close();
    await shutdownServer(context);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Unhandled errors
  process.on('uncaughtException', (error) => {
    console.error('[Socket] Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[Socket] Unhandled rejection:', reason);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('[Socket] Failed to start:', error);
  process.exit(1);
});
