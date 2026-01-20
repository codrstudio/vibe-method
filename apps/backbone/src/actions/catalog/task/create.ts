import { z } from 'zod';
import { registry } from '../../registry.js';
import * as notificationService from '../../../services/notifications/service.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  class: z.string().min(1),
  title: z.string().min(1).max(255),
  message: z.string(),
  userId: z.string().uuid(),
  assigneeId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  actionUrl: z.string().url().optional(),
  dueAt: z.string().datetime().optional(),
});

const outputSchema = z.object({
  id: z.string().uuid(),
  class: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
});

export const taskCreate: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'task.create',
  description: 'Cria uma nova task a partir de uma task class',
  keywords: ['task', 'criar', 'nova', 'create', 'new', 'tarefa'],
  inputSchema,
  outputSchema,
  permissions: ['task:create'],

  async execute(input) {
    const task = await notificationService.createTask(input);

    return {
      id: task.id,
      class: task.class,
      title: task.title,
      tags: task.tags,
    };
  },
};

registry.register(taskCreate);
