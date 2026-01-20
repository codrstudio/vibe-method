import { z } from 'zod';
import { registry } from '../../registry.js';
import * as schedulerService from '../../../services/scheduler/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  category: z.string().optional(),
  enabled: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

const jobSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  jobTarget: z.string(),
  cronExpression: z.string(),
  timezone: z.string(),
  enabled: z.boolean(),
  nextRunAt: z.string().nullable(),
  lastRunAt: z.string().nullable(),
  lastStatus: z.string().nullable(),
  runCount: z.number(),
  successCount: z.number(),
  failCount: z.number(),
});

const outputSchema = z.object({
  jobs: z.array(jobSchema),
  count: z.number(),
});

export const schedulerList: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'scheduler.list',
  description: 'Lista todos os jobs agendados',
  keywords: ['scheduler', 'job', 'listar', 'jobs', 'list', 'all'],
  inputSchema,
  outputSchema,
  permissions: ['scheduler:read'],

  async execute(input) {
    const jobs = await schedulerService.listJobs(input);

    const toISOString = (val: unknown): string | null => {
      if (!val) return null;
      if (typeof val === 'string') return val;
      if (val instanceof Date) return val.toISOString();
      return String(val);
    };

    return {
      jobs: jobs.map((job) => ({
        id: job.id,
        name: job.name,
        slug: job.slug,
        description: job.description,
        category: job.category,
        jobTarget: job.jobTarget,
        cronExpression: job.cronExpression,
        timezone: job.timezone,
        enabled: job.enabled,
        nextRunAt: toISOString(job.nextRunAt),
        lastRunAt: toISOString(job.lastRunAt),
        lastStatus: job.lastStatus,
        runCount: job.runCount,
        successCount: job.successCount,
        failCount: job.failCount,
      })),
      count: jobs.length,
    };
  },
};

registry.register(schedulerList);
