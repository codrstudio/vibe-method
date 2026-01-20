import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

type AuthContext = 'team' | 'customer'

// Prefixos conhecidos e seus login paths
const PREFIX_CONFIG: Record<string, { context: AuthContext; loginPath: string }> = {
  app: { context: 'team', loginPath: '/app/login' },
  portal: { context: 'customer', loginPath: '/portal/login' },
}

// Rotas publicas (sem necessidade de autenticacao)
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/otp',
  '/api/health',
  '/api/system/pulse',
]

// Prefixos estaticos (assets, etc)
const STATIC_PREFIXES = [
  '/_next',
  '/favicon',
  '/brand',
  '/icons',
]

function getConfig(context: AuthContext) {
  if (context === 'customer') {
    return {
      jwtSecret: process.env.JWT_SECRET_CUSTOMER || process.env.JWT_SECRET || 'dev-secret-customer-minimum-32-chars',
      accessCookie: process.env.AUTH_COOKIE_ACCESS_CUSTOMER || 'access-customer',
      refreshCookie: process.env.AUTH_COOKIE_REFRESH_CUSTOMER || 'refresh-customer',
    }
  }
  return {
    jwtSecret: process.env.JWT_SECRET_TEAM || process.env.JWT_SECRET || 'dev-secret-team-minimum-32-characters',
    accessCookie: process.env.AUTH_COOKIE_ACCESS_TEAM || 'access-team',
    refreshCookie: process.env.AUTH_COOKIE_REFRESH_TEAM || 'refresh-team',
  }
}

async function verifyToken(token: string, context: AuthContext): Promise<boolean> {
  const config = getConfig(context)
  const secret = new TextEncoder().encode(config.jwtSecret)

  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

function getPrefix(pathname: string): string | null {
  const match = pathname.match(/^\/([^\/]+)/)
  return match ? match[1] : null
}

function isLoginPath(pathname: string, prefix: string): boolean {
  return pathname === `/${prefix}/login`
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static files - allow
  if (STATIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // File extensions - allow
  if (pathname.includes('.')) {
    return NextResponse.next()
  }

  // Public API routes - allow
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Root path (/) - redirect based on auth
  if (pathname === '/') {
    const config = getConfig('team')
    const accessToken = request.cookies.get(config.accessCookie)?.value

    if (accessToken && await verifyToken(accessToken, 'team')) {
      return NextResponse.redirect(new URL('/app', request.url))
    }
    return NextResponse.redirect(new URL('/app/login', request.url))
  }

  // Get prefix from path
  const prefix = getPrefix(pathname)

  // API routes (except public ones) - need auth with refresh support
  if (prefix === 'api') {
    // Detect context from referer (API calls come from pages)
    const referer = request.headers.get('referer') || ''
    const context: AuthContext = referer.includes('/portal') ? 'customer' : 'team'
    const authConfig = getConfig(context)
    const accessToken = request.cookies.get(authConfig.accessCookie)?.value
    const isValid = accessToken ? await verifyToken(accessToken, context) : false

    if (isValid) {
      return NextResponse.next()
    }

    // Try refresh token
    const refreshToken = request.cookies.get(authConfig.refreshCookie)?.value
    if (refreshToken) {
      try {
        const refreshUrl = new URL('/api/auth/refresh', request.url)
        const refreshResponse = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            Cookie: `${authConfig.refreshCookie}=${refreshToken}`,
            Referer: referer,
          },
        })

        if (refreshResponse.ok) {
          const response = NextResponse.next()
          const setCookieHeader = refreshResponse.headers.get('set-cookie')
          if (setCookieHeader) {
            response.headers.set('set-cookie', setCookieHeader)
          }
          return response
        }
      } catch (error) {
        console.error('Middleware API refresh error:', error)
      }
    }

    // Not authenticated - return 401 for API routes
    return NextResponse.json(
      { success: false, error: 'Nao autenticado' },
      { status: 401 }
    )
  }

  // Unknown prefix (not app, portal, or api) - allow
  if (!prefix || !PREFIX_CONFIG[prefix]) {
    return NextResponse.next()
  }

  const prefixConfig = PREFIX_CONFIG[prefix]
  const authConfig = getConfig(prefixConfig.context)
  const accessToken = request.cookies.get(authConfig.accessCookie)?.value
  const isValid = accessToken ? await verifyToken(accessToken, prefixConfig.context) : false

  // Login page - redirect to app if already logged in
  if (isLoginPath(pathname, prefix)) {
    if (isValid) {
      // Already logged in - redirect to callbackUrl or prefix root
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
      const redirectTo = callbackUrl || `/${prefix}`
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    // Not logged in - allow login page
    return NextResponse.next()
  }

  // Protected route - check auth
  if (isValid) {
    return NextResponse.next()
  }

  // Try refresh token
  const refreshToken = request.cookies.get(authConfig.refreshCookie)?.value
  if (refreshToken) {
    try {
      const refreshUrl = new URL('/api/auth/refresh', request.url)
      const refreshResponse = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          Cookie: `${authConfig.refreshCookie}=${refreshToken}`,
        },
      })

      if (refreshResponse.ok) {
        const response = NextResponse.next()
        const setCookieHeader = refreshResponse.headers.get('set-cookie')
        if (setCookieHeader) {
          response.headers.set('set-cookie', setCookieHeader)
        }
        return response
      }
    } catch (error) {
      console.error('Middleware refresh error:', error)
    }
  }

  // Not authenticated - redirect to login with callbackUrl
  const loginUrl = new URL(prefixConfig.loginPath, request.url)
  loginUrl.searchParams.set('callbackUrl', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
