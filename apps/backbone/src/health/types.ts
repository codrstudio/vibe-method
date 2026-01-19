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
// ACTION VALIDATION
// ============================================================

export interface ActionValidationResult {
  name: string;
  valid: boolean;
  executionCount: number;
  errorCount: number;
  avgLatency?: number;
  testResult?: {
    success: boolean;
    error?: string;
    duration: number;
  };
}

export interface ActionValidationReport {
  timestamp: string;
  totalActions: number;
  validActions: number;
  results: ActionValidationResult[];
}

// ============================================================
// API RESPONSE SCHEMAS
// ============================================================

export const HealthOverviewSchema = z.object({
  status: HealthStatusEnum,
  timestamp: z.string(),
  uptime: z.number(),
  version: z.string(),
  components: z.record(
    z.object({
      status: HealthStatusEnum,
      latency: z.number().optional(),
      message: z.string().optional(),
    })
  ),
});

export type HealthOverview = z.infer<typeof HealthOverviewSchema>;
