import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { redis } from '@/lib/redis'
import { sendEmail, isSmtpConfigured } from '@/lib/email'

interface User {
  id: string
  email: string
  name: string
  is_active: boolean
}

interface MessageTemplate {
  id: string
  channels: {
    email?: {
      enabled: boolean
      subject?: string
      body_html?: string
      body_text?: string
    }
  }
}

// Keys
const OTP_KEY_PREFIX = 'otp:'
const RATE_LIMIT_KEY_PREFIX = 'otp:rate:'

function otpKey(email: string): string {
  return `${OTP_KEY_PREFIX}${email.toLowerCase()}`
}

function rateLimitKey(email: string): string {
  return `${RATE_LIMIT_KEY_PREFIX}${email.toLowerCase()}`
}

// Config
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6')
const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '5')
const OTP_RATE_LIMIT_SECONDS = parseInt(process.env.OTP_RATE_LIMIT_SECONDS || '60')

function generateOtpCode(length: number = 6): string {
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return code
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  const globalVars = {
    app_name: process.env.APP_NAME || 'App',
    app_url: process.env.APP_BASE_URL || 'http://localhost:8000',
    current_year: new Date().getFullYear().toString(),
    support_email: process.env.SUPPORT_EMAIL || 'suporte@example.com',
  }
  const allVars = { ...globalVars, ...variables }
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return allVars[key as keyof typeof allVars] ?? match
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase()

    // Verifica se SMTP esta configurado
    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      )
    }

    // Verifica rate limit
    const rateLimitData = await redis.get(rateLimitKey(emailLower))
    if (rateLimitData) {
      const ttl = await redis.ttl(rateLimitKey(emailLower))
      return NextResponse.json(
        {
          error: 'Aguarde antes de solicitar um novo codigo',
          retryAfter: ttl > 0 ? ttl : OTP_RATE_LIMIT_SECONDS
        },
        { status: 429 }
      )
    }

    // Busca usuario
    const user = await queryOne<User>(
      `SELECT id, email, name, is_active FROM users WHERE email = $1`,
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

    // Gera codigo OTP
    const code = generateOtpCode(OTP_LENGTH)
    const otpData = {
      code,
      attempts: 0,
      createdAt: Date.now(),
    }

    // Salva no Redis com TTL
    const ttlSeconds = OTP_TTL_MINUTES * 60
    await redis.setex(otpKey(emailLower), ttlSeconds, JSON.stringify(otpData))

    // Define rate limit
    await redis.setex(rateLimitKey(emailLower), OTP_RATE_LIMIT_SECONDS, '1')

    // Busca template de email
    const template = await queryOne<MessageTemplate>(
      `SELECT id, channels FROM message_templates WHERE id = $1`,
      ['otp-login']
    )

    if (!template || !template.channels.email) {
      return NextResponse.json(
        { error: 'Template de email nao encontrado' },
        { status: 500 }
      )
    }

    const emailConfig = template.channels.email
    const variables = {
      user_name: user.name || emailLower.split('@')[0],
      user_email: emailLower,
      otp_code: code,
      ttl_minutes: OTP_TTL_MINUTES.toString(),
    }

    // Envia email
    await sendEmail({
      to: emailLower,
      subject: renderTemplate(emailConfig.subject || '{{otp_code}} - Codigo de acesso', variables),
      html: renderTemplate(emailConfig.body_html || '', variables),
      text: renderTemplate(emailConfig.body_text || '', variables),
    })

    return NextResponse.json({
      success: true,
      message: 'Codigo enviado para seu email',
    })
  } catch (error) {
    console.error('OTP request error:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar codigo' },
      { status: 500 }
    )
  }
}
