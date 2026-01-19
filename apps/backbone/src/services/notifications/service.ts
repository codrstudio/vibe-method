import { repository } from './repository.js';
import { emitToUser } from '../../lib/index.js';
import { incCounter, startTimer } from '../../health/collector.js';
import type {
  CreateNotificationInput,
  UpdateNotificationInput,
  Notification,
} from './types.js';

/**
 * Create a new notification and emit real-time event
 */
export async function createNotification(
  data: CreateNotificationInput
): Promise<Notification> {
  const stopTimer = startTimer('notifications.latency.create');
  incCounter('notifications.created', 1, { type: data.type });

  try {
    const notification = await repository.create(data);

    // Emit real-time event to user
    await emitToUser(data.userId, 'notification:new', notification);
    incCounter('notifications.delivered');

    stopTimer();
    return notification;
  } catch (error) {
    stopTimer();
    incCounter('notifications.errors', 1, { operation: 'create' });
    throw error;
  }
}

/**
 * Get notification by ID
 */
export async function getNotification(id: string): Promise<Notification | null> {
  return repository.findById(id);
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  options?: { status?: string; limit?: number; offset?: number }
): Promise<Notification[]> {
  return repository.findByUser(userId, options);
}

/**
 * Update a notification
 */
export async function updateNotification(
  id: string,
  userId: string,
  data: UpdateNotificationInput
): Promise<Notification | null> {
  const notification = await repository.update(id, userId, data);

  if (notification) {
    await emitToUser(userId, 'notification:updated', notification);
  }

  return notification;
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  id: string,
  userId: string
): Promise<Notification | null> {
  incCounter('notifications.read');

  const notification = await repository.markRead(id, userId);

  if (notification) {
    await emitToUser(userId, 'notification:updated', notification);
  }

  return notification;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const stopTimer = startTimer('notifications.latency.mark_all_read');

  const notifications = await repository.findByUser(userId, { status: 'pending' });

  let count = 0;
  for (const n of notifications) {
    const updated = await repository.markRead(n.id, userId);
    if (updated) count++;
  }

  if (count > 0) {
    incCounter('notifications.read', count);
    await emitToUser(userId, 'notification:all-read', { count });
  }

  stopTimer();
  return count;
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  id: string,
  userId: string
): Promise<boolean> {
  const deleted = await repository.delete(id, userId);

  if (deleted) {
    await emitToUser(userId, 'notification:deleted', { id });
  }

  return deleted;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return repository.countUnread(userId);
}
