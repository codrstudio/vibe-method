import { z } from 'zod';
import { registry } from '../../registry.js';
import { llmService, LLMIntentSchema, LLMBindingSchema } from '../../../llm/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  slug: z.string(),
});

const outputSchema = z.object({
  intent: LLMIntentSchema.extend({
    binding: LLMBindingSchema.nullable(),
  }).nullable(),
});

export const getIntent: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'llm.getIntent',
  description: 'Retorna detalhes de uma intencao de LLM por slug',
  keywords: ['llm', 'intent', 'obter', 'intencao', 'detalhe', 'get'],
  inputSchema,
  outputSchema,
  permissions: ['llm:read'],

  async execute(input) {
    const intents = await llmService.getIntentsWithBindings();
    const intent = intents.find((i) => i.slug === input.slug) ?? null;

    return { intent };
  },
};

registry.register(getIntent);
