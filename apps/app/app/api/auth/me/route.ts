import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { detectContext, AuthContext, getConfig } from '@/lib/auth/config'

interface User {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
}

export async function GET(request: NextRequest) {
  try {
    // Detect context
    const pathname = request.nextUrl.pathname
    const context: AuthContext = pathname.includes('/portal') ? 'customer' : 'team'
    const config = getConfig(context)

    // Get access token from cookie
    const accessToken = request.cookies.get(config.accessCookie)?.value

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Nao autenticado' },
        { status: 401 }
      )
    }

    // Verify JWT
    const payload = await verifyJWT(accessToken, context)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token invalido' },
        { status: 401 }
      )
    }

    // Get fresh user data from database
    const user = await queryOne<User>(
      `SELECT id, email, name, role, is_active FROM users WHERE id = $1`,
      [payload.sub]
    )

    if (!user || !user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Usuario nao encontrado ou inativo' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: '/app/profile/avatar',
      },
    })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
