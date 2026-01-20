import type { FastifyPluginAsync } from 'fastify';
import {
  createTask,
  getTasks,
  getTask,
  transitionTask,
  closeTask,
  getTasksGroupedByTag,
  getOpenTaskCount,
  CreateTaskSchema,
  TransitionTaskSchema,
} from '../../services/notifications/index.js';
import { taskClassRegistry } from '../../services/task-classes/index.js';

export const tasksRoutes: FastifyPluginAsync = async (fastify) => {
  // TODO: Add auth middleware to get userId from token
  const getUserId = (request: { headers: { 'x-user-id'?: string } }) => {
    return request.headers['x-user-id'] ?? 'anonymous';
  };

  // List task classes
  fastify.get('/tasks/classes', async (_request, reply) => {
    const classes = taskClassRegistry.getAll();

    return reply.send({
      data: classes.map((c) => ({
        name: c.name,
        displayName: c.displayName,
        description: c.description,
        icon: c.icon,
        color: c.color,
        tags: c.tags,
        closeRequires: c.closeRequires,
        tagConfig: c.tagConfig,
      })),
    });
  });

  // List tasks
  fastify.get<{
    Querystring: {
      class?: string;
      tag?: string;
      assigneeId?: string;
      status?: 'open' | 'closed';
      limit?: string;
      offset?: string;
    };
  }>('/tasks', async (request, reply) => {
    const userId = getUserId(request);
    const { class: taskClass, tag, assigneeId, status, limit, offset } = request.query;

    const tasks = await getTasks(userId, {
      class: taskClass,
      tag,
      assigneeId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return reply.send({ data: tasks });
  });

  // Get tasks grouped by tag (for kanban)
  fastify.get<{
    Querystring: { class?: string };
  }>('/tasks/grouped', async (request, reply) => {
    const userId = getUserId(request);
    const { class: taskClass } = request.query;

    const grouped = await getTasksGroupedByTag(userId, taskClass);

    return reply.send({ data: grouped });
  });

  // Get open task count
  fastify.get('/tasks/count', async (request, reply) => {
    const userId = getUserId(request);
    const count = await getOpenTaskCount(userId);

    return reply.send({ data: { count } });
  });

  // Get single task
  fastify.get<{ Params: { id: string } }>('/tasks/:id', async (request, reply) => {
    const task = await getTask(request.params.id);

    if (!task) {
      return reply.notFound('Task not found');
    }

    return reply.send({ data: task });
  });

  // Create task
  fastify.post<{ Body: unknown }>('/tasks', async (request, reply) => {
    const userId = getUserId(request);
    const result = CreateTaskSchema.safeParse({
      ...(request.body as Record<string, unknown>),
      userId,
    });

    if (!result.success) {
      return reply.badRequest(result.error.message);
    }

    try {
      const task = await createTask(result.data);
      return reply.status(201).send({ data: task });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.badRequest(message);
    }
  });

  // Transition task
  fastify.post<{ Params: { id: string }; Body: unknown }>(
    '/tasks/:id/transition',
    async (request, reply) => {
      const result = TransitionTaskSchema.safeParse(request.body);

      if (!result.success) {
        return reply.badRequest(result.error.message);
      }

      try {
        const transitionResult = await transitionTask(request.params.id, result.data.targetTag);
        return reply.send({ data: transitionResult });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.badRequest(message);
      }
    }
  );

  // Close task
  fastify.post<{ Params: { id: string } }>('/tasks/:id/close', async (request, reply) => {
    try {
      const task = await closeTask(request.params.id);
      return reply.send({ data: task });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.badRequest(message);
    }
  });
};
