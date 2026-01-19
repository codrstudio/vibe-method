import { NextRequest, NextResponse } from 'next/server'

// Server-side URL (internal network)
const BACKBONE_URL = process.env.BACKBONE_INERNAL_URL!
const TIMEOUT_MS = 10000

type Props = {
  params: Promise<{ path: string[] }>
}

/**
 * Generic proxy to /backbone/pulse/*
 * No whitelist - errors propagate from backbone
 */
async function proxyToBackbone(
  request: NextRequest,
  pathSegments: string[],
  method: string
): Promise<NextResponse> {
  const path = pathSegments.join('/')
  const url = `${BACKBONE_URL}/backbone/pulse/${path}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }

    // Propagate authorization if present
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const fetchOptions: RequestInit = {
      method,
      signal: controller.signal,
      headers,
    }

    // Include body for POST/PUT
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        const body = await request.json()
        fetchOptions.body = JSON.stringify(body)
      } catch {
        // No body or invalid JSON - that's ok
      }
    }

    const res = await fetch(url, fetchOptions)
    clearTimeout(timeoutId)

    // Handle SSE (Server-Sent Events) specially
    if (res.headers.get('content-type')?.includes('text/event-stream')) {
      return new NextResponse(res.body, {
        status: res.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // For non-OK responses, try to get error details
    if (!res.ok) {
      let errorBody
      try {
        errorBody = await res.json()
      } catch {
        errorBody = { error: `Backbone returned ${res.status}` }
      }

      return NextResponse.json(errorBody, { status: res.status })
    }

    // Parse and return response
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Unable to connect to backbone', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    )
  }
}

export async function GET(request: NextRequest, props: Props) {
  const { path } = await props.params
  return proxyToBackbone(request, path, 'GET')
}

export async function POST(request: NextRequest, props: Props) {
  const { path } = await props.params
  return proxyToBackbone(request, path, 'POST')
}

export async function PUT(request: NextRequest, props: Props) {
  const { path } = await props.params
  return proxyToBackbone(request, path, 'PUT')
}

export async function DELETE(request: NextRequest, props: Props) {
  const { path } = await props.params
  return proxyToBackbone(request, path, 'DELETE')
}
