import { internalBus, emitToRoom } from '../lib/events.js';
import { incCounter } from './collector.js';
import type { ComponentHealth, HealthStatus } from './types.js';

export const HEALTH_EVENTS = {
  STATUS_CHANGED: 'health:status:changed',
  METRIC_THRESHOLD: 'health:metric:threshold',
  ERROR_SPIKE: 'health:error:spike',
  COMPONENT_DEGRADED: 'health:component:degraded',
  COMPONENT_RECOVERED: 'health:component:recovered',
} as const;

interface HealthEvent {
  type: string;
  timestamp: string;
  data: unknown;
}

export async function emitHealthEvent(
  type: keyof typeof HEALTH_EVENTS,
  data: unknown
): Promise<void> {
  const event: HealthEvent = {
    type: HEALTH_EVENTS[type],
    timestamp: new Date().toISOString(),
    data,
  };

  await internalBus.emit(event.type, event);
  await emitToRoom('health:dashboard', 'health:event', event);
  incCounter('health.events.emitted', 1, { type: event.type });
}

const previousStatus = new Map<string, HealthStatus>();

export function trackComponentHealth(health: ComponentHealth): void {
  const previous = previousStatus.get(health.name);

  if (previous !== health.status) {
    previousStatus.set(health.name, health.status);

    if (health.status === 'unhealthy' || health.status === 'degraded') {
      emitHealthEvent('COMPONENT_DEGRADED', health);
    } else if (previous && health.status === 'healthy') {
      emitHealthEvent('COMPONENT_RECOVERED', health);
    }
  }
}

export function checkThreshold(
  metricName: string,
  value: number,
  threshold: number,
  comparison: 'gt' | 'lt' = 'gt'
): void {
  const exceeded = comparison === 'gt' ? value > threshold : value < threshold;

  if (exceeded) {
    emitHealthEvent('METRIC_THRESHOLD', {
      metric: metricName,
      value,
      threshold,
      comparison,
    });
  }
}
