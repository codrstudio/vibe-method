import { z } from 'zod';
import { registry } from '../../registry.js';
import * as notificationService from '../../../services/notifications/service.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  userId: z.string().uuid(),
  class: z.string().optional(),
  tag: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(['open', 'closed']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

const taskItemSchema = z.object({
  id: z.string().uuid(),
  class: z.string(),
  title: z.string(),
  message: z.string(),
  tags: z.array(z.string()),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  assigneeId: z.string().nullable(),
  dueAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  createdAt: z.string(),
});

const outputSchema = z.object({
  tasks: z.array(taskItemSchema),
  count: z.number(),
});

export const taskList: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'task.list',
  description: 'Lista tasks de um usuario com filtros',
  keywords: ['task', 'listar', 'list', 'buscar', 'search', 'tarefas'],
  inputSchema,
  outputSchema,
  permissions: ['task:read'],

  async execute(input) {
    const tasks = await notificationService.getTasks(input.userId, {
      class: input.class,
      tag: input.tag,
      assigneeId: input.assigneeId,
      status: input.status,
      limit: input.limit,
      offset: input.offset,
    });

    return {
      tasks: tasks.map((t) => ({
        id: t.id,
        class: t.class,
        title: t.title,
        message: t.message,
        tags: t.tags,
        color: t.color,
        icon: t.icon,
        assigneeId: t.assigneeId,
        dueAt: t.dueAt,
        closedAt: t.closedAt,
        createdAt: t.createdAt,
      })),
      count: tasks.length,
    };
  },
};

registry.register(taskList);
