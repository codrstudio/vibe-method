import { z } from 'zod';

// ============ Zod Schemas ============

export const cronExpressionSchema = z.string().min(9).max(50);

export const scheduledJobInputSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  category: z.string().max(50).default('system'),
  jobTarget: z.string().min(1).max(255),
  jobParams: z.record(z.unknown()).default({}),
  cronExpression: cronExpressionSchema,
  timezone: z.string().max(50).default('America/Sao_Paulo'),
  enabled: z.boolean().default(true),
  timeoutMs: z.number().int().min(1000).max(3600000).default(300000),
  retryAttempts: z.number().int().min(0).max(10).default(3),
  retryDelayMs: z.number().int().min(1000).max(300000).default(5000),
});

export const scheduledJobUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().max(50).optional(),
  jobTarget: z.string().min(1).max(255).optional(),
  jobParams: z.record(z.unknown()).optional(),
  cronExpression: cronExpressionSchema.optional(),
  timezone: z.string().max(50).optional(),
  enabled: z.boolean().optional(),
  timeoutMs: z.number().int().min(1000).max(3600000).optional(),
  retryAttempts: z.number().int().min(0).max(10).optional(),
  retryDelayMs: z.number().int().min(1000).max(300000).optional(),
});

export const jobRunStatusSchema = z.enum(['running', 'completed', 'failed', 'timeout']);

export const triggerTypeSchema = z.enum(['scheduled', 'manual', 'api']);

// ============ TypeScript Types ============

export type ScheduledJobInput = z.infer<typeof scheduledJobInputSchema>;
export type ScheduledJobUpdate = z.infer<typeof scheduledJobUpdateSchema>;
export type JobRunStatus = z.infer<typeof jobRunStatusSchema>;
export type TriggerType = z.infer<typeof triggerTypeSchema>;

export interface ScheduledJob {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  jobTarget: string;
  jobParams: Record<string, unknown>;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  nextRunAt: string | null;
  lastRunId: string | null;
  lastRunAt: string | null;
  lastStatus: JobRunStatus | null;
  lastDurationMs: number | null;
  lastError: string | null;
  runCount: number;
  successCount: number;
  failCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface JobRun {
  id: string;
  jobId: string;
  bullmqJobId: string | null;
  status: JobRunStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  triggerType: TriggerType;
  triggeredBy: string | null;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  attempt: number;
}

export interface JobListOptions {
  category?: string;
  enabled?: boolean;
  limit?: number;
  offset?: number;
}

export interface JobRunListOptions {
  jobId?: string;
  status?: JobRunStatus;
  limit?: number;
  offset?: number;
}

// ============ BullMQ Types ============

export interface SchedulerJobData {
  jobId: string;
  slug: string;
  target: string;
  params: Record<string, unknown>;
  runId: string;
  triggerType: TriggerType;
  triggeredBy?: string;
}

export interface ExecutorResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
}

export type ExecutorFn = (
  params: Record<string, unknown>,
  context: { jobId: string; runId: string; attempt: number }
) => Promise<ExecutorResult>;
