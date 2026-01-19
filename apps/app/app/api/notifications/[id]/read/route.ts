import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyJWT } from "@/lib/auth/jwt"
import { detectContext, getConfig } from "@/lib/auth/config"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  user_id: string
  status: string
  metadata: Record<string, unknown> | null
  action_url: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const pathname = request.nextUrl.pathname
  const context = detectContext(pathname)
  const config = getConfig(context)
  const accessToken = request.cookies.get(config.accessCookie)?.value

  if (!accessToken) return null

  const payload = await verifyJWT(accessToken, context)
  return payload?.sub ?? null
}

export async function PATCH(
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

    const [notification] = await query<Notification>(
      `UPDATE notifications
       SET status = 'read', read_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, type, title, message, user_id, status, metadata, action_url,
                 read_at, created_at, updated_at`,
      [id, userId]
    )

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: notification })
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    )
  }
}
