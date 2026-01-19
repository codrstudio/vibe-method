import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { detectContext, getConfig } from '@/lib/auth/config'

const BACKBONE_URL = process.env.BACKBONE_INERNAL_URL!
const TIMEOUT_MS = 30000 // Longer timeout for message sending

async function getUserId(request: NextRequest): Promise<string | null> {
  const pathname = request.nextUrl.pathname
  const context = detectContext(pathname)
  const config = getConfig(context)
  const accessToken = request.cookies.get(config.accessCookie)?.value

  if (!accessToken) return null

  const payload = await verifyJWT(accessToken, context)
  return payload?.sub ?? null
}

/**
 * POST /api/whatsapp/test-message
 * Send a test message through a specific channel
 * Body: { channelId: string, to: string, text: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, to, text } = body

    if (!channelId || !to || !text) {
      return NextResponse.json(
        { error: 'channelId, to, and text are required' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(`${BACKBONE_URL}/backbone/whatsapp/test`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ channelId, to, text }),
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: `Backbone returned ${res.status}` }))
      return NextResponse.json(errorBody, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 })
    }

    return NextResponse.json(
      { error: 'Unable to connect to backbone', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    )
  }
}
