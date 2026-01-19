/**
 * WhatsApp Simulator State
 * Estado em memória (singleton) para instâncias simuladas
 */

import { EventEmitter } from 'events'
import { v4 as uuid } from 'uuid'
import type { SimulatedInstance, SimulatedMessage, SimulatorStats } from './types.js'

class SimulatorState extends EventEmitter {
  private instances = new Map<string, SimulatedInstance>()
  private startedAt = Date.now()

  // =========================================================================
  // Instâncias
  // =========================================================================

  createInstance(name: string, channelId?: string): SimulatedInstance {
    const instance: SimulatedInstance = {
      instanceName: name,
      instanceId: `sim_${uuid()}`,
      channelId: channelId ?? null,
      status: 'qr_pending',
      phoneNumber: null,
      qrCode: this.generateQrCode(name),
      qrCodeExpiresAt: new Date(Date.now() + 60000),
      createdAt: new Date(),
      messages: [],
      stats: {
        messagesInbound: 0,
        messagesOutbound: 0,
        connectionsTotal: 0,
        disconnectionsTotal: 0,
        lastActivity: null
      }
    }

    this.instances.set(name, instance)
    this.emit('instance:created', instance)
    return instance
  }

  getInstance(name: string): SimulatedInstance | null {
    return this.instances.get(name) ?? null
  }

  getInstanceByChannelId(channelId: string): SimulatedInstance | null {
    for (const instance of this.instances.values()) {
      if (instance.channelId === channelId) return instance
    }
    return null
  }

  deleteInstance(name: string): boolean {
    const instance = this.instances.get(name)
    if (!instance) return false

    this.instances.delete(name)
    this.emit('instance:deleted', instance)
    return true
  }

  listInstances(): SimulatedInstance[] {
    return Array.from(this.instances.values())
  }

  // =========================================================================
  // QR Code
  // =========================================================================

  generateQrCode(name: string): string {
    // QR code fake - placeholder base64
    const placeholder = `SIMULATOR:${name}:${Date.now()}`
    return Buffer.from(placeholder).toString('base64')
  }

  refreshQrCode(name: string): string | null {
    const instance = this.getInstance(name)
    if (!instance) return null

    instance.qrCode = this.generateQrCode(name)
    instance.qrCodeExpiresAt = new Date(Date.now() + 60000)
    instance.status = 'qr_pending'

    this.emit('instance:qr_refreshed', instance)
    return instance.qrCode
  }

  // =========================================================================
  // Conexão
  // =========================================================================

  simulateConnection(name: string, phoneNumber: string): boolean {
    const instance = this.getInstance(name)
    if (!instance) return false

    instance.status = 'connected'
    instance.phoneNumber = phoneNumber
    instance.qrCode = null
    instance.qrCodeExpiresAt = null
    instance.stats.connectionsTotal++
    instance.stats.lastActivity = new Date()

    this.emit('instance:connected', instance)
    return true
  }

  simulateDisconnection(name: string, reason: number): boolean {
    const instance = this.getInstance(name)
    if (!instance) return false

    instance.status = 'disconnected'
    instance.stats.disconnectionsTotal++
    instance.stats.lastActivity = new Date()

    this.emit('instance:disconnected', { instance, reason })
    return true
  }

  // =========================================================================
  // Mensagens
  // =========================================================================

  addInboundMessage(name: string, from: string, text: string): SimulatedMessage | null {
    const instance = this.getInstance(name)
    if (!instance || instance.status !== 'connected') return null

    const message: SimulatedMessage = {
      id: `msg_${uuid()}`,
      direction: 'inbound',
      remoteJid: from,
      text,
      timestamp: new Date(),
      status: 'delivered'
    }

    instance.messages.push(message)
    instance.stats.messagesInbound++
    instance.stats.lastActivity = new Date()

    // Limita histórico a 100 mensagens por instância
    if (instance.messages.length > 100) {
      instance.messages = instance.messages.slice(-100)
    }

    this.emit('message:inbound', { instance, message })
    return message
  }

  addOutboundMessage(name: string, to: string, text: string): SimulatedMessage | null {
    const instance = this.getInstance(name)
    if (!instance || instance.status !== 'connected') return null

    const message: SimulatedMessage = {
      id: `msg_${uuid()}`,
      direction: 'outbound',
      remoteJid: to,
      text,
      timestamp: new Date(),
      status: 'sent'
    }

    instance.messages.push(message)
    instance.stats.messagesOutbound++
    instance.stats.lastActivity = new Date()

    if (instance.messages.length > 100) {
      instance.messages = instance.messages.slice(-100)
    }

    this.emit('message:outbound', { instance, message })
    return message
  }

  updateMessageStatus(name: string, messageId: string, status: string): boolean {
    const instance = this.getInstance(name)
    if (!instance) return false

    const message = instance.messages.find(m => m.id === messageId)
    if (!message) return false

    message.status = status as SimulatedMessage['status']
    this.emit('message:status_updated', { instance, message })
    return true
  }

  // =========================================================================
  // Estatísticas
  // =========================================================================

  getStats(): SimulatorStats {
    const instances = this.listInstances()

    return {
      instancesTotal: instances.length,
      instancesConnected: instances.filter(i => i.status === 'connected').length,
      instancesPending: instances.filter(i => i.status === 'qr_pending').length,
      messagesInboundTotal: instances.reduce((sum, i) => sum + i.stats.messagesInbound, 0),
      messagesOutboundTotal: instances.reduce((sum, i) => sum + i.stats.messagesOutbound, 0),
      uptimeMs: Date.now() - this.startedAt
    }
  }
}

// Singleton
export const simulatorState = new SimulatorState()
