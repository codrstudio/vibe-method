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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: "Nao autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const taskClass = searchParams.get("class")

    // Fetch grouped tasks from backbone
    const backboneUrl = process.env.BACKBONE_URL || "http://localhost:8002"
    const url = new URL(`${backboneUrl}/backbone/tasks/grouped`)
    if (taskClass) {
      url.searchParams.set("class", taskClass)
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-user-id": userId,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch grouped tasks" },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to fetch grouped tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch grouped tasks" },
      { status: 500 }
    )
  }
}
