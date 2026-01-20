import { z } from 'zod';
import { registry } from '../../registry.js';
import * as schedulerService from '../../../services/scheduler/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  id: z.string().uuid(),
});

const outputSchema = z.object({
  deleted: z.boolean(),
});

export const schedulerDelete: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'scheduler.delete',
  description: 'Remove um job agendado',
  keywords: ['scheduler', 'job', 'deletar', 'remover', 'delete', 'remove'],
  inputSchema,
  outputSchema,
  permissions: ['scheduler:delete'],

  async execute(input) {
    const deleted = await schedulerService.deleteJob(input.id);

    return { deleted };
  },
};

registry.register(schedulerDelete);
