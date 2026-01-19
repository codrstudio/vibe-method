import { z } from 'zod';
import { registry } from '../../registry.js';
import { llmService, LLMBindingSchema } from '../../../llm/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  id: z.string().uuid(),
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  maxTokens: z.number().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().optional(),
});

const outputSchema = z.object({
  binding: LLMBindingSchema.nullable(),
});

export const updateBinding: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'llm.updateBinding',
  description: 'Atualiza um binding existente',
  keywords: ['llm', 'binding', 'atualizar', 'editar', 'update', 'modify'],
  inputSchema,
  outputSchema,
  permissions: ['llm:write'],

  async execute(input) {
    // Validate binding exists
    const existing = await llmService.getBinding(input.id);
    if (!existing) {
      throw new Error(`Binding not found: ${input.id}`);
    }

    // If changing provider/model, validate they exist
    const provider = input.provider ?? existing.provider;
    const model = input.model ?? existing.model;

    if (input.provider || input.model) {
      const allModels = llmService.getAllModels();
      const modelExists = allModels.some(
        (m) => m.id === model && m.provider === provider
      );

      if (!modelExists) {
        throw new Error(`Model not found in catalog: ${provider}/${model}`);
      }
    }

    const binding = await llmService.updateBinding(input.id, {
      provider: input.provider,
      model: input.model,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      isActive: input.isActive,
      priority: input.priority,
    });

    return { binding };
  },
};

registry.register(updateBinding);
