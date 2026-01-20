import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { detectContext, getConfig } from "@/lib/auth/config"

async function getUserId(request: NextRequest): Promise<string | null> {
  const pathname = request.nextUrl.pathname
  const context = detectContext(pathname)
  const config = getConfig(context)
  const accessToken = request.cookies.get(config.accessCookie)?.value

  if (!accessToken) return null

  const payload = await verifyJWT(accessToken, context)
  return payload?.sub ?? null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: "Nao autenticado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { targetTag } = body

    if (!targetTag) {
      return NextResponse.json(
        { error: "targetTag is required" },
        { status: 400 }
      )
    }

    // Call backbone service for transition validation
    const backboneUrl = process.env.BACKBONE_URL || "http://localhost:8002"
    const response = await fetch(`${backboneUrl}/backbone/tasks/${id}/transition`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ targetTag }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || "Failed to transition task" },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to transition task:", error)
    return NextResponse.json(
      { error: "Failed to transition task" },
      { status: 500 }
    )
  }
}
