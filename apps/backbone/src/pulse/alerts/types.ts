import { z } from 'zod';

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

export const UpdateAlertSchema = CreateAlertSchema.partial();
export type UpdateAlertInput = z.infer<typeof UpdateAlertSchema>;

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

export interface ChannelResult {
  channel: AlertChannel;
  success: boolean;
  error?: string;
}
