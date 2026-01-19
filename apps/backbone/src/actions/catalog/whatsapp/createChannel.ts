import { z } from 'zod';
import { registry } from '../../registry.js';
import { whatsappService, ChannelSchema } from '../../../services/whatsapp/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const outputSchema = z.object({
  channel: ChannelSchema,
});

export const createChannel: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'whatsapp.createChannel',
  description: 'Registra um novo numero WhatsApp criando instancia Evolution',
  keywords: ['whatsapp', 'criar', 'registrar', 'numero', 'canal', 'evolution', 'create'],
  inputSchema,
  outputSchema,
  permissions: ['whatsapp:write'],

  async execute(input, context) {
    const channel = await whatsappService.createChannel({
      name: input.name,
      description: input.description,
      createdBy: context.userId,
    });

    return { channel };
  },
};

registry.register(createChannel);
