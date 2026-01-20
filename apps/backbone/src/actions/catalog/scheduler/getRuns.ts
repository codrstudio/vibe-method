import { z } from 'zod';
import { registry } from '../../registry.js';
import * as schedulerService from '../../../services/scheduler/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  jobId: z.string().uuid().optional(),
  status: z.enum(['running', 'completed', 'failed', 'timeout']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

const runSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  bullmqJobId: z.string().nullable(),
  status: z.string(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  durationMs: z.number().nullable(),
  triggerType: z.string(),
  triggeredBy: z.string().nullable(),
  output: z.record(z.unknown()).nullable(),
  errorMessage: z.string().nullable(),
  attempt: z.number(),
});

const outputSchema = z.object({
  runs: z.array(runSchema),
  count: z.number(),
});

export const schedulerGetRuns: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'scheduler.getRuns',
  description: 'Lista o histórico de execuções de jobs',
  keywords: ['scheduler', 'job', 'runs', 'history', 'execuções', 'histórico'],
  inputSchema,
  outputSchema,
  permissions: ['scheduler:read'],

  async execute(input) {
    const runs = await schedulerService.getJobRuns(input);

    const toISOString = (val: unknown): string | null => {
      if (!val) return null;
      if (typeof val === 'string') return val;
      if (val instanceof Date) return val.toISOString();
      return String(val);
    };

    return {
      runs: runs.map((run) => ({
        id: run.id,
        jobId: run.jobId,
        bullmqJobId: run.bullmqJobId,
        status: run.status,
        startedAt: toISOString(run.startedAt) ?? '',
        completedAt: toISOString(run.completedAt),
        durationMs: run.durationMs,
        triggerType: run.triggerType,
        triggeredBy: run.triggeredBy,
        output: run.output,
        errorMessage: run.errorMessage,
        attempt: run.attempt,
      })),
      count: runs.length,
    };
  },
};

registry.register(schedulerGetRuns);
