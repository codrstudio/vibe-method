import { z } from 'zod';
import { registry } from '../../registry.js';
import { llmService, LLMBindingSchema } from '../../../llm/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  intentId: z.string().uuid(),
  provider: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

const outputSchema = z.object({
  binding: LLMBindingSchema,
});

export const createBinding: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'llm.createBinding',
  description: 'Cria um binding entre uma intencao e um modelo LLM',
  keywords: ['llm', 'binding', 'criar', 'configurar', 'modelo', 'create'],
  inputSchema,
  outputSchema,
  permissions: ['llm:write'],

  async execute(input, context) {
    // Validate intent exists
    const intent = await llmService.getIntentById(input.intentId);
    if (!intent) {
      throw new Error(`Intent not found: ${input.intentId}`);
    }

    // Validate model exists in catalog
    const models = await llmService.getModelsForIntentById(input.intentId);
    const modelExists = models.some(
      (m) => m.id === input.model && m.provider === input.provider
    );

    if (!modelExists) {
      // Check if model exists at all (maybe doesn't match profile)
      const allModels = llmService.getAllModels();
      const modelInCatalog = allModels.some(
        (m) => m.id === input.model && m.provider === input.provider
      );

      if (!modelInCatalog) {
        throw new Error(`Model not found in catalog: ${input.provider}/${input.model}`);
      }

      // Model exists but doesn't match profile - warn but allow
      console.warn(
        `[LLM] Model ${input.provider}/${input.model} doesn't match profile for intent ${intent.slug}`
      );
    }

    const binding = await llmService.createBinding({
      intentId: input.intentId,
      provider: input.provider,
      model: input.model,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      createdBy: context.userId,
    });

    return { binding };
  },
};

registry.register(createBinding);
