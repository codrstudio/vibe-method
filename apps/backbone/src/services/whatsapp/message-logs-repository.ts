import { db } from '../../lib/index.js';
import { incCounter } from '../../health/collector.js';

// =============================================================================
// Types
// =============================================================================

export type MessageDirection = 'inbound' | 'outbound';

export type MessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'sticker'
  | 'contact'
  | 'location'
  | 'poll'
  | 'reaction'
  | 'unknown';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface AttachmentInfo {
  type: string;
  mimetype?: string;
  size?: number;
  filename?: string;
}

export interface MessageLog {
  id: string;
  channelId: string;
  operationId: string | null;
  direction: MessageDirection;
  remoteJid: string;
  messageId: string | null;
  messageType: MessageType;
  content: string | null;
  attachmentInfo: AttachmentInfo | null;
  status: MessageStatus | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateMessageLogInput {
  channelId: string;
  operationId?: string;
  direction: MessageDirection;
  remoteJid: string;
  messageId?: string;
  messageType: MessageType;
  content?: string;
  attachmentInfo?: AttachmentInfo;
  status?: MessageStatus;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Message Logs Repository
// =============================================================================

export const messageLogsRepository = {
  /**
   * Create a new message log entry
   */
  async create(input: CreateMessageLogInput): Promise<MessageLog> {
    const [log] = await db.query<MessageLog>(
      `INSERT INTO whatsapp_message_logs (
        channel_id, operation_id, direction, remote_jid, message_id,
        message_type, content, attachment_info, status, error_message, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        id,
        channel_id as "channelId",
        operation_id as "operationId",
        direction,
        remote_jid as "remoteJid",
        message_id as "messageId",
        message_type as "messageType",
        content,
        attachment_info as "attachmentInfo",
        status,
        error_message as "errorMessage",
        metadata,
        created_at as "createdAt"`,
      [
        input.channelId,
        input.operationId ?? null,
        input.direction,
        input.remoteJid,
        input.messageId ?? null,
        input.messageType,
        input.content ?? null,
        input.attachmentInfo ? JSON.stringify(input.attachmentInfo) : null,
        input.status ?? null,
        input.errorMessage ?? null,
        JSON.stringify(input.metadata ?? {}),
      ]
    );

    incCounter('whatsapp.logs.created', 1, { direction: input.direction });

    return log;
  },

  /**
   * Find message logs by channel ID
   */
  async findByChannel(channelId: string, limit = 100): Promise<MessageLog[]> {
    return db.query<MessageLog>(
      `SELECT
        id,
        channel_id as "channelId",
        operation_id as "operationId",
        direction,
        remote_jid as "remoteJid",
        message_id as "messageId",
        message_type as "messageType",
        content,
        attachment_info as "attachmentInfo",
        status,
        error_message as "errorMessage",
        metadata,
        created_at as "createdAt"
      FROM whatsapp_message_logs
      WHERE channel_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
      [channelId, limit]
    );
  },

  /**
   * Find message logs by remote JID (conversation)
   */
  async findByRemote(remoteJid: string, limit = 100): Promise<MessageLog[]> {
    return db.query<MessageLog>(
      `SELECT
        id,
        channel_id as "channelId",
        operation_id as "operationId",
        direction,
        remote_jid as "remoteJid",
        message_id as "messageId",
        message_type as "messageType",
        content,
        attachment_info as "attachmentInfo",
        status,
        error_message as "errorMessage",
        metadata,
        created_at as "createdAt"
      FROM whatsapp_message_logs
      WHERE remote_jid = $1
      ORDER BY created_at DESC
      LIMIT $2`,
      [remoteJid, limit]
    );
  },

  /**
   * Find conversation between channel and remote JID
   */
  async findConversation(
    channelId: string,
    remoteJid: string,
    limit = 100
  ): Promise<MessageLog[]> {
    return db.query<MessageLog>(
      `SELECT
        id,
        channel_id as "channelId",
        operation_id as "operationId",
        direction,
        remote_jid as "remoteJid",
        message_id as "messageId",
        message_type as "messageType",
        content,
        attachment_info as "attachmentInfo",
        status,
        error_message as "errorMessage",
        metadata,
        created_at as "createdAt"
      FROM whatsapp_message_logs
      WHERE channel_id = $1 AND remote_jid = $2
      ORDER BY created_at DESC
      LIMIT $3`,
      [channelId, remoteJid, limit]
    );
  },

  /**
   * Find message log by WhatsApp message ID
   */
  async findByMessageId(messageId: string): Promise<MessageLog | null> {
    return db.queryOne<MessageLog>(
      `SELECT
        id,
        channel_id as "channelId",
        operation_id as "operationId",
        direction,
        remote_jid as "remoteJid",
        message_id as "messageId",
        message_type as "messageType",
        content,
        attachment_info as "attachmentInfo",
        status,
        error_message as "errorMessage",
        metadata,
        created_at as "createdAt"
      FROM whatsapp_message_logs
      WHERE message_id = $1`,
      [messageId]
    );
  },

  /**
   * Update message status
   */
  async updateStatus(
    messageId: string,
    status: MessageStatus,
    errorMessage?: string
  ): Promise<void> {
    if (errorMessage) {
      await db.execute(
        `UPDATE whatsapp_message_logs
         SET status = $1, error_message = $2
         WHERE message_id = $3`,
        [status, errorMessage, messageId]
      );
    } else {
      await db.execute(
        `UPDATE whatsapp_message_logs
         SET status = $1
         WHERE message_id = $2`,
        [status, messageId]
      );
    }
  },

  /**
   * Update status by log ID
   */
  async updateStatusById(
    id: string,
    status: MessageStatus,
    errorMessage?: string
  ): Promise<void> {
    if (errorMessage) {
      await db.execute(
        `UPDATE whatsapp_message_logs
         SET status = $1, error_message = $2
         WHERE id = $3`,
        [status, errorMessage, id]
      );
    } else {
      await db.execute(
        `UPDATE whatsapp_message_logs
         SET status = $1
         WHERE id = $2`,
        [status, id]
      );
    }
  },

  /**
   * Get message count by direction for a channel
   */
  async getCountByDirection(
    channelId: string,
    since?: Date
  ): Promise<{ inbound: number; outbound: number }> {
    const whereClause = since
      ? 'WHERE channel_id = $1 AND created_at >= $2'
      : 'WHERE channel_id = $1';

    const params = since ? [channelId, since.toISOString()] : [channelId];

    const result = await db.query<{ direction: string; count: string }>(
      `SELECT direction, COUNT(*)::text as count
       FROM whatsapp_message_logs
       ${whereClause}
       GROUP BY direction`,
      params
    );

    const counts = { inbound: 0, outbound: 0 };
    for (const row of result) {
      if (row.direction === 'inbound') counts.inbound = parseInt(row.count, 10);
      if (row.direction === 'outbound') counts.outbound = parseInt(row.count, 10);
    }

    return counts;
  },

  /**
   * Check if logging is enabled for a channel
   */
  async isLoggingEnabled(channelId: string): Promise<boolean> {
    const result = await db.queryOne<{ loggingEnabled: boolean }>(
      `SELECT logging_enabled as "loggingEnabled" FROM channels WHERE id = $1`,
      [channelId]
    );

    return result?.loggingEnabled ?? true;
  },

  /**
   * Set logging enabled/disabled for a channel
   */
  async setLoggingEnabled(channelId: string, enabled: boolean): Promise<void> {
    await db.execute(
      `UPDATE channels SET logging_enabled = $1 WHERE id = $2`,
      [enabled, channelId]
    );
  },
};
