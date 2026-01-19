import { z } from 'zod';
import { registry } from '../../registry.js';
import { whatsappService } from '../../../services/whatsapp/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  channelId: z.string().uuid(),
});

const outputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const deleteChannel: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'whatsapp.deleteChannel',
  description: 'Remove um numero WhatsApp e sua instancia Evolution',
  keywords: ['whatsapp', 'deletar', 'remover', 'numero', 'canal', 'excluir', 'delete'],
  inputSchema,
  outputSchema,
  permissions: ['whatsapp:delete'],

  async execute(input) {
    await whatsappService.deleteChannel(input.channelId);

    return {
      success: true,
      message: 'Channel deleted successfully',
    };
  },
};

registry.register(deleteChannel);
