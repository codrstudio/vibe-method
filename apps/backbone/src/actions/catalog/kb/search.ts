import { z } from 'zod';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(10),
  filters: z
    .object({
      type: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

const outputSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      snippet: z.string(),
      score: z.number(),
      type: z.string(),
    })
  ),
  total: z.number(),
});

export const kbSearch: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'kb.search',
  description: 'Search the knowledge base for relevant documents',
  keywords: ['knowledge', 'search', 'find', 'query', 'documents'],
  inputSchema,
  outputSchema,
  permissions: ['kb:read'],

  async execute(input, _context) {
    // TODO: Integrate with Meilisearch
    // Placeholder implementation
    return {
      results: [],
      total: 0,
    };
  },
};
