import { z } from 'zod';

// SLA configuration schema
export const SlaConfigSchema = z.object({
  warning: z.string().optional(),
  critical: z.string().optional(),
});

export type SlaConfig = z.infer<typeof SlaConfigSchema>;

// Tag display configuration
export const TagConfigItemSchema = z.object({
  label: z.string(),
  color: z.string(),
  icon: z.string().optional(),
});

export type TagConfigItem = z.infer<typeof TagConfigItemSchema>;

// Transitions: source tag -> array of valid target tags
export const TransitionsSchema = z.record(z.string(), z.array(z.string()));

export type Transitions = z.infer<typeof TransitionsSchema>;

// Main Task Class schema
export const TaskClassSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]*$/, 'Name must be kebab-case'),
  displayName: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$|^[a-z]+$/, 'Color must be hex or named'),
  tags: z.array(z.string()).min(1),
  transitions: TransitionsSchema,
  closeRequires: z.array(z.string()).optional(),
  sla: SlaConfigSchema.optional(),
  component: z.string().nullable().optional(),
  tagConfig: z.record(z.string(), TagConfigItemSchema).optional(),
});

export type TaskClass = z.infer<typeof TaskClassSchema>;

// Workflow definition stored in notifications table
export interface TaskWorkflow {
  className: string;
  transitions: Transitions;
  closeRequires: string[];
  sla?: SlaConfig;
}

// Validation result for transitions
export interface TransitionValidation {
  valid: boolean;
  error?: string;
  allowedTargets?: string[];
}

// Parse duration string to milliseconds
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}
