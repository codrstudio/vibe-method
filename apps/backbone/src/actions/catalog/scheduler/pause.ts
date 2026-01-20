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
});

export const schedulerPause: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'scheduler.pause',
  description: 'Pausa um job agendado',
  keywords: ['scheduler', 'job', 'pausar', 'parar', 'pause', 'stop', 'disable'],
  inputSchema,
  outputSchema,
  permissions: ['scheduler:update'],

  async execute(input) {
    const job = await schedulerService.pauseJob(input.id);

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      id: job.id,
      slug: job.slug,
      enabled: job.enabled,
    };
  },
};

registry.register(schedulerPause);
