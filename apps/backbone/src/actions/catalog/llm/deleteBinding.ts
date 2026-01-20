import { z } from 'zod';
import { registry } from '../../registry.js';
import { llmService } from '../../../llm/service.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  id: z.string().uuid(),
});

const outputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const deleteBinding: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'llm.deleteBinding',
  description: 'Remove um binding de LLM',
  keywords: ['llm', 'binding', 'remover', 'deletar', 'delete', 'remove'],
  inputSchema,
  outputSchema,
  permissions: ['llm:write'],

  async execute(input) {
    // Validate binding exists
    const existing = await llmService.getBinding(input.id);
    if (!existing) {
      throw new Error(`Binding not found: ${input.id}`);
    }

    const success = await llmService.deleteBinding(input.id);

    return {
      success,
      message: success
        ? `Binding ${input.id} removed successfully`
        : `Failed to remove binding ${input.id}`,
    };
  },
};

registry.register(deleteBinding);
