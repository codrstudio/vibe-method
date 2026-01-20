import { NextRequest, NextResponse } from 'next/server'

// Server-side URL (internal network or localhost for dev)
const WA_SIM_URL = process.env.WA_SIM_INTERNAL_URL || process.env.WA_SIM_URL || 'http://localhost:8003'
const TIMEOUT_MS = 10000

type Props = {
  params: Promise<{ path: string[] }>
}

/**
 * Generic proxy to wa-sim (WhatsApp Simulator)
 * Routes: /api/system/wa-sim/* -> wa-sim/*
 */
async function proxyToSimulator(
  request: NextRequest,
  pathSegments: string[],
  method: string
): Promise<NextResponse> {
  const path = pathSegments.join('/')
  const url = `${WA_SIM_URL}/${path}`

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

    // Include body for POST/PUT/PATCH
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        const text = await request.text()
        if (text && text.length > 0) {
          // Validate it's valid JSON before forwarding
          JSON.parse(text)
          fetchOptions.body = text
        } else {
          // No body - remove Content-Type to avoid Fastify error
          delete headers['Content-Type']
        }
      } catch {
        // Invalid JSON - remove Content-Type header
        delete headers['Content-Type']
      }
    }

    const res = await fetch(url, fetchOptions)
    clearTimeout(timeoutId)

    // For non-OK responses, try to get error details
    if (!res.ok) {
      let errorBody
      try {
        errorBody = await res.json()
      } catch {
        errorBody = { error: `Simulator returned ${res.status}` }
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
      { error: 'Unable to connect to simulator', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    )
  }
}

export async function GET(request: NextRequest, props: Props) {
  const { path } = await props.params
  return proxyToSimulator(request, path, 'GET')
}

export async function POST(request: NextRequest, props: Props) {
  const { path } = await props.params
  return proxyToSimulator(request, path, 'POST')
}

export async function PUT(request: NextRequest, props: Props) {
  const { path } = await props.params
  return proxyToSimulator(request, path, 'PUT')
}

export async function DELETE(request: NextRequest, props: Props) {
  const { path } = await props.params
  return proxyToSimulator(request, path, 'DELETE')
}
