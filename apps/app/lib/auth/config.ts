export type AuthContext = 'team' | 'customer'

export interface ContextConfig {
  jwtSecret: string
  accessTTL: number  // seconds
  refreshTTL: number // seconds
  accessCookie: string
  refreshCookie: string
}

const configs: Record<AuthContext, ContextConfig> = {
  team: {
    jwtSecret: process.env.JWT_SECRET_TEAM || process.env.JWT_SECRET || 'dev-secret-team-minimum-32-characters',
    accessTTL: parseInt(process.env.JWT_ACCESS_TTL_TEAM || '900'), // 15 minutes
    refreshTTL: parseInt(process.env.JWT_REFRESH_TTL_TEAM || '86400'), // 24 hours
    accessCookie: process.env.AUTH_COOKIE_ACCESS_TEAM || 'access-team',
    refreshCookie: process.env.AUTH_COOKIE_REFRESH_TEAM || 'refresh-team',
  },
  customer: {
    jwtSecret: process.env.JWT_SECRET_CUSTOMER || process.env.JWT_SECRET || 'dev-secret-customer-minimum-32-chars',
    accessTTL: parseInt(process.env.JWT_ACCESS_TTL_CUSTOMER || '900'), // 15 minutes
    refreshTTL: parseInt(process.env.JWT_REFRESH_TTL_CUSTOMER || '604800'), // 7 days
    accessCookie: process.env.AUTH_COOKIE_ACCESS_CUSTOMER || 'access-customer',
    refreshCookie: process.env.AUTH_COOKIE_REFRESH_CUSTOMER || 'refresh-customer',
  },
}

export function getConfig(context: AuthContext): ContextConfig {
  return configs[context]
}

export function detectContext(pathname: string): AuthContext {
  return pathname.startsWith('/portal') ? 'customer' : 'team'
}
