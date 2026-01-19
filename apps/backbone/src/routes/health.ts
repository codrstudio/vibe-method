import type { FastifyPluginAsync } from 'fastify';
import { metrics, runProbes } from '../pulse/index.js';

/**
 * Health routes for Kubernetes probes
 *
 * These are lightweight endpoints for k8s liveness/readiness checks.
 * For detailed monitoring, use /backbone/pulse/* endpoints.
 */
export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // ============================================================
  // KUBERNETES PROBES
  // ============================================================

  /**
   * Liveness probe - is the process running?
   * Used by k8s to detect hung processes
   */
  fastify.get('/health/live', async (_request, reply) => {
    return reply.send({
      live: true,
      uptime: metrics.getUptime(),
    });
  });

  /**
   * Readiness probe - can the service handle requests?
   * Used by k8s to know when to route traffic
   */
  fastify.get('/health/ready', async (_request, reply) => {
    const probes = await runProbes({ deep: false });
    const ready = probes.every((p) => p.healthy);

    return reply.status(ready ? 200 : 503).send({
      ready,
      checks: probes.map((p) => ({
        name: p.name,
        healthy: p.healthy,
        latency: p.latency,
      })),
    });
  });

  /**
   * Simple health check - redirect to Pulse for detailed info
   */
  fastify.get('/health', async (_request, reply) => {
    return reply.redirect('/backbone/pulse');
  });
};
