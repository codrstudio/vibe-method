import { z } from 'zod';
import { registry } from '../../registry.js';
import * as schedulerService from '../../../services/scheduler/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
}).refine((data) => data.id || data.slug, {
  message: 'Either id or slug must be provided',
});

const outputSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  jobTarget: z.string(),
  jobParams: z.record(z.unknown()),
  cronExpression: z.string(),
  timezone: z.string(),
  enabled: z.boolean(),
  timeoutMs: z.number(),
  retryAttempts: z.number(),
  retryDelayMs: z.number(),
  nextRunAt: z.string().nullable(),
  lastRunId: z.string().nullable(),
  lastRunAt: z.string().nullable(),
  lastStatus: z.string().nullable(),
  lastDurationMs: z.number().nullable(),
  lastError: z.string().nullable(),
  runCount: z.number(),
  successCount: z.number(),
  failCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const schedulerGet: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'scheduler.get',
  description: 'Obtém detalhes de um job agendado',
  keywords: ['scheduler', 'job', 'obter', 'detalhes', 'get', 'detail', 'info'],
  inputSchema,
  outputSchema,
  permissions: ['scheduler:read'],

  async execute(input) {
    let job;

    if (input.id) {
      job = await schedulerService.getJob(input.id);
    } else if (input.slug) {
      job = await schedulerService.getJobBySlug(input.slug);
    }

    if (!job) {
      throw new Error('Job not found');
    }

    const toISOString = (val: unknown): string | null => {
      if (!val) return null;
      if (typeof val === 'string') return val;
      if (val instanceof Date) return val.toISOString();
      return String(val);
    };

    return {
      id: job.id,
      name: job.name,
      slug: job.slug,
      description: job.description,
      category: job.category,
      jobTarget: job.jobTarget,
      jobParams: job.jobParams,
      cronExpression: job.cronExpression,
      timezone: job.timezone,
      enabled: job.enabled,
      timeoutMs: job.timeoutMs,
      retryAttempts: job.retryAttempts,
      retryDelayMs: job.retryDelayMs,
      nextRunAt: toISOString(job.nextRunAt),
      lastRunId: job.lastRunId,
      lastRunAt: toISOString(job.lastRunAt),
      lastStatus: job.lastStatus,
      lastDurationMs: job.lastDurationMs,
      lastError: job.lastError,
      runCount: job.runCount,
      successCount: job.successCount,
      failCount: job.failCount,
      createdAt: toISOString(job.createdAt) ?? '',
      updatedAt: toISOString(job.updatedAt) ?? '',
    };
  },
};

registry.register(schedulerGet);
