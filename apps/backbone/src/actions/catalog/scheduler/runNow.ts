import { z } from 'zod';
import { registry } from '../../registry.js';
import * as schedulerService from '../../../services/scheduler/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  id: z.string().uuid(),
  triggeredBy: z.string().uuid().optional(),
});

const outputSchema = z.object({
  runId: z.string().uuid(),
  jobId: z.string().uuid(),
  status: z.string(),
  startedAt: z.string(),
});

export const schedulerRunNow: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'scheduler.runNow',
  description: 'Executa um job agendado imediatamente',
  keywords: ['scheduler', 'job', 'executar', 'rodar', 'run', 'execute', 'now', 'manual'],
  inputSchema,
  outputSchema,
  permissions: ['scheduler:execute'],

  async execute(input) {
    const run = await schedulerService.runJobNow(input.id, input.triggeredBy);

    return {
      runId: run.id,
      jobId: run.jobId,
      status: run.status,
      startedAt: typeof run.startedAt === 'string' ? run.startedAt : new Date(run.startedAt).toISOString(),
    };
  },
};

registry.register(schedulerRunNow);
