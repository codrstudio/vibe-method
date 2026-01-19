import { NextRequest } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { getConfig } from '@/lib/auth/config'
import { generateAvatarSVG } from '@/lib/avatar'

interface User {
  id: string
  name: string
}

export async function GET(request: NextRequest) {
  const config = getConfig('team')

  // Get access token from cookie
  const accessToken = request.cookies.get(config.accessCookie)?.value

  if (!accessToken) {
    return new Response('Nao autenticado', { status: 401 })
  }

  // Verify JWT
  const payload = await verifyJWT(accessToken, 'team')
  if (!payload) {
    return new Response('Token invalido', { status: 401 })
  }

  // Get user from database
  const user = await queryOne<User>(
    `SELECT id, name FROM users WHERE id = $1`,
    [payload.sub]
  )

  if (!user) {
    return new Response('Usuario nao encontrado', { status: 404 })
  }

  // Generate SVG
  const svg = generateAvatarSVG(user.name, 80)

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
