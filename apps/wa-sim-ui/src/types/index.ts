export interface Contact {
  id: string
  name: string
  phone: string
  avatar: string | null
}

export interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  remoteJid: string
  text: string
  timestamp: Date
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  media?: {
    filename: string
    mimetype: string
    size: number
    url?: string
  }
  // Phase 2: Reply/Quote
  replyTo?: {
    messageId: string
    text: string
    sender: string
  }
  // Phase 2: Audio
  audio?: {
    duration: number // in seconds
    url?: string
  }
}

// Phase 2: Group support
export interface Group {
  id: string
  name: string
  participants: string[] // phone numbers
  avatar: string | null
}

export interface Instance {
  instanceName: string
  instanceId: string
  displayName: string | null
  status: 'qr_pending' | 'connecting' | 'connected' | 'disconnected'
  phoneNumber: string | null
}

export interface SimulatorStats {
  instancesTotal: number
  instancesConnected: number
  instancesPending: number
  messagesInboundTotal: number
  messagesOutboundTotal: number
  uptimeMs: number
}
