import { z } from 'zod';

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
