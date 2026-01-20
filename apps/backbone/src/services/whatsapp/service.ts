import { config } from '../../config.js';
import { incCounter, observeHistogram } from '../../health/collector.js';
import {
  channelsRepository,
  operationsRepository,
  assignmentsRepository,
  eventsRepository,
} from './repository.js';
import { messageLogsRepository } from './message-logs-repository.js';
import { evolutionClient, EvolutionApiError } from './evolution-client.js';
import type {
  Channel,
  Operation,
  Assignment,
  ChannelEvent,
  CreateChannelInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  ChannelWithAssignments,
  OperationWithChannels,
} from './types.js';

// =============================================================================
// Channel Management
// =============================================================================

export const whatsappService = {
  // ---------------------------------------------------------------------------
  // Channels (Numeros)
  // ---------------------------------------------------------------------------

  /**
   * Create a new WhatsApp channel (register number)
   * Creates channel in database first, then attempts Evolution instance creation.
   * Channel is created even if Evolution API is unavailable.
   */
  async createChannel(input: CreateChannelInput): Promise<Channel> {
    // Generate unique instance name
    const instanceName = `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const provider = input.provider || 'evolution';

    // Create channel in database first (always succeeds if DB is up)
    // Status will be 'qr_pending' by default from the repository
    const channel = await channelsRepository.create({
      ...input,
      instanceName,
      provider,
    });

    incCounter('whatsapp.channels_created');

    // Now try to create Evolution/Simulator instance
    try {
      const webhookUrl = `${config.APP_BASE_URL}/api/webhooks/evolution`;
      const { instanceId } = await evolutionClient.createInstance(instanceName, webhookUrl, provider, input.name);

      // Update with instance ID
      await channelsRepository.updateInstanceId(channel.id, instanceId);

      return {
        ...channel,
        instanceId,
      };
    } catch (error) {
      // Evolution API not available - channel exists but without Evolution instance
      // This is expected when Evolution is not running
      console.warn(`[WhatsApp] Evolution API unavailable for channel ${channel.id}:`, error instanceof Error ? error.message : error);

      // Update channel status to indicate Evolution is unavailable
      // Status remains 'qr_pending' but with a reason explaining Evolution is down
      await channelsRepository.updateStatus(channel.id, {
        status: 'qr_pending',
        statusReason: 'Evolution API não disponível - aguardando conexão',
      });

      incCounter('whatsapp.evolution_unavailable');

      // Return the channel anyway - user can retry Evolution connection later
      return channel;
    }
  },

  /**
   * Get channel by ID with assignments
   */
  async getChannel(id: string): Promise<ChannelWithAssignments | null> {
    const channel = await channelsRepository.findById(id);
    if (!channel) return null;

    const assignments = await assignmentsRepository.findByChannel(id);

    return {
      ...channel,
      assignments,
    };
  },

  /**
   * List all channels
   */
  async listChannels(): Promise<Channel[]> {
    return channelsRepository.findAll();
  },

  /**
   * Get QR code for a channel
   * If channel is already connected, returns null
   */
  async getQrCode(channelId: string): Promise<{ qrCode: string; expiresAt: string } | null> {
    const channel = await channelsRepository.findById(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    // If we have a cached QR code that's not expired, return it
    if (channel.qrCode && channel.qrCodeExpiresAt) {
      const expiresAt = new Date(channel.qrCodeExpiresAt);
      if (expiresAt > new Date()) {
        return {
          qrCode: channel.qrCode,
          expiresAt: channel.qrCodeExpiresAt,
        };
      }
    }

    // Request new QR code from Evolution
    const qrData = await evolutionClient.getQrCode(channel.instanceName);
    if (!qrData) {
      // Instance might be connected already
      return null;
    }

    // QR code will be delivered via webhook
    return null;
  },

  /**
   * Refresh QR code for a channel
   * Forces Evolution to generate a new QR code
   */
  async refreshQrCode(channelId: string): Promise<void> {
    const channel = await channelsRepository.findById(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    if (channel.status === 'connected') {
      throw new Error('Channel is already connected');
    }

    // Restart instance to get new QR
    await evolutionClient.restart(channel.instanceName);

    incCounter('whatsapp.qr_refreshes');
  },

  /**
   * Delete a channel
   * Also deletes the Evolution instance
   */
  async deleteChannel(channelId: string): Promise<void> {
    const channel = await channelsRepository.findById(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    // Delete Evolution instance
    try {
      await evolutionClient.deleteInstance(channel.instanceName);
    } catch (error) {
      // Log but continue with database deletion
      console.error(`Failed to delete Evolution instance ${channel.instanceName}:`, error);
    }

    // Delete from database (cascades to assignments and events)
    await channelsRepository.delete(channelId);

    incCounter('whatsapp.channels_deleted');
  },

  /**
   * Disconnect (logout) from WhatsApp without deleting the channel
   */
  async disconnectChannel(channelId: string): Promise<void> {
    const channel = await channelsRepository.findById(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    await evolutionClient.logout(channel.instanceName);

    await channelsRepository.updateStatus(channelId, {
      status: 'disconnected',
      statusReason: 'Manually disconnected',
      phoneNumber: null,
      qrCode: null,
      qrCodeExpiresAt: null,
    });
  },

  // ---------------------------------------------------------------------------
  // Operations (Canais de Operacao)
  // ---------------------------------------------------------------------------

  /**
   * List all operations
   */
  async listOperations(): Promise<Operation[]> {
    return operationsRepository.findAll();
  },

  /**
   * Get operation by ID with assigned channels
   */
  async getOperation(id: string): Promise<OperationWithChannels | null> {
    const operation = await operationsRepository.findById(id);
    if (!operation) return null;

    const assignments = await assignmentsRepository.findByOperation(id, false);

    // Fetch channel details for each assignment
    const channelsWithAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const channel = await channelsRepository.findById(assignment.channelId);
        return channel ? { channel, assignment } : null;
      })
    );

    return {
      ...operation,
      channels: channelsWithAssignments.filter(Boolean) as Array<{ channel: Channel; assignment: Assignment }>,
    };
  },

  /**
   * Get operation by slug with assigned channels
   */
  async getOperationBySlug(slug: string): Promise<OperationWithChannels | null> {
    const operation = await operationsRepository.findBySlug(slug);
    if (!operation) return null;

    return this.getOperation(operation.id);
  },

  // ---------------------------------------------------------------------------
  // Assignments (Atribuicoes)
  // ---------------------------------------------------------------------------

  /**
   * Assign a channel to an operation
   */
  async assignChannel(input: CreateAssignmentInput): Promise<Assignment> {
    // Validate channel exists
    const channel = await channelsRepository.findById(input.channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    // Validate operation exists
    const operation = await operationsRepository.findById(input.operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    // For user operations, userId is required
    if (operation.nature === 'user' && !input.userId) {
      throw new Error('User ID is required for user-nature operations');
    }

    // For system operations, userId should not be set
    if (operation.nature === 'system' && input.userId) {
      throw new Error('User ID should not be set for system-nature operations');
    }

    const assignment = await assignmentsRepository.create(input);

    incCounter('whatsapp.assignments_created');

    return assignment;
  },

  /**
   * Update an assignment
   */
  async updateAssignment(
    assignmentId: string,
    updates: UpdateAssignmentInput
  ): Promise<Assignment | null> {
    return assignmentsRepository.update(assignmentId, updates);
  },

  /**
   * Remove an assignment
   */
  async unassignChannel(assignmentId: string): Promise<void> {
    const deleted = await assignmentsRepository.delete(assignmentId);
    if (!deleted) {
      throw new Error('Assignment not found');
    }

    incCounter('whatsapp.assignments_deleted');
  },

  /**
   * Get channel for an operation (and optionally user)
   * Returns the highest priority active channel
   */
  async getChannelForOperation(
    operationSlug: string,
    userId?: string
  ): Promise<Channel | null> {
    const operation = await operationsRepository.findBySlug(operationSlug);
    if (!operation) return null;

    let assignment: Assignment | null = null;

    if (operation.nature === 'user' && userId) {
      // For user operations, find user-specific assignment
      assignment = await assignmentsRepository.findByOperationAndUser(operation.id, userId);
    } else {
      // For system operations, get highest priority assignment
      const assignments = await assignmentsRepository.findByOperation(operation.id, true);
      assignment = assignments[0] ?? null;
    }

    if (!assignment) return null;

    const channel = await channelsRepository.findById(assignment.channelId);

    // Only return if connected
    if (channel?.status !== 'connected') {
      return null;
    }

    return channel;
  },

  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------

  /**
   * Send a test message through a channel
   */
  async sendTestMessage(
    channelId: string,
    to: string,
    text: string
  ): Promise<{ messageId: string }> {
    const channel = await channelsRepository.findById(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    if (channel.status !== 'connected') {
      throw new Error('Channel is not connected');
    }

    const startTime = Date.now();

    // Log outbound message before sending
    let logEntry: { id: string } | null = null;
    const loggingEnabled = await messageLogsRepository.isLoggingEnabled(channelId);

    // Apply redirect mode if configured
    const actualRecipient = channel.redirectToNumber || to;
    const actualText = channel.redirectToNumber
      ? `[REDIRECT para ${to}]\n\n${text}`
      : text;

    if (loggingEnabled) {
      try {
        logEntry = await messageLogsRepository.create({
          channelId,
          direction: 'outbound',
          remoteJid: to,
          messageType: 'text',
          content: text,
          status: 'pending',
        });
      } catch (error) {
        console.error('[WhatsApp] Failed to log outbound message:', error);
      }
    }

    try {
      const result = await evolutionClient.sendTextMessage(channel.instanceName, actualRecipient, actualText);

      // Update log with success
      if (logEntry) {
        await messageLogsRepository.updateStatusById(logEntry.id, 'sent');
      }

      incCounter('whatsapp.messages.outbound');
      incCounter('whatsapp.messages.outbound.success');
      observeHistogram('whatsapp.send.latency', Date.now() - startTime);

      return result;
    } catch (error) {
      // Update log with failure
      if (logEntry) {
        await messageLogsRepository.updateStatusById(
          logEntry.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      incCounter('whatsapp.messages.outbound.errors');
      throw error;
    }
  },

  /**
   * Send a message through an operation's channel
   */
  async sendMessage(
    operationSlug: string,
    to: string,
    text: string,
    userId?: string
  ): Promise<{ messageId: string; channelId: string }> {
    const channel = await this.getChannelForOperation(operationSlug, userId);
    if (!channel) {
      throw new Error(`No connected channel available for operation: ${operationSlug}`);
    }

    // Get operation for logging
    const operation = await operationsRepository.findBySlug(operationSlug);

    const startTime = Date.now();

    // Log outbound message before sending
    let logEntry: { id: string } | null = null;
    const loggingEnabled = await messageLogsRepository.isLoggingEnabled(channel.id);

    // Apply redirect mode if configured
    const actualRecipient = channel.redirectToNumber || to;
    const actualText = channel.redirectToNumber
      ? `[REDIRECT para ${to}]\n\n${text}`
      : text;

    if (loggingEnabled) {
      try {
        logEntry = await messageLogsRepository.create({
          channelId: channel.id,
          operationId: operation?.id,
          direction: 'outbound',
          remoteJid: to,
          messageType: 'text',
          content: text,
          status: 'pending',
        });
      } catch (error) {
        console.error('[WhatsApp] Failed to log outbound message:', error);
      }
    }

    try {
      const result = await evolutionClient.sendTextMessage(channel.instanceName, actualRecipient, actualText);

      // Update log with success and messageId
      if (logEntry) {
        await messageLogsRepository.updateStatusById(logEntry.id, 'sent');
      }

      incCounter('whatsapp.messages.outbound');
      incCounter('whatsapp.messages.outbound.success');
      observeHistogram('whatsapp.send.latency', Date.now() - startTime);

      return {
        messageId: result.messageId,
        channelId: channel.id,
      };
    } catch (error) {
      // Update log with failure
      if (logEntry) {
        await messageLogsRepository.updateStatusById(
          logEntry.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      incCounter('whatsapp.messages.outbound.errors');
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // Events & History
  // ---------------------------------------------------------------------------

  /**
   * Get recent events for a channel
   */
  async getChannelEvents(channelId: string, limit = 50): Promise<ChannelEvent[]> {
    return eventsRepository.findRecent(channelId, limit);
  },

  // ---------------------------------------------------------------------------
  // Health & Status
  // ---------------------------------------------------------------------------

  /**
   * Check if Evolution API is available
   */
  async checkHealth(): Promise<boolean> {
    return evolutionClient.healthCheck();
  },

  /**
   * Sync channel status with Evolution
   * Useful for recovering after server restart
   */
  async syncChannelStatus(channelId: string): Promise<Channel | null> {
    const channel = await channelsRepository.findById(channelId);
    if (!channel) return null;

    try {
      const status = await evolutionClient.getConnectionStatus(channel.instanceName);

      let newStatus = channel.status;
      if (status.state === 'open') {
        newStatus = 'connected';
      } else if (status.state === 'connecting') {
        newStatus = 'connecting';
      } else {
        newStatus = 'disconnected';
      }

      if (newStatus !== channel.status) {
        await channelsRepository.updateStatus(channelId, {
          status: newStatus,
        });
      }

      await channelsRepository.updateHealthCheck(channelId);

      return channelsRepository.findById(channelId);
    } catch (error) {
      if (error instanceof EvolutionApiError) {
        console.error(`Failed to sync status for ${channel.name}:`, error.message);
      }
      return channel;
    }
  },

  /**
   * Sync all channel statuses
   */
  async syncAllChannels(): Promise<void> {
    const channels = await channelsRepository.findAll();

    for (const channel of channels) {
      await this.syncChannelStatus(channel.id);
    }
  },
};
