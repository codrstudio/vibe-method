import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
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

    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    )

    const count = parseInt(result?.count ?? "0", 10)

    return NextResponse.json({ data: { count } })
  } catch (error) {
    console.error("Failed to fetch notification count:", error)
    return NextResponse.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    )
  }
}
