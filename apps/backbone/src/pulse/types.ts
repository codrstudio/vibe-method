import { z } from 'zod';

// ============================================================
// METRIC TYPES
// ============================================================

export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface CounterMetric {
  type: 'counter';
  value: number;
  labels?: Record<string, string>;
}

export interface GaugeMetric {
  type: 'gauge';
  value: number;
  labels?: Record<string, string>;
}

export interface HistogramMetric {
  type: 'histogram';
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  buckets: Record<string, number>;
  labels?: Record<string, string>;
}

export type Metric = CounterMetric | GaugeMetric | HistogramMetric;

// ============================================================
// HEALTH STATUS
// ============================================================

export const HealthStatusEnum = z.enum(['healthy', 'degraded', 'unhealthy']);
export type HealthStatus = z.infer<typeof HealthStatusEnum>;

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latency?: number;
  message?: string;
  details?: Record<string, unknown>;
  checkedAt: string;
}

export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  components: Record<string, ComponentHealth>;
}

// ============================================================
// PROBE TYPES
// ============================================================

export interface ProbeResult {
  name: string;
  healthy: boolean;
  latency: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthProbe {
  name: string;
  isDeep?: boolean;
  check: () => Promise<ProbeResult>;
}

// ============================================================
// MODULE HEALTH
// ============================================================

export interface ModuleHealth {
  name: string;
  status: HealthStatus;
  metrics: Record<string, Metric>;
  errors: ErrorSummary[];
  lastUpdated: string;
}

export interface ErrorSummary {
  type: string;
  count: number;
  lastOccurred: string;
  lastMessage?: string;
}

// ============================================================
// METRICS SNAPSHOT
// ============================================================

export interface MetricsSnapshot {
  timestamp: string;
  period: string;
  modules: Record<string, ModuleHealth>;
}

// ============================================================
// HISTORICAL METRICS
// ============================================================

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface HistoricalMetric {
  name: string;
  points: TimeSeriesPoint[];
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'last';
}

// ============================================================
// ALERT TYPES
// ============================================================

export const AlertChannelEnum = z.enum(['ui', 'email', 'whatsapp']);
export type AlertChannel = z.infer<typeof AlertChannelEnum>;

export const AlertConditionTypeEnum = z.enum([
  'probe.unhealthy',
  'probe.degraded',
  'metric.threshold',
  'metric.change',
]);
export type AlertConditionType = z.infer<typeof AlertConditionTypeEnum>;

export const AlertConditionSchema = z.object({
  type: AlertConditionTypeEnum,
  target: z.string(), // probe name or metric name
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'ne']).optional(),
  value: z.number().optional(),
  duration: z.number().optional(), // seconds to wait before alerting
});
export type AlertCondition = z.infer<typeof AlertConditionSchema>;

export const AlertConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  condition: AlertConditionSchema,
  channels: z.array(AlertChannelEnum),
  recipients: z.array(z.string()).optional(), // emails or phone numbers
  cooldown: z.number().default(300), // seconds between alerts
  enabled: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AlertConfig = z.infer<typeof AlertConfigSchema>;

export const CreateAlertSchema = AlertConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;

export interface AlertEvent {
  id: string;
  alertId: string;
  alertName: string;
  condition: AlertCondition;
  triggeredAt: string;
  resolvedAt?: string;
  channels: AlertChannel[];
  status: 'triggered' | 'resolved' | 'acknowledged';
  details?: Record<string, unknown>;
}

// ============================================================
// LLM SPECIFIC TYPES
// ============================================================

export interface OpenRouterCredits {
  remaining: number;
  limit: number | null;
  percentUsed: number | null;
}

export interface OpenRouterUsage {
  total: number;
}

export interface OpenRouterDetails {
  baseUrl: string;
  defaultModel: string;
  configured: boolean;
  credits?: OpenRouterCredits;
  usage?: OpenRouterUsage;
  isFreeTier?: boolean;
  rateLimit?: {
    requests: number;
    interval: string;
  };
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface OllamaLoadedModel {
  name: string;
  model: string;
  size: number;
  size_vram: number;
  digest: string;
  expires_at: string;
}

export interface OllamaDetails {
  available: boolean;
  url: string;
  version?: string;
  modelsInstalled?: number;
  modelsLoaded?: number;
  models?: OllamaModel[];
  loaded?: OllamaLoadedModel[];
  config?: {
    maxParams: string;
    allowedQuants: string[];
  };
}

export interface LLMSanityDetails {
  inference?: {
    success: boolean;
    response?: string;
    model: string;
    provider: string;
    latencyMs: number;
    error?: string;
  };
  bindings: {
    configured: number;
    intents: string[];
  };
}

// ============================================================
// API RESPONSE SCHEMAS
// ============================================================

export const PulseOverviewSchema = z.object({
  timestamp: z.string(),
  status: HealthStatusEnum,
  uptime: z.number(),
  probes: z.object({
    total: z.number(),
    healthy: z.number(),
    degraded: z.number(),
    unhealthy: z.number(),
  }),
  alerts: z.object({
    active: z.number(),
    configured: z.number(),
  }),
});
export type PulseOverview = z.infer<typeof PulseOverviewSchema>;
