/**
 * WhatsApp Simulator Webhook Emitter
 * Dispara webhooks para o backbone (mesmo formato que Evolution API)
 */

import { simulatorState } from './state.js'
import type { SimulatedMessage, EvolutionWebhookPayload } from './types.js'

const BACKBONE_WEBHOOK_URL = process.env.BACKBONE_WEBHOOK_URL || 'http://localhost:8002/backbone/webhooks/evolution'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'evolution-key'

async function sendWebhook(payload: EvolutionWebhookPayload): Promise<void> {
  try {
    const response = await fetch(BACKBONE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`[wa-sim] Webhook failed: ${response.status} ${response.statusText}`)
    } else {
      console.log(`[wa-sim] Webhook sent: ${payload.event} for ${payload.instance}`)
    }
  } catch (error) {
    console.error(`[wa-sim] Webhook error:`, error)
  }
}

export const webhookEmitter = {
  async emitQrCodeUpdated(instanceName: string): Promise<void> {
    const instance = simulatorState.getInstance(instanceName)
    if (!instance) return

    await sendWebhook({
      event: 'QRCODE_UPDATED',
      instance: instanceName,
      data: {
        base64: instance.qrCode,
        code: `SIM-${instanceName}`
      }
    })
  },

  async emitConnectionUpdate(instanceName: string, state: 'open' | 'close' | 'connecting', statusReason?: number): Promise<void> {
    await sendWebhook({
      event: 'CONNECTION_UPDATE',
      instance: instanceName,
      data: { state, statusReason }
    })
  },

  async emitMessageUpsert(instanceName: string, message: SimulatedMessage): Promise<void> {
    await sendWebhook({
      event: 'MESSAGES_UPSERT',
      instance: instanceName,
      data: {
        key: {
          id: message.id,
          remoteJid: message.remoteJid,
          fromMe: message.direction === 'outbound'
        },
        message: {
          conversation: message.text
        },
        messageTimestamp: Math.floor(message.timestamp.getTime() / 1000),
        pushName: 'Simulator'
      }
    })
  },

  async emitMessageUpdate(instanceName: string, messageId: string, status: string): Promise<void> {
    await sendWebhook({
      event: 'MESSAGES_UPDATE',
      instance: instanceName,
      data: {
        key: { id: messageId },
        update: { status }
      }
    })
  }
}
