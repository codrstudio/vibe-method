import { db } from '../../lib/index.js';
import type {
  Notification,
  CreateNotificationInput,
  UpdateNotificationInput,
  Task,
  TaskListOptions,
  TasksByTag,
} from './types.js';
import type { TaskWorkflow } from '../task-classes/types.js';

// Base SELECT columns for notifications
const NOTIFICATION_COLUMNS = `
  id, type, title, message,
  user_id as "userId",
  status,
  metadata,
  action_url as "actionUrl",
  read_at as "readAt",
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

// Extended SELECT columns for tasks
const TASK_COLUMNS = `
  ${NOTIFICATION_COLUMNS},
  class,
  meta_tags as "metaTags",
  tags,
  workflow,
  color,
  icon,
  assignee_id as "assigneeId",
  due_at as "dueAt",
  closed_at as "closedAt"
`;

export const repository = {
  async create(data: CreateNotificationInput): Promise<Notification> {
    const [notification] = await db.query<Notification>(
      `INSERT INTO notifications (type, title, message, user_id, metadata, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${NOTIFICATION_COLUMNS}`,
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
      `SELECT ${NOTIFICATION_COLUMNS} FROM notifications WHERE id = $1`,
      [id]
    );
  },

  async findByUser(
    userId: string,
    options?: { status?: string; limit?: number; offset?: number; excludeTasks?: boolean }
  ): Promise<Notification[]> {
    const { status, limit = 50, offset = 0, excludeTasks = false } = options ?? {};

    let query = `
      SELECT ${NOTIFICATION_COLUMNS}
      FROM notifications
      WHERE user_id = $1
    `;

    const params: unknown[] = [userId];

    if (excludeTasks) {
      query += ` AND class IS NULL`;
    }

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
       RETURNING ${NOTIFICATION_COLUMNS}`,
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
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND status = 'pending' AND class IS NULL`,
      [userId]
    );
    return parseInt(result?.count ?? '0', 10);
  },

  // ============ Task-specific methods ============

  async createTask(data: {
    class: string;
    title: string;
    message: string;
    userId: string;
    assigneeId?: string;
    metadata?: Record<string, unknown>;
    actionUrl?: string;
    dueAt?: string;
    metaTags: string[];
    tags: string[];
    workflow: TaskWorkflow;
    color: string;
    icon: string;
  }): Promise<Task> {
    const [task] = await db.query<Task>(
      `INSERT INTO notifications (
        type, class, title, message, user_id, assignee_id,
        metadata, action_url, due_at,
        meta_tags, tags, workflow, color, icon
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING ${TASK_COLUMNS}`,
      [
        'task',
        data.class,
        data.title,
        data.message,
        data.userId,
        data.assigneeId ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.actionUrl ?? null,
        data.dueAt ?? null,
        JSON.stringify(data.metaTags),
        JSON.stringify(data.tags),
        JSON.stringify(data.workflow),
        data.color,
        data.icon,
      ]
    );

    return task;
  },

  async findTaskById(id: string): Promise<Task | null> {
    return db.queryOne<Task>(
      `SELECT ${TASK_COLUMNS} FROM notifications WHERE id = $1 AND class IS NOT NULL`,
      [id]
    );
  },

  async findTasks(options: TaskListOptions = {}): Promise<Task[]> {
    const { class: taskClass, tag, assigneeId, status, limit = 50, offset = 0 } = options;

    let query = `SELECT ${TASK_COLUMNS} FROM notifications WHERE class IS NOT NULL`;
    const params: unknown[] = [];

    if (taskClass) {
      params.push(taskClass);
      query += ` AND class = $${params.length}`;
    }

    if (tag) {
      params.push(JSON.stringify([tag]));
      query += ` AND tags @> $${params.length}`;
    }

    if (assigneeId) {
      params.push(assigneeId);
      query += ` AND assignee_id = $${params.length}`;
    }

    if (status === 'open') {
      query += ` AND closed_at IS NULL`;
    } else if (status === 'closed') {
      query += ` AND closed_at IS NOT NULL`;
    }

    query += ` ORDER BY created_at DESC`;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    return db.query<Task>(query, params);
  },

  async findTasksByUser(userId: string, options: TaskListOptions = {}): Promise<Task[]> {
    const { class: taskClass, tag, assigneeId, status, limit = 50, offset = 0 } = options;

    let query = `SELECT ${TASK_COLUMNS} FROM notifications WHERE class IS NOT NULL AND user_id = $1`;
    const params: unknown[] = [userId];

    if (taskClass) {
      params.push(taskClass);
      query += ` AND class = $${params.length}`;
    }

    if (tag) {
      params.push(JSON.stringify([tag]));
      query += ` AND tags @> $${params.length}`;
    }

    if (assigneeId) {
      params.push(assigneeId);
      query += ` AND assignee_id = $${params.length}`;
    }

    if (status === 'open') {
      query += ` AND closed_at IS NULL`;
    } else if (status === 'closed') {
      query += ` AND closed_at IS NOT NULL`;
    }

    query += ` ORDER BY created_at DESC`;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    return db.query<Task>(query, params);
  },

  async updateTaskTags(id: string, tags: string[]): Promise<Task | null> {
    const [task] = await db.query<Task>(
      `UPDATE notifications
       SET tags = $1, updated_at = NOW()
       WHERE id = $2 AND class IS NOT NULL
       RETURNING ${TASK_COLUMNS}`,
      [JSON.stringify(tags), id]
    );

    return task ?? null;
  },

  async closeTask(id: string): Promise<Task | null> {
    const [task] = await db.query<Task>(
      `UPDATE notifications
       SET closed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND class IS NOT NULL
       RETURNING ${TASK_COLUMNS}`,
      [id]
    );

    return task ?? null;
  },

  async countOpenTasks(userId: string): Promise<number> {
    const [result] = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND class IS NOT NULL AND closed_at IS NULL`,
      [userId]
    );
    return parseInt(result?.count ?? '0', 10);
  },

  async getTasksGroupedByTag(userId: string, taskClass?: string): Promise<TasksByTag[]> {
    let query = `
      SELECT DISTINCT jsonb_array_elements_text(tags) as tag
      FROM notifications
      WHERE user_id = $1 AND class IS NOT NULL AND closed_at IS NULL
    `;
    const params: unknown[] = [userId];

    if (taskClass) {
      params.push(taskClass);
      query += ` AND class = $${params.length}`;
    }

    const tagResults = await db.query<{ tag: string }>(query, params);
    const tags = tagResults.map((r) => r.tag);

    const grouped: TasksByTag[] = [];

    for (const tag of tags) {
      const tasks = await this.findTasksByUser(userId, {
        class: taskClass,
        tag,
        status: 'open',
      });
      grouped.push({ tag, tasks });
    }

    return grouped;
  },
};
