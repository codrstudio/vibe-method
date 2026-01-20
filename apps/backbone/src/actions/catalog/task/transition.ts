import { z } from 'zod';
import { registry } from '../../registry.js';
import * as notificationService from '../../../services/notifications/service.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  taskId: z.string().uuid(),
  targetTag: z.string().min(1),
});

const outputSchema = z.object({
  id: z.string().uuid(),
  fromTags: z.array(z.string()),
  toTag: z.string(),
  currentTags: z.array(z.string()),
});

export const taskTransition: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'task.transition',
  description: 'Transiciona uma task para um novo estado/tag',
  keywords: ['task', 'transicao', 'mover', 'transition', 'move', 'estado', 'state'],
  inputSchema,
  outputSchema,
  permissions: ['task:transition'],

  async execute(input) {
    const result = await notificationService.transitionTask(input.taskId, input.targetTag);

    return {
      id: result.task.id,
      fromTags: result.fromTags,
      toTag: result.toTag,
      currentTags: result.task.tags,
    };
  },
};

registry.register(taskTransition);
