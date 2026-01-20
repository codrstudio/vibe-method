import { z } from 'zod';
import type { TaskWorkflow, SlaConfig } from '../task-classes/types.js';

export const NotificationTypeEnum = z.enum(['info', 'warning', 'error', 'task']);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

export const NotificationStatusEnum = z.enum(['pending', 'read', 'archived']);
export type NotificationStatus = z.infer<typeof NotificationStatusEnum>;

export const CreateNotificationSchema = z.object({
  type: NotificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string(),
  userId: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
  actionUrl: z.string().url().optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

export const UpdateNotificationSchema = z.object({
  status: NotificationStatusEnum.optional(),
  readAt: z.string().datetime().optional(),
});

export type UpdateNotificationInput = z.infer<typeof UpdateNotificationSchema>;

// Base notification interface (without task fields)
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  status: NotificationStatus;
  metadata: Record<string, unknown> | null;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Extended notification interface with task fields
export interface Task extends Notification {
  class: string;
  metaTags: string[];
  tags: string[];
  workflow: TaskWorkflow;
  color: string | null;
  icon: string | null;
  assigneeId: string | null;
  dueAt: string | null;
  closedAt: string | null;
}

// Schema for creating a task
export const CreateTaskSchema = z.object({
  class: z.string().min(1),
  title: z.string().min(1).max(255),
  message: z.string(),
  userId: z.string().uuid(),
  assigneeId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  actionUrl: z.string().url().optional(),
  dueAt: z.string().datetime().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

// Schema for transitioning a task
export const TransitionTaskSchema = z.object({
  targetTag: z.string().min(1),
});

export type TransitionTaskInput = z.infer<typeof TransitionTaskSchema>;

// Task list filter options
export interface TaskListOptions {
  class?: string;
  tag?: string;
  assigneeId?: string;
  status?: 'open' | 'closed';
  limit?: number;
  offset?: number;
}

// Task grouped by tag (for kanban)
export interface TasksByTag {
  tag: string;
  tasks: Task[];
}

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  type: NotificationTypeEnum,
  title: z.string(),
  message: z.string(),
  userId: z.string().uuid(),
  status: NotificationStatusEnum,
  metadata: z.record(z.unknown()).nullable(),
  actionUrl: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TaskSchema = NotificationSchema.extend({
  class: z.string(),
  metaTags: z.array(z.string()),
  tags: z.array(z.string()),
  workflow: z.object({
    className: z.string(),
    transitions: z.record(z.string(), z.array(z.string())),
    closeRequires: z.array(z.string()),
    sla: z
      .object({
        warning: z.string().optional(),
        critical: z.string().optional(),
      })
      .optional(),
  }),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  assigneeId: z.string().nullable(),
  dueAt: z.string().nullable(),
  closedAt: z.string().nullable(),
});
