import { z } from 'zod';
import { registry } from '../../registry.js';
import { llmService } from '../../../llm/service.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  slug: z.string(),
});

const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  params: z.string(),
  capabilities: z.array(z.string()),
  costTier: z.string().optional(),
  provider: z.string(),
  providerName: z.string(),
  providerType: z.enum(['cloud', 'embedded']),
});

const outputSchema = z.object({
  models: z.array(modelSchema),
  total: z.number(),
  intentSlug: z.string(),
});

export const getModelsForIntent: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'llm.getModelsForIntent',
  description: 'Retorna modelos compativeis com o profile da intencao',
  keywords: ['llm', 'models', 'intent', 'modelos', 'compatíveis', 'filter'],
  inputSchema,
  outputSchema,
  permissions: ['llm:read'],

  async execute(input) {
    const models = await llmService.getModelsForIntent(input.slug);

    return {
      models,
      total: models.length,
      intentSlug: input.slug,
    };
  },
};

registry.register(getModelsForIntent);
