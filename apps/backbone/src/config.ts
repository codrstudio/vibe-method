import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Server
  BACKBONE_PORT: z.coerce.number(),
  HOST: z.string().default('0.0.0.0'),

  // Database (POSTGRES_MAIN_URL ou DATABASE_URL)
  POSTGRES_MAIN_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),

  // LLM - OpenRouter
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  OPENROUTER_DEFAULT_MODEL: z.string().default('google/gemini-2.0-flash-001'),

  // LLM - Ollama (local)
  OLLAMA_AVAILABLE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  OLLAMA_URL: z.string().optional(),
  OLLAMA_MAX_PARAMS: z.string().default('13B'),
  OLLAMA_ALLOWED_QUANTS: z
    .string()
    .transform((val) => val.split(',').map((q) => q.trim()))
    .default('q4_K_M,q4_K_S,q5_K_M'),

  // Evolution API (WhatsApp)
  EVOLUTION_API_URL: z.string().optional(),
  EVOLUTION_API_KEY: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // SMTP (Email)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // App Info (para templates)
  APP_NAME: z.string().default('CIA Dashboard'),
  APP_BASE_URL: z.string().default('http://localhost:3000'),
  SUPPORT_EMAIL: z.string().email().optional(),

  // OTP Settings
  OTP_LENGTH: z.coerce.number().default(6),
  OTP_TTL_MINUTES: z.coerce.number().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  OTP_RATE_LIMIT_SECONDS: z.coerce.number().default(60),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();

// Helper para obter URL do database (suporta POSTGRES_MAIN_URL ou DATABASE_URL)
export function getDatabaseUrl(): string | undefined {
  return config.POSTGRES_MAIN_URL || config.DATABASE_URL;
}

// Helper para obter URL do Redis
export function getRedisUrl(): string | undefined {
  return config.REDIS_URL;
}

export type Config = z.infer<typeof envSchema>;
