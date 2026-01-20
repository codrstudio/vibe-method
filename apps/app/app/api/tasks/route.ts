import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyJWT } from "@/lib/auth/jwt"
import { detectContext, getConfig } from "@/lib/auth/config"

interface TaskRow {
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

interface Task {
  id: string
  type: string
  class: string
  title: string
  message: string
  userId: string
  status: string
  metadata: Record<string, unknown> | null
  actionUrl: string | null
  metaTags: string[]
  tags: string[]
  workflow: Record<string, unknown>
  color: string | null
  icon: string | null
  assigneeId: string | null
  dueAt: string | null
  closedAt: string | null
  readAt: string | null
  createdAt: string
  updatedAt: string
}

function toCamelCase(row: TaskRow): Task {
  return {
    id: row.id,
    type: row.type,
    class: row.class,
    title: row.title,
    message: row.message,
    userId: row.user_id,
    status: row.status,
    metadata: row.metadata,
    actionUrl: row.action_url,
    metaTags: row.meta_tags,
    tags: row.tags,
    workflow: row.workflow,
    color: row.color,
    icon: row.icon,
    assigneeId: row.assignee_id,
    dueAt: row.due_at,
    closedAt: row.closed_at,
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

const TASK_COLUMNS = `
  id, type, class, title, message, user_id, status, metadata, action_url,
  meta_tags, tags, workflow, color, icon, assignee_id, due_at, closed_at,
  read_at, created_at, updated_at
`

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
    const tag = searchParams.get("tag")
    const assigneeId = searchParams.get("assigneeId")
    const status = searchParams.get("status") // 'open' | 'closed'
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"

    let sql = `SELECT ${TASK_COLUMNS} FROM notifications WHERE class IS NOT NULL AND user_id = $1`
    const params: (string | number)[] = [userId]

    if (taskClass) {
      params.push(taskClass)
      sql += ` AND class = $${params.length}`
    }

    if (tag) {
      params.push(JSON.stringify([tag]))
      sql += ` AND tags @> $${params.length}`
    }

    if (assigneeId) {
      params.push(assigneeId)
      sql += ` AND assignee_id = $${params.length}`
    }

    if (status === "open") {
      sql += ` AND closed_at IS NULL`
    } else if (status === "closed") {
      sql += ` AND closed_at IS NOT NULL`
    }

    sql += ` ORDER BY created_at DESC`
    params.push(parseInt(limit, 10), parseInt(offset, 10))
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`

    const rows = await query<TaskRow>(sql, params)
    const tasks = rows.map(toCamelCase)

    return NextResponse.json({ data: tasks })
  } catch (error) {
    console.error("Failed to fetch tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
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
    const { class: taskClass, title, message, assigneeId, metadata, actionUrl, dueAt } = body

    if (!taskClass || !title || !message) {
      return NextResponse.json(
        { error: "class, title and message are required" },
        { status: 400 }
      )
    }

    // Fetch from backbone service which handles workflow initialization
    const backboneUrl = process.env.BACKBONE_URL || "http://localhost:8002"
    const response = await fetch(`${backboneUrl}/backbone/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({
        class: taskClass,
        title,
        message,
        assigneeId,
        metadata,
        actionUrl,
        dueAt,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || "Failed to create task" },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Failed to create task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}
