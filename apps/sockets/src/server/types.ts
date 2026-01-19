/**
 * Socket Event Types
 *
 * Typed events for Socket.io following REALTIME.md patterns.
 */

// =============================================================================
// User Data (attached to socket after auth)
// =============================================================================

export interface SocketUser {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
}

// =============================================================================
// Presence Events
// =============================================================================

export interface PresencePayload {
  userId: string;
  status: 'online' | 'away' | 'offline';
  timestamp: number;
}

// =============================================================================
// Thread/Chat Events
// =============================================================================

export interface ThreadMessagePayload {
  threadId: string;
  messageId: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export interface TypingPayload {
  threadId: string;
  userId: string;
  isTyping: boolean;
}

export interface JoinThreadPayload {
  threadId: string;
}

// =============================================================================
// Queue Events
// =============================================================================

export interface QueueItemPayload {
  id: string;
  type: string;
  priority: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// WhatsApp Events
// =============================================================================

export interface WhatsAppQrUpdatedPayload {
  channelId: string;
  qrCode: string;
  expiresAt: string;
}

export interface WhatsAppConnectionUpdatedPayload {
  channelId: string;
  status: 'disconnected' | 'qr_pending' | 'connecting' | 'connected' | 'degraded';
  phoneNumber?: string | null;
  reason?: number;
  requiresQrCode?: boolean;
  retryCount?: number;
  maxRetries?: number;
  message?: string;
}

export interface WhatsAppStatusChangedPayload {
  channelId: string;
  channelName: string;
  status: 'disconnected' | 'qr_pending' | 'connecting' | 'connected' | 'degraded';
}

export interface WhatsAppAlertPayload {
  channelId: string;
  channelName: string;
  type: 'degraded' | 'disconnected' | 'reconnected';
  message: string;
  reason: string | null;
  timestamp: string;
}

export interface JoinWhatsAppPayload {
  channelId: string;
}

// =============================================================================
// Client to Server Events
// =============================================================================

export interface ClientToServerEvents {
  // Presence
  'presence:online': () => void;
  'presence:away': () => void;
  heartbeat: () => void;

  // Thread
  'join:thread': (payload: JoinThreadPayload) => void;
  'leave:thread': (payload: JoinThreadPayload) => void;
  'typing:start': (payload: { threadId: string }) => void;
  'typing:stop': (payload: { threadId: string }) => void;

  // WhatsApp
  'join:whatsapp': (payload: JoinWhatsAppPayload) => void;
  'leave:whatsapp': (payload: JoinWhatsAppPayload) => void;
  'join:whatsapp:watchers': () => void;
  'leave:whatsapp:watchers': () => void;
}

// =============================================================================
// Server to Client Events
// =============================================================================

export interface ServerToClientEvents {
  // Presence
  'attendant:online': (payload: PresencePayload) => void;
  'attendant:offline': (payload: PresencePayload) => void;
  'attendant:away': (payload: PresencePayload) => void;

  // Queue
  'queue:new': (payload: QueueItemPayload) => void;
  'queue:taken': (payload: { id: string; takenBy: string }) => void;
  'queue:updated': (payload: QueueItemPayload[]) => void;

  // Thread/Chat
  'thread:message': (payload: ThreadMessagePayload) => void;
  'thread:typing': (payload: TypingPayload) => void;
  'chat:accepted': (payload: { threadId: string; attendantId: string }) => void;
  'chat:ended': (payload: { threadId: string; reason: string }) => void;

  // WhatsApp
  'whatsapp:qr_updated': (payload: WhatsAppQrUpdatedPayload) => void;
  'whatsapp:connection_updated': (payload: WhatsAppConnectionUpdatedPayload) => void;
  'whatsapp:status_changed': (payload: WhatsAppStatusChangedPayload) => void;
  'whatsapp:alert': (payload: WhatsAppAlertPayload) => void;
  'whatsapp:message_received': (payload: { channelId: string; data: Record<string, unknown> }) => void;
  'whatsapp:message_updated': (payload: { channelId: string; data: Record<string, unknown> }) => void;
}

// =============================================================================
// Inter-Server Events (Redis Pub/Sub)
// =============================================================================

export interface InterServerEvents {
  ping: () => void;
}

// =============================================================================
// Socket Data (attached to socket)
// =============================================================================

export interface SocketData {
  user: SocketUser;
  joinedRooms: Set<string>;
}

// =============================================================================
// Redis Event Payloads (from Backbone)
// =============================================================================

export type RedisEventType =
  | 'presence:changed'
  | 'thread:message'
  | 'chat:accepted'
  | 'chat:ended'
  | 'queue:updated';

export interface RedisEvent<T = unknown> {
  type: RedisEventType;
  payload: T;
  timestamp: number;
}
