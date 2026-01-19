import { z } from 'zod';
import { registry } from '../../registry.js';
import { whatsappService, ChannelSchema } from '../../../services/whatsapp/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  status: z.enum(['disconnected', 'qr_pending', 'connecting', 'connected', 'degraded']).optional(),
});

const outputSchema = z.object({
  channels: z.array(ChannelSchema),
  total: z.number(),
});

export const listChannels: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'whatsapp.listChannels',
  description: 'Lista todos os numeros WhatsApp registrados',
  keywords: ['whatsapp', 'listar', 'numeros', 'canais', 'channels', 'list'],
  inputSchema,
  outputSchema,
  permissions: ['whatsapp:read'],

  async execute(input) {
    const channels = await whatsappService.listChannels();

    const filtered = input.status
      ? channels.filter((c) => c.status === input.status)
      : channels;

    return {
      channels: filtered,
      total: filtered.length,
    };
  },
};

registry.register(listChannels);
