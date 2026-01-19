import { randomUUID } from 'crypto';
import { alertRepository } from './repository.js';
import { sendUiAlert } from './channels/ui.channel.js';
import { sendEmailAlert } from './channels/email.channel.js';
import { sendWhatsAppAlert } from './channels/whatsapp.channel.js';
import type { AlertConfig, AlertEvent, AlertCondition, ChannelResult } from './types.js';
import type { ProbeResult } from '../types.js';
import { metrics } from '../metrics/collector.js';

interface EvaluationContext {
  probes: Map<string, ProbeResult>;
  metrics: ReturnType<typeof metrics.getSnapshot>;
}

function evaluateCondition(condition: AlertCondition, context: EvaluationContext): boolean {
  const { type, target, operator, value } = condition;

  if (type === 'probe.unhealthy') {
    const probe = context.probes.get(target);
    return probe ? !probe.healthy : false;
  }

  if (type === 'probe.degraded') {
    const probe = context.probes.get(target);
    // Consider degraded if not healthy but has a message
    return probe ? !probe.healthy && !!probe.message : false;
  }

  if (type === 'metric.threshold' && operator && value !== undefined) {
    const metricData = context.metrics[target]?.[0];
    if (!metricData) return false;

    const metricValue = 'value' in metricData ? metricData.value : 0;

    switch (operator) {
      case 'gt':
        return metricValue > value;
      case 'gte':
        return metricValue >= value;
      case 'lt':
        return metricValue < value;
      case 'lte':
        return metricValue <= value;
      case 'eq':
        return metricValue === value;
      case 'ne':
        return metricValue !== value;
      default:
        return false;
    }
  }

  return false;
}

async function sendToChannels(
  event: AlertEvent,
  alert: AlertConfig
): Promise<ChannelResult[]> {
  const results: ChannelResult[] = [];

  for (const channel of alert.channels) {
    switch (channel) {
      case 'ui':
        results.push(await sendUiAlert(event));
        break;
      case 'email':
        results.push(await sendEmailAlert(event, alert.recipients ?? []));
        break;
      case 'whatsapp':
        results.push(await sendWhatsAppAlert(event, alert.recipients ?? []));
        break;
    }
  }

  return results;
}

export async function evaluateAlerts(context: EvaluationContext): Promise<void> {
  const alerts = await alertRepository.getEnabled();

  for (const alert of alerts) {
    const shouldTrigger = evaluateCondition(alert.condition, context);
    const onCooldown = await alertRepository.isOnCooldown(alert.id);

    if (shouldTrigger && !onCooldown) {
      const event: AlertEvent = {
        id: randomUUID(),
        alertId: alert.id,
        alertName: alert.name,
        condition: alert.condition,
        triggeredAt: new Date().toISOString(),
        channels: alert.channels,
        status: 'triggered',
        details: {
          probe: context.probes.get(alert.condition.target),
        },
      };

      await alertRepository.recordEvent(event);
      await alertRepository.setCooldown(alert.id, alert.cooldown);
      await sendToChannels(event, alert);

      // Track metrics
      metrics.incCounter('pulse.alerts.triggered', 1, { alert: alert.name });
    }
  }
}

export async function triggerManualAlert(
  alertId: string,
  details?: Record<string, unknown>
): Promise<AlertEvent | null> {
  const alert = await alertRepository.getById(alertId);
  if (!alert) return null;

  const event: AlertEvent = {
    id: randomUUID(),
    alertId: alert.id,
    alertName: alert.name,
    condition: alert.condition,
    triggeredAt: new Date().toISOString(),
    channels: alert.channels,
    status: 'triggered',
    details,
  };

  await alertRepository.recordEvent(event);
  await sendToChannels(event, alert);

  return event;
}

export async function resolveAlert(
  alertId: string,
  eventId?: string
): Promise<AlertEvent | null> {
  const alert = await alertRepository.getById(alertId);
  if (!alert) return null;

  const events = await alertRepository.getEvents(alertId, 1);
  const lastEvent = events[0];

  if (!lastEvent || lastEvent.status === 'resolved') {
    return null;
  }

  const resolvedEvent: AlertEvent = {
    ...lastEvent,
    id: eventId ?? lastEvent.id,
    resolvedAt: new Date().toISOString(),
    status: 'resolved',
  };

  await alertRepository.recordEvent(resolvedEvent);
  await sendToChannels(resolvedEvent, alert);

  return resolvedEvent;
}

export { alertRepository };
