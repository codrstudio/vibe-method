import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const ChannelStatusEnum = z.enum([
  'disconnected',
  'qr_pending',
  'connecting',
  'connected',
  'degraded',
]);

export const OperationNatureEnum = z.enum(['system', 'user']);

export type ChannelStatus = z.infer<typeof ChannelStatusEnum>;
export type OperationNature = z.infer<typeof OperationNatureEnum>;

// =============================================================================
// Channel (Numero WhatsApp)
// =============================================================================

export const ChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  instanceName: z.string(),
  instanceId: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  status: ChannelStatusEnum,
  statusReason: z.string().nullable(),
  qrCode: z.string().nullable(),
  qrCodeExpiresAt: z.string().nullable(),
  connectionData: z.record(z.unknown()),
  retryCount: z.number(),
  lastDisconnectReason: z.number().nullable(),
  lastDisconnectAt: z.string().nullable(),
  lastHealthCheck: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().uuid().nullable(),
});

export type Channel = z.infer<typeof ChannelSchema>;

export interface CreateChannelInput {
  name: string;
  description?: string;
  createdBy?: string;
}

export interface UpdateChannelStatusInput {
  status: ChannelStatus;
  statusReason?: string | null;
  phoneNumber?: string | null;
  qrCode?: string | null;
  qrCodeExpiresAt?: Date | null;
  connectionData?: Record<string, unknown>;
  retryCount?: number;
  lastDisconnectReason?: number | null;
  lastDisconnectAt?: Date | null;
}

// =============================================================================
// Operation (Canal de Operacao)
// =============================================================================

export const OperationSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  nature: OperationNatureEnum,
  declaredBy: z.string().nullable(),
  eventInterests: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Operation = z.infer<typeof OperationSchema>;

// =============================================================================
// Assignment (Atribuicao Canal <-> Operacao)
// =============================================================================

export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  channelId: z.string().uuid(),
  operationId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  priority: z.number(),
  isActive: z.boolean(),
  notificationEmail: z.string().nullable(),
  notificationPhone: z.string().nullable(),
  createdAt: z.string(),
});

export type Assignment = z.infer<typeof AssignmentSchema>;

export interface CreateAssignmentInput {
  channelId: string;
  operationId: string;
  userId?: string;
  priority?: number;
  notificationEmail?: string;
  notificationPhone?: string;
}

export interface UpdateAssignmentInput {
  priority?: number;
  isActive?: boolean;
  notificationEmail?: string;
  notificationPhone?: string;
}

// =============================================================================
// Channel Event (Historico)
// =============================================================================

export const ChannelEventSchema = z.object({
  id: z.string().uuid(),
  channelId: z.string().uuid(),
  eventType: z.string(),
  payload: z.record(z.unknown()),
  processed: z.boolean(),
  createdAt: z.string(),
});

export type ChannelEvent = z.infer<typeof ChannelEventSchema>;

export interface CreateChannelEventInput {
  channelId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

// =============================================================================
// Evolution API Types
// =============================================================================

export interface EvolutionInstance {
  instanceId: string;
  instanceName: string;
  status: string;
}

export interface EvolutionQrCode {
  base64: string;
  code?: string;
}

export interface EvolutionConnectionStatus {
  state: 'open' | 'close' | 'connecting';
  statusReason?: number;
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: Record<string, unknown>;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

// =============================================================================
// Disconnect Reasons (Baileys)
// =============================================================================

export const DISCONNECT_REASONS = {
  // Requer QR Code (acao manual)
  LOGGED_OUT: 401,
  CONNECTION_REPLACED: 440,
  BAD_SESSION: 500,

  // Reconexao automatica
  TIMED_OUT: 408,
  CONNECTION_CLOSED: 428,
  UNAVAILABLE_SERVICE: 503,
  RESTART_REQUIRED: 515,
} as const;

export const REQUIRES_QR_REASONS = [
  DISCONNECT_REASONS.LOGGED_OUT,
  DISCONNECT_REASONS.CONNECTION_REPLACED,
  DISCONNECT_REASONS.BAD_SESSION,
];

export const AUTO_RECONNECT_REASONS = [
  DISCONNECT_REASONS.TIMED_OUT,
  DISCONNECT_REASONS.CONNECTION_CLOSED,
  DISCONNECT_REASONS.UNAVAILABLE_SERVICE,
  DISCONNECT_REASONS.RESTART_REQUIRED,
];

// =============================================================================
// Reconnection Config
// =============================================================================

export const RECONNECTION_CONFIG = {
  MAX_RETRIES: 5,
  BACKOFF_SECONDS: [5, 15, 30, 60, 120],
  DEBOUNCE_MS: 5000,
} as const;

// =============================================================================
// Alert Types
// =============================================================================

export type AlertType = 'degraded' | 'disconnected' | 'reconnected';

export interface AlertRecipient {
  email?: string;
  phone?: string;
  userId?: string;
}

export interface AlertTemplate {
  subject: string;
  body: string;
  sms?: string;
}

// =============================================================================
// View Models (para API)
// =============================================================================

export interface ChannelWithAssignments extends Channel {
  assignments: Assignment[];
}

export interface OperationWithChannels extends Operation {
  channels: Array<{
    channel: Channel;
    assignment: Assignment;
  }>;
}
