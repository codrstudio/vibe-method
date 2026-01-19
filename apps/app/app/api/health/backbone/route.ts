import { NextResponse } from 'next/server'

// Server-side URL (internal network)
const BACKBONE_URL = process.env.BACKBONE_INERNAL_URL!

/**
 * Health check for backbone service
 *
 * This is a simplified endpoint for basic health checks.
 * For detailed monitoring, use /api/system/pulse/* endpoints.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') || 'health'

  // Only allow k8s probe endpoints
  const allowedEndpoints = ['health', 'health/live', 'health/ready']
  if (!allowedEndpoints.includes(endpoint)) {
    // Redirect to Pulse for other health endpoints
    return NextResponse.json(
      { error: 'Use /api/system/pulse for detailed monitoring', redirect: '/api/system/pulse' },
      { status: 400 }
    )
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${BACKBONE_URL}/backbone/${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Backbone service error', status: res.status },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Backbone service timeout' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Unable to connect to backbone' },
      { status: 503 }
    )
  }
}
