import { z } from 'zod';
import { registry } from '../../registry.js';
import * as schedulerService from '../../../services/scheduler/index.js';
import { scheduledJobUpdateSchema } from '../../../services/scheduler/types.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  id: z.string().uuid(),
  data: scheduledJobUpdateSchema,
});

const outputSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  cronExpression: z.string(),
  nextRunAt: z.string().nullable(),
});

export const schedulerUpdate: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'scheduler.update',
  description: 'Atualiza um job agendado',
  keywords: ['scheduler', 'job', 'atualizar', 'update', 'edit', 'editar'],
  inputSchema,
  outputSchema,
  permissions: ['scheduler:update'],

  async execute(input) {
    const job = await schedulerService.updateJob(input.id, input.data);

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      id: job.id,
      slug: job.slug,
      name: job.name,
      enabled: job.enabled,
      cronExpression: job.cronExpression,
      nextRunAt: job.nextRunAt,
    };
  },
};

registry.register(schedulerUpdate);
