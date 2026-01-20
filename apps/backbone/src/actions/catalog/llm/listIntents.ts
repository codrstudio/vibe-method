import { z } from 'zod';
import { registry } from '../../registry.js';
import { llmService } from '../../../llm/service.js';
import { LLMIntentSchema, LLMBindingSchema } from '../../../llm/types.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  withBindings: z.boolean().optional().default(true),
});

const intentWithBindingSchema = LLMIntentSchema.extend({
  binding: LLMBindingSchema.nullable(),
});

const outputSchema = z.object({
  intents: z.array(z.union([LLMIntentSchema, intentWithBindingSchema])),
  total: z.number(),
});

export const listIntents: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'llm.listIntents',
  description: 'Lista todas as intencoes de LLM com seus bindings ativos',
  keywords: ['llm', 'intents', 'listar', 'intencoes', 'modelos', 'list'],
  inputSchema,
  outputSchema,
  permissions: ['llm:read'],

  async execute(input) {
    const intents = input.withBindings
      ? await llmService.getIntentsWithBindings()
      : await llmService.getIntents();

    return {
      intents,
      total: intents.length,
    };
  },
};

registry.register(listIntents);
