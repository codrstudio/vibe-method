import { z } from 'zod';
import { db } from '../../../lib/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  channelId: z.string().uuid(),
});

const outputSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string().nullable(),
  channelId: z.string().uuid(),
  authorId: z.string().uuid(),
  createdAt: z.string(),
});

export const threadCreate: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'thread.create',
  description: 'Create a new thread in a channel',
  keywords: ['thread', 'create', 'new', 'conversation', 'topic'],
  inputSchema,
  outputSchema,
  permissions: ['thread:create'],

  async execute(input, context) {
    const [thread] = await db.query<z.infer<typeof outputSchema>>(
      `INSERT INTO threads (title, content, channel_id, author_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, content, channel_id as "channelId",
                 author_id as "authorId", created_at as "createdAt"`,
      [input.title, input.content ?? null, input.channelId, context.userId]
    );

    return thread;
  },
};
