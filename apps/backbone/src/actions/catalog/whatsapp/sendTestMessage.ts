import { z } from 'zod';
import { registry } from '../../registry.js';
import { whatsappService } from '../../../services/whatsapp/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  channelId: z.string().uuid(),
  to: z.string().min(10).max(20),
  text: z.string().min(1).max(4096),
});

const outputSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
});

export const sendTestMessage: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'whatsapp.sendTestMessage',
  description: 'Envia uma mensagem de teste atraves de um numero WhatsApp',
  keywords: ['whatsapp', 'enviar', 'mensagem', 'teste', 'send', 'message', 'test'],
  inputSchema,
  outputSchema,
  permissions: ['whatsapp:send'],

  async execute(input) {
    const result = await whatsappService.sendTestMessage(
      input.channelId,
      input.to,
      input.text
    );

    return {
      success: true,
      messageId: result.messageId,
    };
  },
};

registry.register(sendTestMessage);
