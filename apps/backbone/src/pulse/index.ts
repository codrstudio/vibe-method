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
  AlertChannel,
  AlertConditionType,
  AlertCondition,
  AlertConfig,
  CreateAlertInput,
  AlertEvent,
  OpenRouterCredits,
  OpenRouterUsage,
  OpenRouterDetails,
  OllamaModel,
  OllamaLoadedModel,
  OllamaDetails,
  PulseOverview,
} from './types.js';

// Metrics collector
export {
  metrics,
  incCounter,
  setGauge,
  incGauge,
  decGauge,
  observeHistogram,
  timeAsync,
  startTimer,
} from './metrics/collector.js';

// Metrics storage
export { storage } from './metrics/storage.js';

// Probes
export {
  runProbes,
  runDeepProbes,
  runProbe,
  getProbeNames,
} from './probes/index.js';

// Service functions
export {
  getPulseOverview,
  getAllProbes,
  getProbe,
  listProbes,
  getLlmHealth,
  getOpenRouterHealth,
  getOllamaHealth,
  getModuleHealth,
  getAllModulesHealth,
  getMetricsSnapshot,
  getHistoricalMetrics,
} from './service.js';

// Alerts
export { alertRepository } from './alerts/repository.js';
export { evaluateAlerts, triggerManualAlert, resolveAlert } from './alerts/emitter.js';
export { registerConnection as registerSseConnection, getConnectionCount } from './alerts/channels/ui.channel.js';
export {
  AlertConfigSchema,
  CreateAlertSchema,
  UpdateAlertSchema,
  AlertConditionSchema,
} from './alerts/types.js';
