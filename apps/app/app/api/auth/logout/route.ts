import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { revokeRefreshToken } from '@/lib/auth/tokens'
import { detectContext, AuthContext, getConfig } from '@/lib/auth/config'

export async function POST(request: NextRequest) {
  try {
    // Detect context
    const referer = request.headers.get('referer') || ''
    const context: AuthContext = referer.includes('/portal') ? 'customer' : 'team'
    const config = getConfig(context)

    // Get access token to identify user
    const accessToken = request.cookies.get(config.accessCookie)?.value

    if (accessToken) {
      const payload = await verifyJWT(accessToken, context)
      if (payload?.sub) {
        // Revoke all refresh tokens for this user
        await revokeRefreshToken(payload.sub)
      }
    }

    // Create response and clear cookies
    const response = NextResponse.json({ success: true })
    clearAuthCookies(response, context)

    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Even on error, clear cookies
    const referer = request.headers.get('referer') || ''
    const context: AuthContext = referer.includes('/portal') ? 'customer' : 'team'
    const response = NextResponse.json({ success: true })
    clearAuthCookies(response, context)
    return response
  }
}
