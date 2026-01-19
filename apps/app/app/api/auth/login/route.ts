import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { generateTokens, saveRefreshToken } from '@/lib/auth/tokens'
import { setAccessCookie, setRefreshCookie } from '@/lib/auth/cookies'
import { detectContext, AuthContext } from '@/lib/auth/config'

interface User {
  id: string
  email: string
  name: string
  role: string
  phone: string | null
  password_hash: string
  is_active: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha sao obrigatorios' },
        { status: 400 }
      )
    }

    // Detect context from referer or default to team
    const referer = request.headers.get('referer') || ''
    const context: AuthContext = referer.includes('/portal') ? 'customer' : 'team'

    // Find user
    const user = await queryOne<User>(
      `SELECT id, email, name, role, phone, password_hash, is_active FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )

    // Get IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown'
    const userAgent = request.headers.get('user-agent') || ''

    if (!user) {
      // Log failed attempt
      await query(
        `INSERT INTO login_history (user_id, ip_address, user_agent, success, failure_reason)
         VALUES (NULL, $1, $2, FALSE, 'user_not_found')`,
        [ipAddress, userAgent]
      )
      return NextResponse.json(
        { success: false, error: 'Email ou senha invalidos' },
        { status: 401 }
      )
    }

    if (!user.is_active) {
      await query(
        `INSERT INTO login_history (user_id, ip_address, user_agent, success, failure_reason)
         VALUES ($1, $2, $3, FALSE, 'user_inactive')`,
        [user.id, ipAddress, userAgent]
      )
      return NextResponse.json(
        { success: false, error: 'Usuario inativo' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      await query(
        `INSERT INTO login_history (user_id, ip_address, user_agent, success, failure_reason)
         VALUES ($1, $2, $3, FALSE, 'invalid_password')`,
        [user.id, ipAddress, userAgent]
      )
      return NextResponse.json(
        { success: false, error: 'Email ou senha invalidos' },
        { status: 401 }
      )
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(
      { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
      context
    )

    // Save refresh token to database
    await saveRefreshToken(
      user.id,
      refreshToken,
      context,
      { userAgent },
      ipAddress
    )

    // Log successful login
    await query(
      `INSERT INTO login_history (user_id, ip_address, user_agent, success)
       VALUES ($1, $2, $3, TRUE)`,
      [user.id, ipAddress, userAgent]
    )

    // Create response with cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    setAccessCookie(response, accessToken, context)
    setRefreshCookie(response, refreshToken, context)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
