import { z } from 'zod';
import { registry } from '../../registry.js';
import { whatsappService, AssignmentSchema } from '../../../services/whatsapp/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  channelId: z.string().uuid(),
  operationId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  priority: z.number().int().min(0).default(0),
  notificationEmail: z.string().email().optional(),
  notificationPhone: z.string().max(20).optional(),
});

const outputSchema = z.object({
  assignment: AssignmentSchema,
});

export const assignChannel: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'whatsapp.assignChannel',
  description: 'Atribui um numero WhatsApp a uma operacao (canal)',
  keywords: ['whatsapp', 'atribuir', 'vincular', 'numero', 'operacao', 'assign', 'link'],
  inputSchema,
  outputSchema,
  permissions: ['whatsapp:write'],

  async execute(input) {
    const assignment = await whatsappService.assignChannel({
      channelId: input.channelId,
      operationId: input.operationId,
      userId: input.userId,
      priority: input.priority,
      notificationEmail: input.notificationEmail,
      notificationPhone: input.notificationPhone,
    });

    return { assignment };
  },
};

registry.register(assignChannel);
