import { z } from 'zod';
import { registry } from '../../registry.js';
import { taskClassRegistry } from '../../../services/task-classes/registry.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({});

const taskClassSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  icon: z.string(),
  color: z.string(),
  tags: z.array(z.string()),
  closeRequires: z.array(z.string()).optional(),
});

const outputSchema = z.object({
  classes: z.array(taskClassSchema),
});

export const taskGetClasses: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'task.getClasses',
  description: 'Retorna todas as task classes disponiveis',
  keywords: ['task', 'classes', 'tipos', 'types', 'categorias', 'categories'],
  inputSchema,
  outputSchema,
  permissions: ['task:read'],

  async execute() {
    const classes = taskClassRegistry.getAll();

    return {
      classes: classes.map((c) => ({
        name: c.name,
        displayName: c.displayName,
        description: c.description,
        icon: c.icon,
        color: c.color,
        tags: c.tags,
        closeRequires: c.closeRequires,
      })),
    };
  },
};

registry.register(taskGetClasses);
