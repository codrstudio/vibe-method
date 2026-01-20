import { z } from 'zod';
import { registry } from '../../registry.js';
import * as notificationService from '../../../services/notifications/service.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  taskId: z.string().uuid(),
});

const outputSchema = z.object({
  id: z.string().uuid(),
  closedAt: z.string(),
});

export const taskClose: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'task.close',
  description: 'Fecha uma task (requer estar em estado permitido)',
  keywords: ['task', 'fechar', 'encerrar', 'close', 'finish', 'complete'],
  inputSchema,
  outputSchema,
  permissions: ['task:close'],

  async execute(input) {
    const task = await notificationService.closeTask(input.taskId);

    return {
      id: task.id,
      closedAt: task.closedAt!,
    };
  },
};

registry.register(taskClose);
