import { z } from 'zod';
import { registry } from '../../registry.js';
import * as schedulerService from '../../../services/scheduler/index.js';
import { scheduledJobInputSchema } from '../../../services/scheduler/types.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = scheduledJobInputSchema.extend({
  createdBy: z.string().uuid().optional(),
}).refine(data => data.cronExpression || data.repeatEveryMs, {
  message: 'Either cronExpression or repeatEveryMs must be provided',
});

const outputSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  nextRunAt: z.string().nullable(),
});

export const schedulerCreate: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'scheduler.create',
  description: 'Cria um novo job agendado',
  keywords: ['scheduler', 'job', 'criar', 'agendar', 'cron', 'create', 'new'],
  inputSchema,
  outputSchema,
  permissions: ['scheduler:create'],

  async execute(input) {
    const { createdBy, ...data } = input;
    const job = await schedulerService.createJob(data, createdBy);

    return {
      id: job.id,
      slug: job.slug,
      name: job.name,
      enabled: job.enabled,
      nextRunAt: job.nextRunAt,
    };
  },
};

registry.register(schedulerCreate);
