import { NextRequest } from 'next/server'
import { queryOne } from '@/lib/db'
import { generateAvatarSVG } from '@/lib/avatar'

interface User {
  id: string
  name: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params

  // Try to find user by ID or email
  const isEmail = identifier.includes('@')

  const user = await queryOne<User>(
    isEmail
      ? `SELECT id, name FROM users WHERE email = $1`
      : `SELECT id, name FROM users WHERE id = $1`,
    [identifier]
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
