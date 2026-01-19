// Types
export type {
  MetricType,
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  Metric,
  HealthStatus,
  ComponentHealth,
  SystemHealth,
  ProbeResult,
  HealthProbe,
  ModuleHealth,
  ErrorSummary,
  MetricsSnapshot,
  TimeSeriesPoint,
  HistoricalMetric,
  ActionValidationResult,
  ActionValidationReport,
  HealthOverview,
} from './types.js';

// Collector
export {
  metrics,
  incCounter,
  setGauge,
  incGauge,
  decGauge,
  observeHistogram,
  timeAsync,
  startTimer,
} from './collector.js';

// Storage
export { storage } from './storage/index.js';

// Probes
export { runProbes, runDeepProbes } from './probes/index.js';

// Service
export {
  getModuleHealth,
  getAllModulesHealth,
  getSystemHealth,
  getDeepHealth,
  getHistoricalMetrics,
  getMetricsSnapshot,
} from './service.js';

// Events
export {
  HEALTH_EVENTS,
  emitHealthEvent,
  trackComponentHealth,
  checkThreshold,
} from './events.js';

// Validators
export { validateAllActions } from './validators/actions.js';
