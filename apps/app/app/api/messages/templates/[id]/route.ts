import { NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

interface MessageTemplate {
  id: string
  name: string
  description: string | null
  category: string
  channels: Record<string, unknown>
  variables: unknown[]
  settings: Record<string, unknown>
  source: string
  created_at: string
  updated_at: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await queryOne<MessageTemplate>(
      `SELECT id, name, description, category, channels, variables, settings, source,
              created_at, updated_at
       FROM message_templates
       WHERE id = $1`,
      [id]
    )

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: template })
  } catch (error) {
    console.error("Failed to fetch template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const sets: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      sets.push(`name = $${paramIndex++}`)
      values.push(body.name)
    }

    if (body.description !== undefined) {
      sets.push(`description = $${paramIndex++}`)
      values.push(body.description)
    }

    if (body.channels !== undefined) {
      sets.push(`channels = $${paramIndex++}`)
      values.push(JSON.stringify(body.channels))
    }

    if (body.settings !== undefined) {
      sets.push(`settings = $${paramIndex++}`)
      values.push(JSON.stringify(body.settings))
    }

    // Marca como custom
    sets.push(`source = 'custom'`)
    sets.push(`updated_at = NOW()`)

    values.push(id)

    const result = await query<MessageTemplate>(
      `UPDATE message_templates
       SET ${sets.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, name, description, category, channels, variables, settings, source,
                 created_at, updated_at`,
      values
    )

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error("Failed to update template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    )
  }
}
