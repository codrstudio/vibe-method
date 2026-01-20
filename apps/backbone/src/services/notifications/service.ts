import { repository } from './repository.js';
import { emitToUser } from '../../lib/index.js';
import { incCounter, startTimer } from '../../health/collector.js';
import type {
  CreateNotificationInput,
  UpdateNotificationInput,
  Notification,
  CreateTaskInput,
  Task,
  TaskListOptions,
  TasksByTag,
} from './types.js';
import { taskClassRegistry } from '../task-classes/registry.js';
import { validateTransition, validateClose, getAllowedTransitions } from '../task-classes/validator.js';

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

// ============ Task Functions ============

/**
 * Create a new task from a task class
 */
export async function createTask(data: CreateTaskInput): Promise<Task> {
  const stopTimer = startTimer('tasks.latency.create');
  incCounter('tasks.created', 1, { class: data.class });

  try {
    // Get the task class definition
    const taskClass = taskClassRegistry.get(data.class);
    if (!taskClass) {
      throw new Error(`Task class '${data.class}' not found`);
    }

    // Build workflow and initial tags
    const workflow = taskClassRegistry.buildWorkflow(taskClass);
    const initialTags = taskClassRegistry.getInitialTags(taskClass);

    // Build meta tags
    const metaTags = [`class:${data.class}`];
    if (data.assigneeId) {
      metaTags.push(`assignee:${data.assigneeId}`);
    }

    const task = await repository.createTask({
      class: data.class,
      title: data.title,
      message: data.message,
      userId: data.userId,
      assigneeId: data.assigneeId,
      metadata: data.metadata,
      actionUrl: data.actionUrl,
      dueAt: data.dueAt,
      metaTags,
      tags: initialTags,
      workflow,
      color: taskClass.color,
      icon: taskClass.icon,
    });

    // Emit real-time event
    await emitToUser(data.userId, 'task:created', task);

    stopTimer();
    return task;
  } catch (error) {
    stopTimer();
    incCounter('tasks.errors', 1, { operation: 'create' });
    throw error;
  }
}

/**
 * Get task by ID
 */
export async function getTask(id: string): Promise<Task | null> {
  return repository.findTaskById(id);
}

/**
 * Get tasks for a user
 */
export async function getTasks(
  userId: string,
  options?: TaskListOptions
): Promise<Task[]> {
  return repository.findTasksByUser(userId, options);
}

/**
 * Get all tasks (admin)
 */
export async function getAllTasks(options?: TaskListOptions): Promise<Task[]> {
  return repository.findTasks(options);
}

/**
 * Transition a task to a new tag
 */
export async function transitionTask(
  id: string,
  targetTag: string
): Promise<{ task: Task; fromTags: string[]; toTag: string }> {
  const stopTimer = startTimer('tasks.latency.transition');

  try {
    const task = await repository.findTaskById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    // Validate the transition
    const validation = validateTransition(task.workflow, task.tags, targetTag);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fromTags = [...task.tags];

    // Remove any tags that are in the same "level" and add the new tag
    const newTags = task.tags.filter((t) => t !== targetTag);
    if (!newTags.includes(targetTag)) {
      newTags.push(targetTag);
    }

    const updatedTask = await repository.updateTaskTags(id, [targetTag]);
    if (!updatedTask) {
      throw new Error('Failed to update task tags');
    }

    incCounter('tasks.transitioned', 1, { class: task.class, toTag: targetTag });

    // Emit real-time event
    await emitToUser(task.userId, 'task:transitioned', {
      task: updatedTask,
      fromTags,
      toTag: targetTag,
    });

    stopTimer();
    return { task: updatedTask, fromTags, toTag: targetTag };
  } catch (error) {
    stopTimer();
    incCounter('tasks.errors', 1, { operation: 'transition' });
    throw error;
  }
}

/**
 * Close a task
 */
export async function closeTask(id: string): Promise<Task> {
  const stopTimer = startTimer('tasks.latency.close');

  try {
    const task = await repository.findTaskById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    // Validate close is allowed
    const validation = validateClose(task.workflow, task.tags);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const closedTask = await repository.closeTask(id);
    if (!closedTask) {
      throw new Error('Failed to close task');
    }

    incCounter('tasks.closed', 1, { class: task.class });

    // Emit real-time event
    await emitToUser(task.userId, 'task:closed', closedTask);

    stopTimer();
    return closedTask;
  } catch (error) {
    stopTimer();
    incCounter('tasks.errors', 1, { operation: 'close' });
    throw error;
  }
}

/**
 * Get open task count for a user
 */
export async function getOpenTaskCount(userId: string): Promise<number> {
  return repository.countOpenTasks(userId);
}

/**
 * Get tasks grouped by tag (for kanban view)
 */
export async function getTasksGroupedByTag(
  userId: string,
  taskClass?: string
): Promise<TasksByTag[]> {
  return repository.getTasksGroupedByTag(userId, taskClass);
}

/**
 * Get allowed transitions for a task
 */
export async function getTaskAllowedTransitions(id: string): Promise<string[]> {
  const task = await repository.findTaskById(id);
  if (!task) {
    throw new Error('Task not found');
  }

  return getAllowedTransitions(task.workflow, task.tags);
}
