/**
 * Socket Server Configuration
 *
 * Loads configuration from environment variables.
 * Follows vibe-method ENV pattern with PORT_PREFIX composition.
 */

export const config = {
  // Server
  port: parseInt(process.env.SOCKET_PORT || '8001', 10),
  environment: process.env.ENVIRONMENT || 'development',

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // JWT (usa JWT_SECRET_TEAM para contexto team, com fallbacks)
  jwt: {
    secretTeam: process.env.JWT_SECRET_TEAM || process.env.JWT_SECRET || 'development-secret-change-me',
    secretCustomer: process.env.JWT_SECRET_CUSTOMER || process.env.JWT_SECRET || 'development-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    origin: process.env.APP_BASE_URL || 'http://localhost:3000',
    credentials: true,
  },

  // Presence
  presence: {
    heartbeatInterval: 30000, // 30 seconds
    gracePeriod: 60000, // 60 seconds
    ttl: 300, // 300 seconds (5 minutes) in Redis
  },
} as const;

export type Config = typeof config;
