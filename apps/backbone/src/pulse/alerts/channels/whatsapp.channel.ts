import { config } from '../../../config.js';
import type { AlertEvent, ChannelResult } from '../types.js';

interface WhatsAppMessage {
  number: string;
  text: string;
}

async function sendWhatsApp(message: WhatsAppMessage): Promise<void> {
  if (!config.EVOLUTION_API_URL || !config.EVOLUTION_API_KEY) {
    throw new Error('Evolution API not configured');
  }

  const response = await fetch(`${config.EVOLUTION_API_URL}/message/sendText/pulse-alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: message.number,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Evolution API error: ${response.status} - ${error}`);
  }
}

function buildAlertMessage(event: AlertEvent): string {
  const statusEmoji = event.status === 'triggered' ? '🚨' : '✅';
  const statusLabel = event.status === 'triggered' ? 'ALERTA' : 'RESOLVIDO';

  let message = `${statusEmoji} *[${statusLabel}] ${event.alertName}*\n\n`;
  message += `📍 *Condição:* ${event.condition.type}\n`;
  message += `🎯 *Alvo:* ${event.condition.target}\n`;
  message += `🕐 *Horário:* ${new Date(event.triggeredAt).toLocaleString('pt-BR')}\n`;

  if (event.resolvedAt) {
    message += `✅ *Resolvido em:* ${new Date(event.resolvedAt).toLocaleString('pt-BR')}\n`;
  }

  if (event.details) {
    message += `\n📋 *Detalhes:*\n${JSON.stringify(event.details, null, 2)}`;
  }

  message += `\n\n_${config.APP_NAME} Pulse Monitor_`;

  return message;
}

export async function sendWhatsAppAlert(
  event: AlertEvent,
  recipients: string[]
): Promise<ChannelResult> {
  if (recipients.length === 0) {
    return {
      channel: 'whatsapp',
      success: false,
      error: 'No recipients specified',
    };
  }

  try {
    const text = buildAlertMessage(event);
    const errors: string[] = [];

    for (const number of recipients) {
      try {
        await sendWhatsApp({ number, text });
      } catch (err) {
        errors.push(`${number}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (errors.length === recipients.length) {
      return {
        channel: 'whatsapp',
        success: false,
        error: errors.join('; '),
      };
    }

    return {
      channel: 'whatsapp',
      success: true,
      error: errors.length > 0 ? `Partial failure: ${errors.join('; ')}` : undefined,
    };
  } catch (error) {
    return {
      channel: 'whatsapp',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
