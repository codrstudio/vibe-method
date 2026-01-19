import { metrics } from './metrics/collector.js';
import { storage } from './metrics/storage.js';
import { runProbes, runDeepProbes, runProbe, getProbeNames } from './probes/index.js';
import { llmDeepProbe } from './probes/llm.probe.js';
import { ollamaDeepProbe } from './probes/ollama.probe.js';
import type {
  ModuleHealth,
  HealthStatus,
  MetricsSnapshot,
  HistoricalMetric,
  ProbeResult,
  OpenRouterDetails,
  OllamaDetails,
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

// ============================================================
// OVERVIEW
// ============================================================

export async function getPulseOverview() {
  const probes = await runProbes({ deep: false });
  const healthy = probes.filter((p) => p.healthy).length;
  const unhealthy = probes.filter((p) => !p.healthy).length;

  const status: HealthStatus =
    unhealthy === 0 ? 'healthy' : healthy > unhealthy ? 'degraded' : 'unhealthy';

  // Import dynamically to avoid circular deps
  const { alertRepository } = await import('./alerts/repository.js');
  const alerts = await alertRepository.getAll();
  const recentEvents = await alertRepository.getRecentEvents(10);
  const activeAlerts = recentEvents.filter((e) => e.status === 'triggered').length;

  // Server stats
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const cpuPercent = Math.round((cpuUsage.user + cpuUsage.system) / 1000000);

  return {
    timestamp: new Date().toISOString(),
    status,
    uptime: metrics.getUptime(),
    probes: {
      total: probes.length,
      healthy,
      degraded: 0,
      unhealthy,
    },
    alerts: {
      active: activeAlerts,
      configured: alerts.length,
    },
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
  };
}

// ============================================================
// PROBES
// ============================================================

export async function getAllProbes(deep = false): Promise<ProbeResult[]> {
  return deep ? runDeepProbes() : runProbes();
}

export async function getProbe(name: string, deep = false): Promise<ProbeResult | null> {
  return runProbe(name, deep);
}

export function listProbes(): string[] {
  return getProbeNames();
}

// ============================================================
// LLM HEALTH
// ============================================================

export async function getLlmHealth() {
  const [llmResult, ollamaResult] = await Promise.all([
    llmDeepProbe.check(),
    ollamaDeepProbe.check(),
  ]);

  const llmDetails = llmResult.details as OpenRouterDetails | undefined;
  const ollamaDetails = ollamaResult.details as OllamaDetails | undefined;

  let providersHealthy = 0;
  let providers = 0;

  if (llmDetails?.configured) {
    providers++;
    if (llmResult.healthy) providersHealthy++;
  }

  if (ollamaDetails?.available) {
    providers++;
    if (ollamaResult.healthy) providersHealthy++;
  }

  const overallStatus: HealthStatus =
    providersHealthy === providers
      ? 'healthy'
      : providersHealthy > 0
        ? 'degraded'
        : 'unhealthy';

  return {
    timestamp: new Date().toISOString(),
    summary: {
      status: overallStatus,
      providers,
      providersHealthy,
    },
    openrouter: {
      status: llmResult.healthy ? 'healthy' : 'unhealthy',
      latency: Math.round(llmResult.latency),
      message: llmResult.message,
      credits: llmDetails?.credits,
    },
    ollama: {
      status: ollamaResult.healthy ? 'healthy' : 'unhealthy',
      latency: Math.round(ollamaResult.latency),
      message: ollamaResult.message,
      version: ollamaDetails?.version,
      models: ollamaDetails?.modelsInstalled !== undefined
        ? {
            installed: ollamaDetails.modelsInstalled,
            loaded: ollamaDetails.modelsLoaded ?? 0,
          }
        : undefined,
    },
  };
}

export async function getOpenRouterHealth() {
  const result = await llmDeepProbe.check();
  const details = result.details as OpenRouterDetails | undefined;

  return {
    timestamp: new Date().toISOString(),
    status: result.healthy ? 'healthy' : 'unhealthy',
    latency: Math.round(result.latency),
    message: result.message,
    credits: details?.credits,
    usage: details?.usage,
    account: details?.isFreeTier !== undefined ? { isFreeTier: details.isFreeTier } : undefined,
    rateLimit: details?.rateLimit,
    config: {
      baseUrl: details?.baseUrl ?? '',
      defaultModel: details?.defaultModel ?? '',
    },
  };
}

export async function getOllamaHealth() {
  const result = await ollamaDeepProbe.check();
  const details = result.details as OllamaDetails | undefined;

  return {
    timestamp: new Date().toISOString(),
    status: result.healthy ? 'healthy' : 'unhealthy',
    latency: Math.round(result.latency),
    message: result.message,
    version: details?.version,
    models: (details?.models ?? []).map((m) => ({
      name: m.name,
      size: formatBytes(m.size),
      modified: m.modified_at,
    })),
    loaded: (details?.loaded ?? []).map((m) => ({
      name: m.name,
      sizeVram: formatBytes(m.size_vram),
    })),
    config: {
      url: details?.url ?? '',
      available: details?.available ?? false,
      maxParams: details?.config?.maxParams ?? '',
      allowedQuants: details?.config?.allowedQuants ?? [],
    },
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}

// ============================================================
// MODULES
// ============================================================

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

// ============================================================
// METRICS
// ============================================================

export function getMetricsSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    metrics: metrics.getSnapshot(),
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

  const snapshots = await storage.getSnapshots(period, from ?? defaultFrom, to ?? now);

  const metricsMap = new Map<string, HistoricalMetric>();

  for (const snapshot of snapshots) {
    for (const [, health] of Object.entries(snapshot.modules)) {
      for (const [metricName, metricValue] of Object.entries(health.metrics)) {
        if (!metricsMap.has(metricName)) {
          metricsMap.set(metricName, { name: metricName, points: [], aggregation: 'avg' });
        }

        const value =
          typeof metricValue === 'object' && 'value' in (metricValue as object)
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
