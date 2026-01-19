import { db } from '../../lib/index.js';
import type {
  Channel,
  Operation,
  Assignment,
  ChannelEvent,
  CreateChannelInput,
  UpdateChannelStatusInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  CreateChannelEventInput,
  ChannelStatus,
} from './types.js';

// =============================================================================
// Channels Repository
// =============================================================================

export const channelsRepository = {
  async create(input: CreateChannelInput & { instanceName: string }): Promise<Channel> {
    const [channel] = await db.query<Channel>(
      `INSERT INTO channels (name, description, instance_name, status, created_by)
       VALUES ($1, $2, $3, 'qr_pending', $4)
       RETURNING
         id, name, description,
         instance_name as "instanceName",
         instance_id as "instanceId",
         phone_number as "phoneNumber",
         status,
         status_reason as "statusReason",
         qr_code as "qrCode",
         qr_code_expires_at as "qrCodeExpiresAt",
         connection_data as "connectionData",
         retry_count as "retryCount",
         last_disconnect_reason as "lastDisconnectReason",
         last_disconnect_at as "lastDisconnectAt",
         last_health_check as "lastHealthCheck",
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"`,
      [input.name, input.description ?? null, input.instanceName, input.createdBy ?? null]
    );

    return channel;
  },

  async findById(id: string): Promise<Channel | null> {
    return db.queryOne<Channel>(
      `SELECT
         id, name, description,
         instance_name as "instanceName",
         instance_id as "instanceId",
         phone_number as "phoneNumber",
         status,
         status_reason as "statusReason",
         qr_code as "qrCode",
         qr_code_expires_at as "qrCodeExpiresAt",
         connection_data as "connectionData",
         retry_count as "retryCount",
         last_disconnect_reason as "lastDisconnectReason",
         last_disconnect_at as "lastDisconnectAt",
         last_health_check as "lastHealthCheck",
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"
       FROM channels
       WHERE id = $1`,
      [id]
    );
  },

  async findByInstanceName(instanceName: string): Promise<Channel | null> {
    return db.queryOne<Channel>(
      `SELECT
         id, name, description,
         instance_name as "instanceName",
         instance_id as "instanceId",
         phone_number as "phoneNumber",
         status,
         status_reason as "statusReason",
         qr_code as "qrCode",
         qr_code_expires_at as "qrCodeExpiresAt",
         connection_data as "connectionData",
         retry_count as "retryCount",
         last_disconnect_reason as "lastDisconnectReason",
         last_disconnect_at as "lastDisconnectAt",
         last_health_check as "lastHealthCheck",
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"
       FROM channels
       WHERE instance_name = $1`,
      [instanceName]
    );
  },

  async findAll(): Promise<Channel[]> {
    return db.query<Channel>(
      `SELECT
         id, name, description,
         instance_name as "instanceName",
         instance_id as "instanceId",
         phone_number as "phoneNumber",
         status,
         status_reason as "statusReason",
         qr_code as "qrCode",
         qr_code_expires_at as "qrCodeExpiresAt",
         connection_data as "connectionData",
         retry_count as "retryCount",
         last_disconnect_reason as "lastDisconnectReason",
         last_disconnect_at as "lastDisconnectAt",
         last_health_check as "lastHealthCheck",
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"
       FROM channels
       ORDER BY created_at DESC`
    );
  },

  async findByStatus(status: ChannelStatus): Promise<Channel[]> {
    return db.query<Channel>(
      `SELECT
         id, name, description,
         instance_name as "instanceName",
         instance_id as "instanceId",
         phone_number as "phoneNumber",
         status,
         status_reason as "statusReason",
         qr_code as "qrCode",
         qr_code_expires_at as "qrCodeExpiresAt",
         connection_data as "connectionData",
         retry_count as "retryCount",
         last_disconnect_reason as "lastDisconnectReason",
         last_disconnect_at as "lastDisconnectAt",
         last_health_check as "lastHealthCheck",
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"
       FROM channels
       WHERE status = $1
       ORDER BY created_at DESC`,
      [status]
    );
  },

  async updateStatus(id: string, updates: UpdateChannelStatusInput): Promise<Channel | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (updates.statusReason !== undefined) {
      setClauses.push(`status_reason = $${paramIndex++}`);
      values.push(updates.statusReason);
    }

    if (updates.phoneNumber !== undefined) {
      setClauses.push(`phone_number = $${paramIndex++}`);
      values.push(updates.phoneNumber);
    }

    if (updates.qrCode !== undefined) {
      setClauses.push(`qr_code = $${paramIndex++}`);
      values.push(updates.qrCode);
    }

    if (updates.qrCodeExpiresAt !== undefined) {
      setClauses.push(`qr_code_expires_at = $${paramIndex++}`);
      values.push(updates.qrCodeExpiresAt);
    }

    if (updates.connectionData !== undefined) {
      setClauses.push(`connection_data = $${paramIndex++}`);
      values.push(JSON.stringify(updates.connectionData));
    }

    if (updates.retryCount !== undefined) {
      setClauses.push(`retry_count = $${paramIndex++}`);
      values.push(updates.retryCount);
    }

    if (updates.lastDisconnectReason !== undefined) {
      setClauses.push(`last_disconnect_reason = $${paramIndex++}`);
      values.push(updates.lastDisconnectReason);
    }

    if (updates.lastDisconnectAt !== undefined) {
      setClauses.push(`last_disconnect_at = $${paramIndex++}`);
      values.push(updates.lastDisconnectAt);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const [channel] = await db.query<Channel>(
      `UPDATE channels
       SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING
         id, name, description,
         instance_name as "instanceName",
         instance_id as "instanceId",
         phone_number as "phoneNumber",
         status,
         status_reason as "statusReason",
         qr_code as "qrCode",
         qr_code_expires_at as "qrCodeExpiresAt",
         connection_data as "connectionData",
         retry_count as "retryCount",
         last_disconnect_reason as "lastDisconnectReason",
         last_disconnect_at as "lastDisconnectAt",
         last_health_check as "lastHealthCheck",
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"`,
      values
    );

    return channel ?? null;
  },

  async updateInstanceId(id: string, instanceId: string): Promise<void> {
    await db.execute(
      `UPDATE channels SET instance_id = $1, updated_at = NOW() WHERE id = $2`,
      [instanceId, id]
    );
  },

  async updateHealthCheck(id: string): Promise<void> {
    await db.execute(
      `UPDATE channels SET last_health_check = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  },

  async delete(id: string): Promise<boolean> {
    const count = await db.execute(`DELETE FROM channels WHERE id = $1`, [id]);
    return count > 0;
  },
};

// =============================================================================
// Operations Repository
// =============================================================================

export const operationsRepository = {
  async findById(id: string): Promise<Operation | null> {
    return db.queryOne<Operation>(
      `SELECT
         id, slug, name, description, nature,
         declared_by as "declaredBy",
         event_interests as "eventInterests",
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM operations
       WHERE id = $1`,
      [id]
    );
  },

  async findBySlug(slug: string): Promise<Operation | null> {
    return db.queryOne<Operation>(
      `SELECT
         id, slug, name, description, nature,
         declared_by as "declaredBy",
         event_interests as "eventInterests",
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM operations
       WHERE slug = $1`,
      [slug]
    );
  },

  async findAll(): Promise<Operation[]> {
    return db.query<Operation>(
      `SELECT
         id, slug, name, description, nature,
         declared_by as "declaredBy",
         event_interests as "eventInterests",
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM operations
       ORDER BY name ASC`
    );
  },

  async findByNature(nature: 'system' | 'user'): Promise<Operation[]> {
    return db.query<Operation>(
      `SELECT
         id, slug, name, description, nature,
         declared_by as "declaredBy",
         event_interests as "eventInterests",
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM operations
       WHERE nature = $1
       ORDER BY name ASC`,
      [nature]
    );
  },
};

// =============================================================================
// Channel Operations (Assignments) Repository
// =============================================================================

export const assignmentsRepository = {
  async create(input: CreateAssignmentInput): Promise<Assignment> {
    const [assignment] = await db.query<Assignment>(
      `INSERT INTO channel_operations (channel_id, operation_id, user_id, priority, notification_email, notification_phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         channel_id as "channelId",
         operation_id as "operationId",
         user_id as "userId",
         priority,
         is_active as "isActive",
         notification_email as "notificationEmail",
         notification_phone as "notificationPhone",
         created_at as "createdAt"`,
      [
        input.channelId,
        input.operationId,
        input.userId ?? null,
        input.priority ?? 0,
        input.notificationEmail ?? null,
        input.notificationPhone ?? null,
      ]
    );

    return assignment;
  },

  async findById(id: string): Promise<Assignment | null> {
    return db.queryOne<Assignment>(
      `SELECT
         id,
         channel_id as "channelId",
         operation_id as "operationId",
         user_id as "userId",
         priority,
         is_active as "isActive",
         notification_email as "notificationEmail",
         notification_phone as "notificationPhone",
         created_at as "createdAt"
       FROM channel_operations
       WHERE id = $1`,
      [id]
    );
  },

  async findByChannel(channelId: string): Promise<Assignment[]> {
    return db.query<Assignment>(
      `SELECT
         id,
         channel_id as "channelId",
         operation_id as "operationId",
         user_id as "userId",
         priority,
         is_active as "isActive",
         notification_email as "notificationEmail",
         notification_phone as "notificationPhone",
         created_at as "createdAt"
       FROM channel_operations
       WHERE channel_id = $1
       ORDER BY priority DESC`,
      [channelId]
    );
  },

  async findByOperation(operationId: string, activeOnly = true): Promise<Assignment[]> {
    const whereClause = activeOnly
      ? 'WHERE operation_id = $1 AND is_active = true'
      : 'WHERE operation_id = $1';

    return db.query<Assignment>(
      `SELECT
         id,
         channel_id as "channelId",
         operation_id as "operationId",
         user_id as "userId",
         priority,
         is_active as "isActive",
         notification_email as "notificationEmail",
         notification_phone as "notificationPhone",
         created_at as "createdAt"
       FROM channel_operations
       ${whereClause}
       ORDER BY priority DESC`,
      [operationId]
    );
  },

  async findByOperationAndUser(operationId: string, userId: string): Promise<Assignment | null> {
    return db.queryOne<Assignment>(
      `SELECT
         id,
         channel_id as "channelId",
         operation_id as "operationId",
         user_id as "userId",
         priority,
         is_active as "isActive",
         notification_email as "notificationEmail",
         notification_phone as "notificationPhone",
         created_at as "createdAt"
       FROM channel_operations
       WHERE operation_id = $1 AND user_id = $2 AND is_active = true`,
      [operationId, userId]
    );
  },

  async update(id: string, updates: UpdateAssignmentInput): Promise<Assignment | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex++}`);
      values.push(updates.priority);
    }

    if (updates.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    if (updates.notificationEmail !== undefined) {
      setClauses.push(`notification_email = $${paramIndex++}`);
      values.push(updates.notificationEmail);
    }

    if (updates.notificationPhone !== undefined) {
      setClauses.push(`notification_phone = $${paramIndex++}`);
      values.push(updates.notificationPhone);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const [assignment] = await db.query<Assignment>(
      `UPDATE channel_operations
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING
         id,
         channel_id as "channelId",
         operation_id as "operationId",
         user_id as "userId",
         priority,
         is_active as "isActive",
         notification_email as "notificationEmail",
         notification_phone as "notificationPhone",
         created_at as "createdAt"`,
      values
    );

    return assignment ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const count = await db.execute(`DELETE FROM channel_operations WHERE id = $1`, [id]);
    return count > 0;
  },
};

// =============================================================================
// Channel Events Repository
// =============================================================================

export const eventsRepository = {
  async create(input: CreateChannelEventInput): Promise<ChannelEvent> {
    const [event] = await db.query<ChannelEvent>(
      `INSERT INTO channel_events (channel_id, event_type, payload)
       VALUES ($1, $2, $3)
       RETURNING
         id,
         channel_id as "channelId",
         event_type as "eventType",
         payload,
         processed,
         created_at as "createdAt"`,
      [input.channelId, input.eventType, JSON.stringify(input.payload)]
    );

    return event;
  },

  async markProcessed(id: string): Promise<void> {
    await db.execute(
      `UPDATE channel_events SET processed = true WHERE id = $1`,
      [id]
    );
  },

  async findRecent(channelId: string, limit = 50): Promise<ChannelEvent[]> {
    return db.query<ChannelEvent>(
      `SELECT
         id,
         channel_id as "channelId",
         event_type as "eventType",
         payload,
         processed,
         created_at as "createdAt"
       FROM channel_events
       WHERE channel_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [channelId, limit]
    );
  },

  async findUnprocessed(channelId: string): Promise<ChannelEvent[]> {
    return db.query<ChannelEvent>(
      `SELECT
         id,
         channel_id as "channelId",
         event_type as "eventType",
         payload,
         processed,
         created_at as "createdAt"
       FROM channel_events
       WHERE channel_id = $1 AND processed = false
       ORDER BY created_at ASC`,
      [channelId]
    );
  },
};
