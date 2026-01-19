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

export const refreshQrCode: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'whatsapp.refreshQrCode',
  description: 'Gera um novo QR code para conexao do numero WhatsApp',
  keywords: ['whatsapp', 'qr', 'code', 'refresh', 'atualizar', 'novo', 'reconectar'],
  inputSchema,
  outputSchema,
  permissions: ['whatsapp:write'],

  async execute(input) {
    await whatsappService.refreshQrCode(input.channelId);

    return {
      success: true,
      message: 'QR code refresh requested. New QR will be sent via webhook.',
    };
  },
};

registry.register(refreshQrCode);
