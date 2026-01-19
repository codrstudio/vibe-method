/**
 * WhatsApp Simulator API
 * Fake Evolution API - mesma interface que Evolution real
 */

import { simulatorState } from './state.js'
import { webhookEmitter } from './webhook-emitter.js'

export const simulatorApi = {
  async createInstance(instanceName: string, _webhookUrl: string, channelId?: string) {
    const instance = simulatorState.createInstance(instanceName, channelId)

    // Emite QR code após pequeno delay (simula comportamento real)
    setTimeout(() => {
      webhookEmitter.emitQrCodeUpdated(instanceName)
    }, 500)

    console.log(`[wa-sim] Instance created: ${instanceName}`)

    return {
      instanceId: instance.instanceId,
      instanceName: instance.instanceName
    }
  },

  async getConnectionStatus(instanceName: string) {
    const instance = simulatorState.getInstance(instanceName)
    if (!instance) throw new Error('Instance not found')

    const stateMap: Record<string, string> = {
      'qr_pending': 'close',
      'connecting': 'connecting',
      'connected': 'open',
      'disconnected': 'close'
    }

    return { state: stateMap[instance.status] }
  },

  async getQrCode(instanceName: string) {
    const instance = simulatorState.getInstance(instanceName)
    if (!instance) throw new Error('Instance not found')

    if (instance.status === 'connected') {
      throw new Error('Already connected')
    }

    // Refresh QR se expirado
    if (!instance.qrCode || (instance.qrCodeExpiresAt && instance.qrCodeExpiresAt < new Date())) {
      simulatorState.refreshQrCode(instanceName)
    }

    return {
      base64: instance.qrCode,
      code: `SIM-${instanceName}-${Date.now()}`
    }
  },

  async sendTextMessage(instanceName: string, to: string, text: string) {
    const instance = simulatorState.getInstance(instanceName)

    if (!instance) throw new Error('Instance not found')
    if (instance.status !== 'connected') throw new Error('Not connected')

    const message = simulatorState.addOutboundMessage(instanceName, to, text)
    if (!message) throw new Error('Failed to add message')

    // Simula delivery após 1s
    setTimeout(async () => {
      simulatorState.updateMessageStatus(instanceName, message.id, 'delivered')
      await webhookEmitter.emitMessageUpdate(instanceName, message.id, 'delivered')
    }, 1000)

    // Simula read após 3s
    setTimeout(async () => {
      simulatorState.updateMessageStatus(instanceName, message.id, 'read')
      await webhookEmitter.emitMessageUpdate(instanceName, message.id, 'read')
    }, 3000)

    console.log(`[wa-sim] Message sent: ${instanceName} -> ${to}`)

    return {
      key: { id: message.id, remoteJid: to },
      message: { text },
      messageTimestamp: message.timestamp,
      status: 'sent'
    }
  },

  async restart(instanceName: string) {
    const instance = simulatorState.getInstance(instanceName)
    if (!instance) throw new Error('Instance not found')

    simulatorState.refreshQrCode(instanceName)
    await webhookEmitter.emitQrCodeUpdated(instanceName)

    console.log(`[wa-sim] Instance restarted: ${instanceName}`)
  },

  async logout(instanceName: string) {
    simulatorState.simulateDisconnection(instanceName, 401)
    await webhookEmitter.emitConnectionUpdate(instanceName, 'close', 401)

    console.log(`[wa-sim] Instance logged out: ${instanceName}`)
  },

  async deleteInstance(instanceName: string) {
    const deleted = simulatorState.deleteInstance(instanceName)
    if (!deleted) throw new Error('Instance not found')

    console.log(`[wa-sim] Instance deleted: ${instanceName}`)
  },

  async listInstances() {
    return simulatorState.listInstances().map(i => ({
      instance: {
        instanceId: i.instanceId,
        instanceName: i.instanceName,
        status: i.status
      }
    }))
  },

  async healthCheck() {
    return true
  }
}
