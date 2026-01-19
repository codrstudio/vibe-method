import { z } from 'zod';
import { registry } from '../../registry.js';
import { llmService } from '../../../llm/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({});

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
  version: z.string(),
  updatedAt: z.string(),
  models: z.array(modelSchema),
  providers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['cloud', 'embedded']),
      modelCount: z.number(),
    })
  ),
});

export const getCatalog: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'llm.getCatalog',
  description: 'Retorna o catalogo de modelos LLM disponiveis',
  keywords: ['llm', 'catalog', 'modelos', 'providers', 'catalogo', 'list'],
  inputSchema,
  outputSchema,
  permissions: ['llm:read'],

  async execute() {
    const catalog = llmService.getCatalog();

    if (!catalog) {
      return {
        version: '0.0',
        updatedAt: new Date().toISOString(),
        models: [],
        providers: [],
      };
    }

    const models = llmService.getAllModels();

    const providers = Object.entries(catalog.providers).map(([id, provider]) => ({
      id,
      name: provider.name,
      type: provider.type,
      modelCount: provider.models.length,
    }));

    return {
      version: catalog.version,
      updatedAt: catalog.updatedAt,
      models,
      providers,
    };
  },
};

registry.register(getCatalog);
