/**
 * CONFIG - Environment Variables
 *
 * Validacao de variaveis de ambiente usando Zod.
 * Falha no startup se variaveis obrigatorias estiverem faltando.
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(8000),

  // Database
  DATABASE_URL: z.string().min(1),

  // OpenRouter LLM
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_DEFAULT_MODEL: z.string().default('google/gemini-2.0-flash-001'),

  // Redis (opcional)
  REDIS_URL: z.string().optional(),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof envSchema>;
