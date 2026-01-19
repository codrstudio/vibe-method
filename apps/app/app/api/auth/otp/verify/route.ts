import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { redis } from '@/lib/redis'
import { generateTokens, saveRefreshToken } from '@/lib/auth/tokens'
import { setAccessCookie, setRefreshCookie } from '@/lib/auth/cookies'
import { detectContext, AuthContext } from '@/lib/auth/config'

interface User {
  id: string
  email: string
  name: string
  role: string
  phone: string | null
  is_active: boolean
}

interface OtpData {
  code: string
  attempts: number
  createdAt: number
}

// Keys
const OTP_KEY_PREFIX = 'otp:'

function otpKey(email: string): string {
  return `${OTP_KEY_PREFIX}${email.toLowerCase()}`
}

// Config
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e codigo sao obrigatorios' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase()
    const key = otpKey(emailLower)

    // Busca OTP do Redis
    const data = await redis.get(key)
    if (!data) {
      return NextResponse.json(
        { error: 'Codigo expirado ou inexistente. Solicite um novo codigo.' },
        { status: 400 }
      )
    }

    const otpData: OtpData = JSON.parse(data)

    // Verifica tentativas
    if (otpData.attempts >= OTP_MAX_ATTEMPTS) {
      await redis.del(key)
      return NextResponse.json(
        { error: 'Numero maximo de tentativas excedido. Solicite um novo codigo.' },
        { status: 401 }
      )
    }

    // Verifica codigo
    if (otpData.code !== code) {
      otpData.attempts++
      const attemptsRemaining = OTP_MAX_ATTEMPTS - otpData.attempts

      // Atualiza tentativas
      const ttl = await redis.ttl(key)
      if (ttl > 0) {
        await redis.setex(key, ttl, JSON.stringify(otpData))
      }

      return NextResponse.json(
        {
          error: 'Codigo invalido',
          attemptsRemaining,
        },
        { status: 401 }
      )
    }

    // Codigo valido - remove do Redis
    await redis.del(key)

    // Busca usuario
    const user = await queryOne<User>(
      `SELECT id, email, name, role, phone, is_active FROM users WHERE email = $1`,
      [emailLower]
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario nao encontrado' },
        { status: 404 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Usuario inativo' },
        { status: 401 }
      )
    }

    // Detect context from referer or default to team
    const referer = request.headers.get('referer') || ''
    const context: AuthContext = referer.includes('/portal') ? 'customer' : 'team'

    // Get IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown'
    const userAgent = request.headers.get('user-agent') || ''

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
    console.error('OTP verify error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar codigo' },
      { status: 500 }
    )
  }
}
