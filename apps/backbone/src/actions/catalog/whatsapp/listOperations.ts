import { z } from 'zod';
import { registry } from '../../registry.js';
import { whatsappService, OperationSchema } from '../../../services/whatsapp/index.js';
import type { ActionDefinition } from '../../types.js';

const inputSchema = z.object({
  nature: z.enum(['system', 'user']).optional(),
});

const outputSchema = z.object({
  operations: z.array(OperationSchema),
  total: z.number(),
});

export const listOperations: ActionDefinition<typeof inputSchema, typeof outputSchema> = {
  name: 'whatsapp.listOperations',
  description: 'Lista todas as operacoes (canais) disponiveis para atribuicao',
  keywords: ['whatsapp', 'listar', 'operacoes', 'canais', 'operations', 'list'],
  inputSchema,
  outputSchema,
  permissions: ['whatsapp:read'],

  async execute(input) {
    const operations = await whatsappService.listOperations();

    const filtered = input.nature
      ? operations.filter((o) => o.nature === input.nature)
      : operations;

    return {
      operations: filtered,
      total: filtered.length,
    };
  },
};

registry.register(listOperations);
