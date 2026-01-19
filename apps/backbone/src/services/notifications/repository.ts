import { db } from '../../lib/index.js';
import type {
  Notification,
  CreateNotificationInput,
  UpdateNotificationInput,
} from './types.js';

export const repository = {
  async create(data: CreateNotificationInput): Promise<Notification> {
    const [notification] = await db.query<Notification>(
      `INSERT INTO notifications (type, title, message, user_id, metadata, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id, type, title, message,
         user_id as "userId",
         status,
         metadata,
         action_url as "actionUrl",
         read_at as "readAt",
         created_at as "createdAt",
         updated_at as "updatedAt"`,
      [
        data.type,
        data.title,
        data.message,
        data.userId,
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.actionUrl ?? null,
      ]
    );

    return notification;
  },

  async findById(id: string): Promise<Notification | null> {
    return db.queryOne<Notification>(
      `SELECT
         id, type, title, message,
         user_id as "userId",
         status,
         metadata,
         action_url as "actionUrl",
         read_at as "readAt",
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM notifications
       WHERE id = $1`,
      [id]
    );
  },

  async findByUser(
    userId: string,
    options?: { status?: string; limit?: number; offset?: number }
  ): Promise<Notification[]> {
    const { status, limit = 50, offset = 0 } = options ?? {};

    let query = `
      SELECT
        id, type, title, message,
        user_id as "userId",
        status,
        metadata,
        action_url as "actionUrl",
        read_at as "readAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM notifications
      WHERE user_id = $1
    `;

    const params: unknown[] = [userId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    return db.query<Notification>(query, params);
  },

  async update(id: string, userId: string, data: UpdateNotificationInput): Promise<Notification | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    if (data.readAt) {
      updates.push(`read_at = $${paramIndex++}`);
      values.push(data.readAt);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, userId);

    const [notification] = await db.query<Notification>(
      `UPDATE notifications
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING
         id, type, title, message,
         user_id as "userId",
         status,
         metadata,
         action_url as "actionUrl",
         read_at as "readAt",
         created_at as "createdAt",
         updated_at as "updatedAt"`,
      values
    );

    return notification ?? null;
  },

  async markRead(id: string, userId: string): Promise<Notification | null> {
    return this.update(id, userId, {
      status: 'read',
      readAt: new Date().toISOString(),
    });
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const count = await db.execute(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return count > 0;
  },

  async countUnread(userId: string): Promise<number> {
    const [result] = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    return parseInt(result?.count ?? '0', 10);
  },
};
