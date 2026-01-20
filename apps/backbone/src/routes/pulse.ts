import type { FastifyPluginAsync } from 'fastify';
import {
  getPulseOverview,
  getAllProbes,
  getProbe,
  listProbes,
  getLlmHealth,
  getOpenRouterHealth,
  getOllamaHealth,
  getAllModulesHealth,
  getMetricsSnapshot,
  getHistoricalMetrics,
  alertRepository,
  registerSseConnection,
  CreateAlertSchema,
  UpdateAlertSchema,
} from '../pulse/index.js';

export const pulseRoutes: FastifyPluginAsync = async (fastify) => {
  // ============================================================
  // OVERVIEW
  // ============================================================

  fastify.get('/pulse', async (_request, reply) => {
    const overview = await getPulseOverview();
    return reply.send(overview);
  });

  // ============================================================
  // PROBES
  // ============================================================

  fastify.get('/pulse/probes', async (_request, reply) => {
    const probes = await getAllProbes(false);
    return reply.send({
      timestamp: new Date().toISOString(),
      probes,
    });
  });

  fastify.get('/pulse/probes/deep', async (_request, reply) => {
    const probes = await getAllProbes(true);
    return reply.send({
      timestamp: new Date().toISOString(),
      probes,
    });
  });

  fastify.get('/pulse/probes/list', async (_request, reply) => {
    const names = listProbes();
    return reply.send({ probes: names });
  });

  fastify.get<{ Params: { name: string }; Querystring: { deep?: string } }>(
    '/pulse/probes/:name',
    async (request, reply) => {
      const { name } = request.params;
      const deep = request.query.deep === 'true';

      const probe = await getProbe(name, deep);
      if (!probe) {
        return reply.status(404).send({ error: `Probe '${name}' not found` });
      }

      return reply.send({
        timestamp: new Date().toISOString(),
        probe,
      });
    }
  );

  // ============================================================
  // LLM HEALTH
  // ============================================================

  fastify.get('/pulse/llm', async (_request, reply) => {
    const health = await getLlmHealth();
    return reply.send(health);
  });

  fastify.get('/pulse/llm/openrouter', async (_request, reply) => {
    const health = await getOpenRouterHealth();
    return reply.send(health);
  });

  fastify.get('/pulse/llm/ollama', async (_request, reply) => {
    const health = await getOllamaHealth();
    return reply.send(health);
  });

  // ============================================================
  // MODULES
  // ============================================================

  fastify.get('/pulse/modules', async (_request, reply) => {
    const modules = await getAllModulesHealth();
    return reply.send({
      timestamp: new Date().toISOString(),
      modules,
    });
  });

  // ============================================================
  // METRICS
  // ============================================================

  fastify.get('/pulse/metrics', async (_request, reply) => {
    const snapshot = getMetricsSnapshot();
    return reply.send(snapshot);
  });

  fastify.get<{
    Querystring: {
      metric?: string;
      period?: '1m' | '5m' | '1h' | '24h';
      from?: string;
      to?: string;
    };
  }>('/pulse/metrics/history', async (request, reply) => {
    const { metric, period, from, to } = request.query;

    const history = await getHistoricalMetrics({
      metric,
      period,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });

    return reply.send(history);
  });

  // ============================================================
  // ALERTS
  // ============================================================

  fastify.get('/pulse/alerts', async (_request, reply) => {
    const alerts = await alertRepository.getAll();
    const events = await alertRepository.getRecentEvents(20);

    return reply.send({
      timestamp: new Date().toISOString(),
      alerts,
      recentEvents: events,
    });
  });

  fastify.get<{ Params: { id: string } }>('/pulse/alerts/:id', async (request, reply) => {
    const { id } = request.params;
    const alert = await alertRepository.getById(id);

    if (!alert) {
      return reply.status(404).send({ error: 'Alert not found' });
    }

    const events = await alertRepository.getEvents(id, 50);
    return reply.send({ alert, events });
  });

  fastify.post('/pulse/alerts', async (request, reply) => {
    const result = CreateAlertSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Invalid input', details: result.error.format() });
    }

    const alert = await alertRepository.create(result.data);
    return reply.status(201).send(alert);
  });

  fastify.put<{ Params: { id: string } }>('/pulse/alerts/:id', async (request, reply) => {
    const { id } = request.params;
    const result = UpdateAlertSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({ error: 'Invalid input', details: result.error.format() });
    }

    const alert = await alertRepository.update(id, result.data);
    if (!alert) {
      return reply.status(404).send({ error: 'Alert not found' });
    }

    return reply.send(alert);
  });

  fastify.delete<{ Params: { id: string } }>('/pulse/alerts/:id', async (request, reply) => {
    const { id } = request.params;
    const deleted = await alertRepository.delete(id);

    if (!deleted) {
      return reply.status(404).send({ error: 'Alert not found' });
    }

    return reply.status(204).send();
  });

  // ============================================================
  // REAL-TIME EVENTS (SSE)
  // ============================================================

  fastify.get('/pulse/events', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Send initial state
    const overview = await getPulseOverview();
    reply.raw.write(`data: ${JSON.stringify({ type: 'snapshot', data: overview })}\n\n`);

    // Register for alert events
    const unregister = registerSseConnection((event) => {
      reply.raw.write(`data: ${JSON.stringify({ type: 'alert', data: event })}\n\n`);
    });

    // Periodic updates
    const interval = setInterval(async () => {
      const update = await getPulseOverview();
      reply.raw.write(`data: ${JSON.stringify({ type: 'update', data: update })}\n\n`);
    }, 5000);

    request.raw.on('close', () => {
      clearInterval(interval);
      unregister();
    });
  });
};
