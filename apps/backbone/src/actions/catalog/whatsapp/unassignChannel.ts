import { z } from 'zod';
import { registry } from '../../registry.js';
import { whatsappService } from '../../../services/whatsapp/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  assignmentId: z.string().uuid(),
});

const outputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const unassignChannel: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'whatsapp.unassignChannel',
  description: 'Remove a atribuicao de um numero WhatsApp de uma operacao',
  keywords: ['whatsapp', 'remover', 'desatribuir', 'unassign', 'desvincular'],
  inputSchema,
  outputSchema,
  permissions: ['whatsapp:write'],

  async execute(input) {
    await whatsappService.unassignChannel(input.assignmentId);

    return {
      success: true,
      message: 'Assignment removed successfully',
    };
  },
};

registry.register(unassignChannel);
