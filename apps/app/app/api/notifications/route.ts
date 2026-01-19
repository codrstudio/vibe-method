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
    const status = searchParams.get("status")
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"

    let sql = `
      SELECT id, type, title, message, user_id, status, metadata, action_url,
             read_at, created_at, updated_at
      FROM notifications
      WHERE user_id = $1
    `
    const params: (string | number)[] = [userId]

    if (status) {
      sql += ` AND status = $2`
      params.push(status)
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(limit, 10), parseInt(offset, 10))

    const notifications = await query<Notification>(sql, params)

    return NextResponse.json({ data: notifications })
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: "Nao autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, title, message, metadata, actionUrl } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title and message are required" },
        { status: 400 }
      )
    }

    if (!["info", "warning", "error", "task"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be info, warning, error, or task" },
        { status: 400 }
      )
    }

    const [notification] = await query<Notification>(
      `INSERT INTO notifications (type, title, message, user_id, metadata, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, title, message, user_id, status, metadata, action_url,
                 read_at, created_at, updated_at`,
      [type, title, message, userId, metadata ? JSON.stringify(metadata) : null, actionUrl ?? null]
    )

    return NextResponse.json({ data: notification }, { status: 201 })
  } catch (error) {
    console.error("Failed to create notification:", error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
}
