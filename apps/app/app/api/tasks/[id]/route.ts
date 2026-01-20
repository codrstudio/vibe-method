import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyJWT } from "@/lib/auth/jwt"
import { detectContext, getConfig } from "@/lib/auth/config"

interface Task {
  id: string
  type: string
  class: string
  title: string
  message: string
  user_id: string
  status: string
  metadata: Record<string, unknown> | null
  action_url: string | null
  meta_tags: string[]
  tags: string[]
  workflow: Record<string, unknown>
  color: string | null
  icon: string | null
  assignee_id: string | null
  due_at: string | null
  closed_at: string | null
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

const TASK_COLUMNS = `
  id, type, class, title, message, user_id, status, metadata, action_url,
  meta_tags, tags, workflow, color, icon, assignee_id, due_at, closed_at,
  read_at, created_at, updated_at
`

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

    const [task] = await query<Task>(
      `SELECT ${TASK_COLUMNS} FROM notifications WHERE id = $1 AND class IS NOT NULL AND user_id = $2`,
      [id, userId]
    )

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: task })
  } catch (error) {
    console.error("Failed to fetch task:", error)
    return NextResponse.json(
      { error: "Failed to fetch task" },
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

    const result = await query(
      `DELETE FROM notifications WHERE id = $1 AND class IS NOT NULL AND user_id = $2`,
      [id, userId]
    )

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("Failed to delete task:", error)
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    )
  }
}
