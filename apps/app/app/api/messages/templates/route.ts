import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let sql = `
      SELECT id, name, description, category, channels, variables, settings, source,
             created_at, updated_at
      FROM message_templates
    `
    const params: string[] = []

    if (category) {
      sql += ` WHERE category = $1`
      params.push(category)
    }

    sql += ` ORDER BY category, name`

    const templates = await query(sql, params)

    return NextResponse.json({ data: templates })
  } catch (error) {
    console.error("Failed to fetch templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}
