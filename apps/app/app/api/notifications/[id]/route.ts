import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { verifyJWT } from "@/lib/auth/jwt"
import { detectContext, getConfig } from "@/lib/auth/config"

interface NotificationRow {
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

interface Notification {
  id: string
  type: string
  title: string
  message: string
  userId: string
  status: string
  metadata: Record<string, unknown> | null
  actionUrl: string | null
  readAt: string | null
  createdAt: string
  updatedAt: string
}

function toCamelCase(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    userId: row.user_id,
    status: row.status,
    metadata: row.metadata,
    actionUrl: row.action_url,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
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

export async function GET(
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

    const row = await queryOne<NotificationRow>(
      `SELECT id, type, title, message, user_id, status, metadata, action_url,
              read_at, created_at, updated_at
       FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    )

    if (!row) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: toCamelCase(row) })
  } catch (error) {
    console.error("Failed to fetch notification:", error)
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const [deleted] = await query<{ id: string }>(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    )

    if (!deleted) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("Failed to delete notification:", error)
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    )
  }
}
