import { z } from 'zod';
import { db } from '../../../lib/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  userId: z.string().uuid().optional(),
  displayName: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  preferences: z.record(z.unknown()).optional(),
});

const outputSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  avatar: z.string().nullable(),
  preferences: z.record(z.unknown()),
  updatedAt: z.string(),
});

export const userUpdate: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'user.update',
  description: 'Update user profile information',
  keywords: ['user', 'profile', 'update', 'edit', 'settings'],
  inputSchema,
  outputSchema,
  permissions: ['user:update'],

  async execute(input, context) {
    const targetUserId = input.userId ?? context.userId;

    // Users can only update their own profile unless admin
    if (targetUserId !== context.userId && !context.permissions.includes('admin')) {
      throw new Error('Cannot update other user profiles');
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.displayName) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(input.displayName);
    }

    if (input.avatar) {
      updates.push(`avatar = $${paramIndex++}`);
      values.push(input.avatar);
    }

    if (input.preferences) {
      updates.push(`preferences = preferences || $${paramIndex++}`);
      values.push(JSON.stringify(input.preferences));
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(targetUserId);

    const [user] = await db.query<z.infer<typeof outputSchema>>(
      `UPDATE users
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING id, display_name as "displayName", avatar,
                 preferences, updated_at as "updatedAt"`,
      values
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
};
