import { z } from 'zod';
import { registry } from '../../registry.js';
import { whatsappService } from '../../../services/whatsapp/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  channelId: z.string().uuid(),
});

const outputSchema = z.object({
  qrCode: z.string().nullable(),
  expiresAt: z.string().nullable(),
  status: z.string(),
});

export const getQrCode: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'whatsapp.getQrCode',
  description: 'Obtem o QR code atual para conexao de um numero WhatsApp',
  keywords: ['whatsapp', 'qr', 'code', 'qrcode', 'conectar', 'escanear'],
  inputSchema,
  outputSchema,
  permissions: ['whatsapp:read'],

  async execute(input) {
    const channel = await whatsappService.getChannel(input.channelId);

    if (!channel) {
      throw new Error('Channel not found');
    }

    const qrData = await whatsappService.getQrCode(input.channelId);

    return {
      qrCode: qrData?.qrCode ?? channel.qrCode,
      expiresAt: qrData?.expiresAt ?? channel.qrCodeExpiresAt,
      status: channel.status,
    };
  },
};

registry.register(getQrCode);
