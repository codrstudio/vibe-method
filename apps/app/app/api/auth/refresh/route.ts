import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { signJWT } from '@/lib/auth/jwt'
import { setAccessCookie, getRefreshToken } from '@/lib/auth/cookies'
import { detectContext, AuthContext, getConfig } from '@/lib/auth/config'

interface RefreshTokenRecord {
  id: string
  user_id: string
  token_hash: string
  expires_at: Date
  revoked_at: Date | null
}

interface User {
  id: string
  email: string
  name: string
  role: string
  phone: string | null
  is_active: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Detect context from referer or pathname
    const referer = request.headers.get('referer') || ''
    const context: AuthContext = referer.includes('/portal') ? 'customer' : 'team'
    const config = getConfig(context)

    // Get refresh token from cookie
    const refreshToken = request.cookies.get(config.refreshCookie)?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token nao encontrado' },
        { status: 401 }
      )
    }

    // Find all non-revoked, non-expired tokens for validation
    const tokens = await query<RefreshTokenRecord>(
      `SELECT id, user_id, token_hash, expires_at, revoked_at
       FROM refresh_tokens
       WHERE revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 100`,
      []
    )

    // Find matching token by verifying hash
    let matchedToken: RefreshTokenRecord | null = null
    for (const token of tokens) {
      const isMatch = await verifyPassword(refreshToken, token.token_hash)
      if (isMatch) {
        matchedToken = token
        break
      }
    }

    if (!matchedToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token invalido ou expirado' },
        { status: 401 }
      )
    }

    // Get user data
    const user = await queryOne<User>(
      `SELECT id, email, name, role, phone, is_active FROM users WHERE id = $1`,
      [matchedToken.user_id]
    )

    if (!user || !user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Usuario nao encontrado ou inativo' },
        { status: 401 }
      )
    }

    // Generate new access token
    const accessToken = await signJWT(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        context,
      },
      context
    )

    // Create response with new access cookie
    const response = NextResponse.json({ success: true })
    setAccessCookie(response, accessToken, context)

    return response
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
