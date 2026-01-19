import { metrics } from './collector.js';
import { storage } from './storage/index.js';
import { runProbes, runDeepProbes } from './probes/index.js';
import type {
  ModuleHealth,
  HealthStatus,
  MetricsSnapshot,
  HistoricalMetric,
} from './types.js';

const MODULE_METRICS: Record<string, string[]> = {
  infrastructure: [
    'db.connections.active',
    'db.query.latency',
    'db.query.errors',
    'redis.ping.latency',
    'redis.memory.used',
    'llm.request.latency',
    'llm.request.errors',
    'llm.tokens.input',
    'llm.tokens.output',
  ],
  services: [
    'notifications.created',
    'notifications.delivered',
    'notifications.latency.create',
    'notifications.errors',
  ],
  agents: [
    'agent.triager.invocations',
    'agent.triager.latency',
    'agent.triager.errors',
    'agent.copilot.invocations',
    'agent.copilot.latency',
    'agent.copilot.errors',
  ],
  actions: [
    'actions.registered',
    'actions.executed',
    'actions.success',
    'actions.errors',
    'actions.permission_denied',
    'actions.latency',
  ],
  knowledge: [
    'knowledge.search.queries',
    'knowledge.search.latency',
    'knowledge.search.empty',
    'knowledge.documents.total',
    'knowledge.index.operations',
  ],
};

function determineStatus(metricName: string, value: number): HealthStatus {
  // Define thresholds
  const thresholds: Record<string, { warning: number; critical: number }> = {
    'db.query.latency': { warning: 300, critical: 500 },
    'redis.ping.latency': { warning: 30, critical: 50 },
    'llm.request.latency': { warning: 3000, critical: 5000 },
  };

  const threshold = thresholds[metricName];
  if (!threshold) return 'healthy';

  if (value >= threshold.critical) return 'unhealthy';
  if (value >= threshold.warning) return 'degraded';
  return 'healthy';
}

export async function getModuleHealth(moduleName: string): Promise<ModuleHealth> {
  const metricNames = MODULE_METRICS[moduleName] ?? [];
  const snapshot = metrics.getSnapshot();
  const errors = await storage.getErrors(moduleName);

  const moduleMetrics: Record<string, unknown> = {};
  let overallStatus: HealthStatus = 'healthy';

  for (const name of metricNames) {
    const metric = snapshot[name]?.[0];
    if (metric) {
      moduleMetrics[name] = metric;

      if (metric.type === 'histogram') {
        const status = determineStatus(name, metric.p95);
        if (status === 'unhealthy') overallStatus = 'unhealthy';
        else if (status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      }
    }
  }

  // Check error counts
  const totalErrors = errors.reduce((sum, e) => sum + e.count, 0);
  if (totalErrors > 10) overallStatus = 'unhealthy';
  else if (totalErrors > 0 && overallStatus === 'healthy') {
    overallStatus = 'degraded';
  }

  return {
    name: moduleName,
    status: overallStatus,
    metrics: moduleMetrics as Record<string, never>,
    errors,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getAllModulesHealth(): Promise<Record<string, ModuleHealth>> {
  const modules = Object.keys(MODULE_METRICS);
  const results = await Promise.all(modules.map(getModuleHealth));
  return Object.fromEntries(modules.map((name, i) => [name, results[i]]));
}

export async function getSystemHealth() {
  const probes = await runProbes({ deep: false });
  const allHealthy = probes.every((p) => p.healthy);
  const anyDegraded = probes.some((p) => !p.healthy);

  const status: HealthStatus = allHealthy ? 'healthy' : anyDegraded ? 'degraded' : 'unhealthy';

  // Server stats
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const cpuPercent = Math.round((cpuUsage.user + cpuUsage.system) / 1000 / metrics.getUptime()) / 10;

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: metrics.getUptime(),
    version: process.env.npm_package_version ?? '0.0.0',
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV ?? 'development',
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
      cpu: cpuPercent,
    },
    components: Object.fromEntries(
      probes.map((p) => [
        p.name,
        {
          status: p.healthy ? 'healthy' : 'unhealthy',
          latency: p.latency,
          message: p.message,
        },
      ])
    ),
  };
}

export async function getDeepHealth() {
  const probes = await runDeepProbes();
  const allHealthy = probes.every((p) => p.healthy);

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: metrics.getUptime(),
    components: Object.fromEntries(
      probes.map((p) => [
        p.name,
        {
          status: p.healthy ? 'healthy' : 'unhealthy',
          latency: p.latency,
          message: p.message,
          details: p.details,
        },
      ])
    ),
  };
}

export async function getHistoricalMetrics(options: {
  metric?: string;
  period?: string;
  from?: Date;
  to?: Date;
}): Promise<{ metrics: HistoricalMetric[] }> {
  const { metric, period = '1h', from, to } = options;

  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 60 * 60 * 1000);

  if (metric) {
    const points = await storage.getPoints(metric, from ?? defaultFrom, to ?? now);
    return {
      metrics: [{ name: metric, points, aggregation: 'avg' }],
    };
  }

  // Return all tracked metrics
  const snapshots = await storage.getSnapshots(period, from ?? defaultFrom, to ?? now);

  const metricsMap = new Map<string, HistoricalMetric>();

  for (const snapshot of snapshots) {
    for (const [name, health] of Object.entries(snapshot.modules)) {
      for (const [metricName, metricValue] of Object.entries(health.metrics)) {
        if (!metricsMap.has(metricName)) {
          metricsMap.set(metricName, { name: metricName, points: [], aggregation: 'avg' });
        }

        const value = typeof metricValue === 'object' && 'value' in (metricValue as object)
          ? (metricValue as { value: number }).value
          : 0;

        metricsMap.get(metricName)!.points.push({
          timestamp: snapshot.timestamp,
          value,
        });
      }
    }
  }

  return { metrics: Array.from(metricsMap.values()) };
}

export function getMetricsSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    metrics: metrics.getSnapshot(),
  };
}
