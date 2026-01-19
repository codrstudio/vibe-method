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

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/whatsapp/assignments/[id]
 * Remove an assignment
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { id } = await params

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(`${BACKBONE_URL}/backbone/whatsapp/assignments/${id}`, {
      method: 'DELETE',
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

    return new NextResponse(null, { status: 204 })
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
