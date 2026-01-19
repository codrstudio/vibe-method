import { incCounter } from '../../health/collector.js';
import { channelsRepository, eventsRepository } from './repository.js';
import { evolutionClient } from './evolution-client.js';
import { alertService } from './alert-service.js';
import {
  REQUIRES_QR_REASONS,
  RECONNECTION_CONFIG,
} from './types.js';
import type {
  EvolutionWebhookPayload,
  Channel,
} from './types.js';

// =============================================================================
// Types
// =============================================================================

interface QrCodeData {
  base64?: string;
  code?: string;
}

interface ConnectionData {
  state: 'open' | 'close' | 'connecting';
  statusReason?: number;
  instance?: string;
}

// =============================================================================
// State Management
// =============================================================================

// Debounce map for connection state changes (avoid oscillations)
const stateDebounce = new Map<string, NodeJS.Timeout>();

// Retry timers map
const retryTimers = new Map<string, NodeJS.Timeout>();

// Socket.IO emit function (injected at runtime)
let socketEmitter: ((room: string, event: string, data: unknown) => void) | null = null;

/**
 * Set the socket emitter function for real-time updates
 */
export function setSocketEmitter(
  emitter: (room: string, event: string, data: unknown) => void
): void {
  socketEmitter = emitter;
}

/**
 * Emit to a WhatsApp room
 */
function emitToRoom(channelId: string, event: string, data: unknown): void {
  if (socketEmitter) {
    socketEmitter(`whatsapp:${channelId}`, event, data);
  }
}

/**
 * Broadcast to all WhatsApp watchers
 */
function broadcast(event: string, data: unknown): void {
  if (socketEmitter) {
    socketEmitter('whatsapp:watchers', event, data);
  }
}

// =============================================================================
// Main Webhook Handler
// =============================================================================

export async function handleEvolutionWebhook(
  payload: EvolutionWebhookPayload
): Promise<void> {
  const { event, instance, data } = payload;

  incCounter('whatsapp.webhooks_received', 1, { event });

  // Find channel by instance name
  const channel = await channelsRepository.findByInstanceName(instance);
  if (!channel) {
    console.warn(`[WhatsApp] Received webhook for unknown instance: ${instance}`);
    return;
  }

  // Store event for audit
  await eventsRepository.create({
    channelId: channel.id,
    eventType: event,
    payload: data,
  });

  // Route to specific handler
  switch (event) {
    case 'QRCODE_UPDATED':
      await handleQrCodeUpdate(channel, data as QrCodeData);
      break;

    case 'CONNECTION_UPDATE':
      // Apply debounce to avoid oscillations
      clearTimeout(stateDebounce.get(channel.id));
      stateDebounce.set(
        channel.id,
        setTimeout(() => {
          handleConnectionUpdate(channel, data as ConnectionData);
        }, RECONNECTION_CONFIG.DEBOUNCE_MS)
      );
      break;

    case 'MESSAGES_UPSERT':
      // Forward to interested operations (future feature)
      handleMessageReceived(channel, data);
      break;

    case 'MESSAGES_UPDATE':
      // Message status update (delivered, read)
      handleMessageUpdate(channel, data);
      break;

    default:
      console.log(`[WhatsApp] Unhandled event type: ${event}`);
  }
}

// =============================================================================
// QR Code Handler
// =============================================================================

async function handleQrCodeUpdate(
  channel: Channel,
  data: QrCodeData
): Promise<void> {
  if (!data.base64) {
    console.warn(`[WhatsApp] QR code update without base64 for ${channel.instanceName}`);
    return;
  }

  // QR codes typically expire in 60 seconds
  const expiresAt = new Date(Date.now() + 60 * 1000);

  await channelsRepository.updateStatus(channel.id, {
    status: 'qr_pending',
    qrCode: data.base64,
    qrCodeExpiresAt: expiresAt,
  });

  // Emit to connected clients
  emitToRoom(channel.id, 'whatsapp:qr_updated', {
    channelId: channel.id,
    qrCode: data.base64,
    expiresAt: expiresAt.toISOString(),
  });

  incCounter('whatsapp.qr_codes_generated');
  console.log(`[WhatsApp] QR code updated for ${channel.name}`);
}

// =============================================================================
// Connection Update Handler
// =============================================================================

async function handleConnectionUpdate(
  channel: Channel,
  data: ConnectionData
): Promise<void> {
  // Refresh channel data (might have changed during debounce)
  const currentChannel = await channelsRepository.findById(channel.id);
  if (!currentChannel) return;

  const { state, statusReason } = data;

  console.log(`[WhatsApp] Connection update for ${currentChannel.name}: ${state} (reason: ${statusReason})`);

  if (state === 'open') {
    await handleConnected(currentChannel);
    return;
  }

  if (state === 'connecting') {
    await handleConnecting(currentChannel);
    return;
  }

  if (state === 'close') {
    await handleDisconnected(currentChannel, statusReason);
    return;
  }
}

async function handleConnected(channel: Channel): Promise<void> {
  const wasReconnecting = channel.status === 'degraded';

  // Clear any pending retry timers
  clearRetryTimer(channel.id);

  // Update status
  await channelsRepository.updateStatus(channel.id, {
    status: 'connected',
    statusReason: null,
    qrCode: null,
    qrCodeExpiresAt: null,
    retryCount: 0,
  });

  // Emit to clients
  emitToRoom(channel.id, 'whatsapp:connection_updated', {
    channelId: channel.id,
    status: 'connected',
    phoneNumber: channel.phoneNumber,
  });

  broadcast('whatsapp:status_changed', {
    channelId: channel.id,
    channelName: channel.name,
    status: 'connected',
  });

  // Send reconnection alert if was degraded
  if (wasReconnecting) {
    await alertService.sendAlert('reconnected', channel);
  }

  incCounter('whatsapp.connections');
  console.log(`[WhatsApp] ${channel.name} connected successfully`);
}

async function handleConnecting(channel: Channel): Promise<void> {
  await channelsRepository.updateStatus(channel.id, {
    status: 'connecting',
  });

  emitToRoom(channel.id, 'whatsapp:connection_updated', {
    channelId: channel.id,
    status: 'connecting',
  });

  console.log(`[WhatsApp] ${channel.name} is connecting...`);
}

async function handleDisconnected(
  channel: Channel,
  statusReason?: number
): Promise<void> {
  const reason = statusReason ?? 0;
  const requiresQR = REQUIRES_QR_REASONS.includes(reason);

  if (requiresQR) {
    // Requires manual QR scan - no auto-reconnect
    await handleRequiresQrCode(channel, reason);
  } else {
    // Can attempt auto-reconnect
    await startReconnectionFlow(channel, reason);
  }
}

async function handleRequiresQrCode(
  channel: Channel,
  reason: number
): Promise<void> {
  // Clear any pending retry timers
  clearRetryTimer(channel.id);

  // Update status to disconnected
  await channelsRepository.updateStatus(channel.id, {
    status: 'disconnected',
    statusReason: `Requires QR code scan (${reason})`,
    lastDisconnectReason: reason,
    lastDisconnectAt: new Date(),
    retryCount: 0,
  });

  // Emit to clients
  emitToRoom(channel.id, 'whatsapp:connection_updated', {
    channelId: channel.id,
    status: 'disconnected',
    reason,
    requiresQrCode: true,
  });

  broadcast('whatsapp:status_changed', {
    channelId: channel.id,
    channelName: channel.name,
    status: 'disconnected',
  });

  // Send critical alert
  await alertService.sendAlert('disconnected', channel, reason);

  // Broadcast alert for UI toast
  broadcast('whatsapp:alert', alertService.getAlertPayload('disconnected', channel, reason));

  incCounter('whatsapp.disconnections', 1, { reason: String(reason) });
  console.log(`[WhatsApp] ${channel.name} disconnected - requires QR code (reason: ${reason})`);
}

// =============================================================================
// Reconnection Flow
// =============================================================================

async function startReconnectionFlow(
  channel: Channel,
  reason: number
): Promise<void> {
  const newRetryCount = channel.retryCount + 1;

  // Check if max retries exceeded
  if (newRetryCount > RECONNECTION_CONFIG.MAX_RETRIES) {
    // Give up - mark as disconnected
    await handleReconnectionFailed(channel, reason);
    return;
  }

  // Mark as degraded
  await channelsRepository.updateStatus(channel.id, {
    status: 'degraded',
    statusReason: `Reconnecting (attempt ${newRetryCount}/${RECONNECTION_CONFIG.MAX_RETRIES})`,
    lastDisconnectReason: reason,
    retryCount: newRetryCount,
  });

  // Emit status update
  emitToRoom(channel.id, 'whatsapp:connection_updated', {
    channelId: channel.id,
    status: 'degraded',
    retryCount: newRetryCount,
    maxRetries: RECONNECTION_CONFIG.MAX_RETRIES,
    reason,
  });

  broadcast('whatsapp:status_changed', {
    channelId: channel.id,
    channelName: channel.name,
    status: 'degraded',
  });

  // Send alert on first degradation
  if (newRetryCount === 1) {
    await alertService.sendAlert('degraded', channel, reason);
    broadcast('whatsapp:alert', alertService.getAlertPayload('degraded', channel, reason));
  }

  // Calculate delay with backoff
  const backoffIndex = Math.min(newRetryCount - 1, RECONNECTION_CONFIG.BACKOFF_SECONDS.length - 1);
  const delaySeconds = RECONNECTION_CONFIG.BACKOFF_SECONDS[backoffIndex];

  console.log(
    `[WhatsApp] ${channel.name} degraded - retry ${newRetryCount}/${RECONNECTION_CONFIG.MAX_RETRIES} in ${delaySeconds}s`
  );

  // Schedule retry
  scheduleRetry(channel.id, channel.instanceName, delaySeconds);

  incCounter('whatsapp.reconnection_attempts');
}

function scheduleRetry(
  channelId: string,
  instanceName: string,
  delaySeconds: number
): void {
  // Clear existing timer if any
  clearRetryTimer(channelId);

  const timer = setTimeout(async () => {
    // Check if channel is still degraded
    const channel = await channelsRepository.findById(channelId);
    if (!channel || channel.status !== 'degraded') {
      console.log(`[WhatsApp] Retry cancelled for ${channelId} - no longer degraded`);
      return;
    }

    console.log(`[WhatsApp] Attempting restart for ${channel.name}...`);

    try {
      await evolutionClient.restart(instanceName);
      // The CONNECTION_UPDATE webhook will handle the result
    } catch (error) {
      console.error(`[WhatsApp] Restart failed for ${channel.name}:`, error);
      // The CONNECTION_UPDATE webhook will trigger another retry
    }
  }, delaySeconds * 1000);

  retryTimers.set(channelId, timer);
}

function clearRetryTimer(channelId: string): void {
  const timer = retryTimers.get(channelId);
  if (timer) {
    clearTimeout(timer);
    retryTimers.delete(channelId);
  }
}

async function handleReconnectionFailed(
  channel: Channel,
  reason: number
): Promise<void> {
  // Clear timer
  clearRetryTimer(channel.id);

  // Update status
  await channelsRepository.updateStatus(channel.id, {
    status: 'disconnected',
    statusReason: `Reconnection failed after ${RECONNECTION_CONFIG.MAX_RETRIES} attempts`,
    lastDisconnectAt: new Date(),
    retryCount: 0,
  });

  // Emit to clients
  emitToRoom(channel.id, 'whatsapp:connection_updated', {
    channelId: channel.id,
    status: 'disconnected',
    reason,
    requiresQrCode: true,
    message: 'Auto-reconnection failed - manual intervention required',
  });

  broadcast('whatsapp:status_changed', {
    channelId: channel.id,
    channelName: channel.name,
    status: 'disconnected',
  });

  // Send critical alert
  await alertService.sendAlert('disconnected', channel, reason);
  broadcast('whatsapp:alert', alertService.getAlertPayload('disconnected', channel, reason));

  incCounter('whatsapp.reconnection_failures');
  console.log(`[WhatsApp] ${channel.name} reconnection failed - requires manual intervention`);
}

// =============================================================================
// Message Handlers (Future expansion)
// =============================================================================

async function handleMessageReceived(
  channel: Channel,
  data: Record<string, unknown>
): Promise<void> {
  // TODO: Route to interested operations based on event_interests
  // This will be used to forward messages to specific handlers

  incCounter('whatsapp.messages_received');

  // Emit to channel watchers for real-time updates
  emitToRoom(channel.id, 'whatsapp:message_received', {
    channelId: channel.id,
    data,
  });
}

async function handleMessageUpdate(
  channel: Channel,
  data: Record<string, unknown>
): Promise<void> {
  // Message delivery/read status updates
  incCounter('whatsapp.message_updates');

  emitToRoom(channel.id, 'whatsapp:message_updated', {
    channelId: channel.id,
    data,
  });
}

// =============================================================================
// Cleanup
// =============================================================================

/**
 * Clean up all timers (call on shutdown)
 */
export function cleanup(): void {
  for (const timer of stateDebounce.values()) {
    clearTimeout(timer);
  }
  stateDebounce.clear();

  for (const timer of retryTimers.values()) {
    clearTimeout(timer);
  }
  retryTimers.clear();
}
