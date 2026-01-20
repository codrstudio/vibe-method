/**
 * WhatsApp Simulator Types
 * Tipos para o simulador de Evolution API
 */

export interface SimulatedInstance {
  instanceName: string
  instanceId: string
  channelId: string | null
  displayName: string | null
  status: 'qr_pending' | 'connecting' | 'connected' | 'disconnected'
  phoneNumber: string | null
  qrCode: string | null
  qrCodeExpiresAt: Date | null
  createdAt: Date
  messages: SimulatedMessage[]
  stats: InstanceStats
}

export interface SimulatedMessage {
  id: string
  direction: 'inbound' | 'outbound'
  remoteJid: string
  text: string
  timestamp: Date
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
}

export interface InstanceStats {
  messagesInbound: number
  messagesOutbound: number
  connectionsTotal: number
  disconnectionsTotal: number
  lastActivity: Date | null
}

export interface SimulatorStats {
  instancesTotal: number
  instancesConnected: number
  instancesPending: number
  messagesInboundTotal: number
  messagesOutboundTotal: number
  uptimeMs: number
}

// Evolution API compatible webhook payloads
export interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: unknown
}

export interface QrCodeUpdatedData {
  base64: string | null
  code: string
}

export interface ConnectionUpdateData {
  state: 'open' | 'close' | 'connecting'
  statusReason?: number
}

export interface MessageUpsertData {
  key: {
    id: string
    remoteJid: string
    fromMe: boolean
  }
  message: {
    conversation?: string
  }
  messageTimestamp: number
  pushName: string
}

export interface MessageUpdateData {
  key: {
    id: string
  }
  update: {
    status: string
  }
}
