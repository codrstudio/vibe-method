import { z } from 'zod';

export const SanityResultSchema = z.object({
  success: z.boolean(),
  response: z.string().optional(),
  model: z.string(),
  provider: z.string(),
  latencyMs: z.number(),
  error: z.string().optional(),
});

export type SanityResult = z.infer<typeof SanityResultSchema>;

export interface SanityInput {
  intent?: string; // default: 'classify'
}
