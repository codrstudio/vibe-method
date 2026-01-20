import { z } from 'zod';
import { registry } from '../../registry.js';
import * as schedulerService from '../../../services/scheduler/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  id: z.string().uuid(),
});

const outputSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  enabled: z.boolean(),
  nextRunAt: z.string().nullable(),
});

export const schedulerResume: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'scheduler.resume',
  description: 'Retoma um job agendado pausado',
  keywords: ['scheduler', 'job', 'retomar', 'continuar', 'resume', 'enable', 'start'],
  inputSchema,
  outputSchema,
  permissions: ['scheduler:update'],

  async execute(input) {
    const job = await schedulerService.resumeJob(input.id);

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      id: job.id,
      slug: job.slug,
      enabled: job.enabled,
      nextRunAt: job.nextRunAt,
    };
  },
};

registry.register(schedulerResume);
