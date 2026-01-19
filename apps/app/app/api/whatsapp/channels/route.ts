import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { detectContext, getConfig } from '@/lib/auth/config'

const BACKBONE_URL = process.env.BACKBONE_INERNAL_URL!
const TIMEOUT_MS = 15000

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
 * GET /api/whatsapp/channels
 * List all WhatsApp channels
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(`${BACKBONE_URL}/backbone/whatsapp/channels`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'x-user-id': userId,
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: `Backbone returned ${res.status}` }))
      return NextResponse.json(errorBody, { status: res.status })
    }

    const data = await res.json()
    // Wrap in { channels: ... } format if backend returns { data: [...] }
    // Frontend expects { data: { channels: [...] } }
    if (data.data && Array.isArray(data.data)) {
      return NextResponse.json({ data: { channels: data.data } })
    }
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

/**
 * POST /api/whatsapp/channels
 * Create a new WhatsApp channel
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(`${BACKBONE_URL}/backbone/whatsapp/channels`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(body),
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: `Backbone returned ${res.status}` }))
      return NextResponse.json(errorBody, { status: res.status })
    }

    const data = await res.json()
    // Wrap in { channel: ... } format if backend returns { data: { id, ... } }
    // Frontend expects { data: { channel: { id, ... } } }
    if (data.data && data.data.id && !data.data.channel) {
      return NextResponse.json({ data: { channel: data.data } }, { status: 201 })
    }
    return NextResponse.json(data, { status: 201 })
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
